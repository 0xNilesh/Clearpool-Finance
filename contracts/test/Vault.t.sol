// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {AssetVault} from "../src/core/AssetVault.sol";
import {VaultFactory} from "../src/core/VaultFactory.sol";
import {UniswapV3Integration} from "../src/integrations/UniswapV3Integration.sol";
import {DexAdapter} from "../src/adapters/DexAdapter.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import {IValuationModule} from "../src/interfaces/IValuationModule.sol";
import {AdapterRegistry} from "../src/execution/AdapterRegistry.sol";
import {ValuationModule} from "../src/valuation/ValuationModule.sol";
import {GovernanceModule} from "../src/governance/GovernanceModule.sol";
import {Errors} from "../src/libraries/Errors.sol";
import {PerformanceFeeModule} from "../src/fees/PerformanceFeeModule.sol";

contract MockSwapRouter {
    ValuationModule public valuationModule;

    constructor(address _valuationModule) {
        valuationModule = ValuationModule(_valuationModule);
    }

    function exactInputSingle(ISwapRouter.ExactInputSingleParams calldata params) external returns (uint256 amountOut) {
        // Transfer input
        IERC20(params.tokenIn).transferFrom(msg.sender, address(this), params.amountIn);

        // Get price of tokenOut in base asset units (1e18)
        uint256 pricePerUnit = valuationModule.prices(params.tokenOut);
        if (pricePerUnit == 0) {
            pricePerUnit = 1e18; // fallback 1:1
        }

        // amountOut = input amount (in base raw units) / price per unit of tokenOut
        amountOut = (params.amountIn * 1e18) / pricePerUnit;

        // Enforce slippage protection
        require(amountOut >= params.amountOutMinimum, "Mock: slippage too high");

        // Send output tokens (router must be pre-funded)
        IERC20(params.tokenOut).transfer(params.recipient, amountOut);

        return amountOut;
    }
}

contract ComposableVaultTest is Test {
    VaultFactory public factory;
    AssetVault public vault;
    GovernanceModule public governance;
    UniswapV3Integration public uniswapIntegration;
    DexAdapter public dexAdapter;
    MockSwapRouter public mockRouter;
    IValuationModule public valuationModule;

    address public curator = makeAddr("curator");
    address public investor1 = makeAddr("investor1");
    address public investor2 = makeAddr("investor2");
    address public investor3 = makeAddr("investor3");

    ERC20Mock public usdc;
    ERC20Mock public weth;

    function setUp() public {
        address assetVaultImpl = address(new AssetVault());
        address adapterRegistryImpl = address(new AdapterRegistry());
        address valuationImpl = address(new ValuationModule());
        address feeImpl = address(new PerformanceFeeModule());
        address governanceImpl = address(new GovernanceModule());
        factory = new VaultFactory();
        factory.initialize(adapterRegistryImpl, valuationImpl, feeImpl, governanceImpl, assetVaultImpl);

        usdc = new ERC20Mock();
        weth = new ERC20Mock();

        usdc.mint(investor1, 100_000 * 1e18);
        usdc.mint(investor2, 100_000 * 1e18);
        usdc.mint(investor3, 100_000 * 1e18);
        usdc.mint(curator, 10_000 * 1e18);

        address vaultAddr = factory.createVault(address(usdc), "Composable USDC Vault", "cUSDC", true, curator);

        vault = AssetVault(vaultAddr);
        governance = GovernanceModule(address(vault.governanceModule()));

        valuationModule = IValuationModule(vault.valuationModule());

        mockRouter = new MockSwapRouter(address(valuationModule));
        weth.mint(address(mockRouter), 1000 ether);

        dexAdapter = new DexAdapter();
        dexAdapter.initialize(address(mockRouter), vaultAddr);

        vm.prank(curator);
        vault.registerAdapter(keccak256("DEX"), address(dexAdapter));

        vm.prank(investor1);
        usdc.approve(address(vault), type(uint256).max);

        vm.prank(investor2);
        usdc.approve(address(vault), type(uint256).max);

        vm.prank(investor3);
        usdc.approve(address(vault), type(uint256).max);
    }

    function test_VaultCreationAndCuratorRole() public {
        assertEq(address(vault.baseAsset()), address(usdc));
        assertEq(vault.curator(), curator);
        assertEq(vault.totalSupply(), 0);
        assertEq(vault.totalAssets(), 0);
    }

    function test_SetPricesAndMultiAssetNAV() public {
        vm.prank(investor1);
        vault.deposit(10_000 * 1e18, investor1);

        vm.prank(curator);
        valuationModule.setPrice(address(weth), 2000e18);

        weth.mint(address(vault), 5 ether); // 5 WETH = 10,000 USDC value

        assertEq(vault.totalAssets(), 20_000 * 1e18, "NAV should include priced WETH");
    }

    function test_CuratorSwapAndNAVUpdate() public {
        vm.prank(investor1);
        vault.deposit(10_000 * 1e18, investor1);

        uint256 usdcBefore = usdc.balanceOf(address(vault));

        vm.prank(curator);
        valuationModule.setPrice(address(weth), 2500e18);

        bytes memory params = abi.encodeCall(
            DexAdapter.execute,
            (
                abi.encode(
                    address(usdc),
                    address(weth),
                    uint24(3000),
                    5000 * 1e18,
                    1.9 ether, // min out ~$4750 worth
                    uint160(0)
                ),
                address(vault)
            )
        );

        vm.prank(curator);
        vault.executeAdapter(keccak256("DEX"), params);

        uint256 wethReceived = weth.balanceOf(address(vault));

        uint256 expectedAddedValue = (wethReceived * 2500e18) / 1e18; // in USDC units
        assertGe(vault.totalAssets(), usdcBefore + expectedAddedValue - 5000 * 1e18, "NAV increased");
    }

    function test_RequestRedeemLocksSharesNoBurn() public {
        vm.prank(investor1);
        vault.deposit(10_000 * 1e18, investor1);

        uint256 sharesBefore = vault.totalSupply();
        uint256 userShares = vault.balanceOf(investor1);

        vm.prank(investor1);
        uint256 requestId = vault.requestRedeem(userShares);

        assertEq(vault.balanceOf(investor1), 0);
        assertEq(vault.balanceOf(address(vault)), userShares, "Shares locked in vault");
        assertEq(vault.totalSupply(), sharesBefore, "totalSupply unchanged");
    }

    function test_FulfillBurnsSharesAndPaysCurrentValue() public {
        uint256 usdcBalanceBefore = usdc.balanceOf(investor1);
        vm.prank(investor1);
        vault.deposit(10_000 * 1e18, investor1);

        uint256 shares = vault.balanceOf(investor1);

        vm.prank(investor1);
        uint256 requestId = vault.requestRedeem(shares);

        // Simulate profit after request
        usdc.mint(address(vault), 2_000 * 1e18);

        vm.prank(curator);
        vault.fulfillWithdrawal(requestId);

        // User gets CURRENT value (12_000 USDC)
        assertGt(usdc.balanceOf(investor1), usdcBalanceBefore);
        assertEq(vault.totalSupply(), 0, "Shares burned on fulfill");
    }

    function test_NewDepositAfterRequestSeesTruePrice() public {
        vm.prank(investor1);
        vault.deposit(10_000 * 1e18, investor1);

        uint256 shares = vault.balanceOf(investor1);

        vm.prank(investor1);
        vault.requestRedeem(shares);

        // New deposit sees unchanged price
        vm.prank(investor2);
        uint256 newShares = vault.deposit(5_000 * 1e18, investor2);

        assertEq(newShares, 5_000 * 1e18, "New depositor gets fair 1:1");
    }

    function test_CuratorCanFulfillBeforeTimeout() public {
        uint256 usdcBalanceBefore = usdc.balanceOf(investor1);
        vm.prank(investor1);
        vault.deposit(5_000 * 1e18, investor1);

        uint256 shares = vault.balanceOf(investor1);

        vm.prank(investor1);
        uint256 requestId = vault.requestRedeem(shares);

        // No warp needed - curator can fulfill immediately
        vm.prank(curator);
        vault.fulfillWithdrawal(requestId);

        assertEq(usdc.balanceOf(investor1), usdcBalanceBefore);
    }

    function test_DepositAfterSwap() public {
        vm.prank(investor1);
        vault.deposit(10_000 * 1e18, investor1);

        vm.prank(curator);
        valuationModule.setPrice(address(weth), 2000e18);

        bytes memory params = abi.encodeCall(
            DexAdapter.execute,
            (
                abi.encode(
                    address(usdc),
                    address(weth),
                    uint24(3000),
                    5000 * 1e18,
                    1.9 ether, // min out ~$4750 worth
                    uint160(0)
                ),
                address(vault)
            )
        );

        vm.prank(curator);
        vault.executeAdapter(keccak256("DEX"), params);

        uint256 navBefore = vault.totalAssets();

        vm.prank(investor2);
        uint256 shares = vault.deposit(5_000 * 1e18, investor2);

        assertGt(shares, 0);
        assertEq(vault.totalAssets(), navBefore + 5_000 * 1e18);
    }

    function test_DepositAndShareIssuance() public {
        uint256 amount = 500 * 1e18;

        vm.prank(investor1);
        uint256 shares = vault.deposit(amount, investor1);

        assertEq(shares, amount);
        assertEq(vault.totalSupply(), amount);
        assertEq(vault.balanceOf(investor1), amount);
        assertEq(vault.totalAssets(), amount);
    }

    function test_MultipleDeposits() public {
        vm.prank(investor1);
        vault.deposit(1_000 * 1e18, investor1);

        vm.prank(investor2);
        vault.deposit(2_000 * 1e18, investor2);

        assertEq(vault.totalAssets(), 3_000 * 1e18);
        assertEq(vault.totalSupply(), 3_000 * 1e18);
    }

    function test_AlwaysExitGuaranteeWithProfit() public {
        vm.prank(investor1);
        vault.deposit(1_000 * 1e18, investor1);

        usdc.mint(address(vault), 200 * 1e18);

        uint256 shares = vault.balanceOf(investor1);
        uint256 expected = 1_200 * 1e18;

        vm.prank(investor1);
        uint256 assets = vault.redeem(shares, investor1, investor1);

        assertApproxEqAbs(assets, expected, 100);
    }

    function test_NonCustodialSafety() public {
        vm.prank(investor1);
        vault.deposit(500 * 1e18, investor1);

        vm.expectRevert();
        vm.prank(curator);
        usdc.transferFrom(address(vault), curator, 1);

        vm.prank(investor1);
        vault.withdraw(250 * 1e18, investor1, investor1);
    }

    // --- Governance Module Tests ---

    function test_CreateProposal() public {
        vm.prank(investor1);
        vault.deposit(1000 * 1e18, investor1);

        bytes32 adapterId = keccak256("DEX");
        bytes memory params = abi.encode("dummy params");

        vm.prank(investor1);
        governance.createProposal(adapterId, params);

        assertEq(governance.proposalCount(), 1);

        (
            uint256 id,
            address proposer,
            bytes32 propAdapterId,
            bytes memory propParams,
            uint256 votesFor,
            uint256 votesAgainst,
            uint256 startTime,
            uint256 endTime,
            bool executed
        ) = governance.proposals(1);

        assertEq(id, 1);
        assertEq(proposer, investor1);
        assertEq(propAdapterId, adapterId);
        assertEq(propParams, params);
        assertEq(votesFor, 1000 * 1e18); // auto-vote yes
        assertEq(votesAgainst, 0);
        assertEq(endTime, startTime + 3 days);
        assertFalse(executed);
    }

    function test_CreateProposalRevertsIfNoShares() public {
        bytes32 adapterId = keccak256("DEX");
        bytes memory params = abi.encode("dummy params");

        vm.expectRevert(Errors.NoShares.selector);
        vm.prank(makeAddr("noShares"));
        governance.createProposal(adapterId, params);
    }

    function test_VoteOnProposal() public {
        vm.prank(investor1);
        vault.deposit(1000 * 1e18, investor1);

        vm.prank(investor2);
        vault.deposit(2000 * 1e18, investor2);

        vm.prank(investor1);
        governance.createProposal(keccak256("DEX"), abi.encode("params"));

        uint256 proposalId = 1;

        vm.prank(investor2);
        governance.vote(proposalId, true); // for

        (,,,, uint256 votesFor, uint256 votesAgainst,,,) = governance.proposals(proposalId);
        assertEq(votesFor, 1000 * 1e18 + 2000 * 1e18);
        assertEq(votesAgainst, 0);

        vm.prank(investor2);
        governance.vote(proposalId, false); // against

        (,,,, votesFor, votesAgainst,,,) = governance.proposals(proposalId);
        assertEq(votesFor, 1000 * 1e18 + 2000 * 1e18);
        assertEq(votesAgainst, 2000 * 1e18);
    }

    function test_VoteRevertsAfterEndTime() public {
        vm.prank(investor1);
        vault.deposit(1000 * 1e18, investor1);

        vm.prank(investor1);
        governance.createProposal(keccak256("DEX"), abi.encode("params"));

        vm.warp(block.timestamp + 4 days);

        vm.expectRevert(Errors.VotingEnded.selector);
        vm.prank(investor1);
        governance.vote(1, true);
    }

    function test_IsApprovedSuccess() public {
        vm.prank(investor1);
        vault.deposit(1000 * 1e18, investor1);

        vm.prank(investor2);
        vault.deposit(1500 * 1e18, investor2);

        bytes32 adapterId = keccak256("DEX");
        bytes memory params = abi.encode("params");

        vm.prank(investor1);
        governance.createProposal(adapterId, params);

        vm.prank(investor2);
        governance.vote(1, true); // votesFor = 1000 + 1500 = 2500 (100%)

        vm.warp(block.timestamp + 4 days);

        assertTrue(governance.isApproved(adapterId, params));
    }

    function test_IsApprovedFailureNoQuorum() public {
        vm.prank(investor1);
        vault.deposit(1000 * 1e18, investor1);

        vm.prank(investor2);
        vault.deposit(5000 * 1e18, investor2);

        bytes32 adapterId = keccak256("DEX");
        bytes memory params = abi.encode("params");

        vm.prank(investor1);
        governance.createProposal(adapterId, params);

        vm.prank(investor1);
        governance.vote(1, true); // votesFor = 1000 (only 16.7% < 40%)

        vm.warp(block.timestamp + 4 days);

        assertFalse(governance.isApproved(adapterId, params));
    }

    function test_IsApprovedFailureVotesAgainstWin() public {
        vm.prank(investor1);
        vault.deposit(1000 * 1e18, investor1);

        vm.prank(investor2);
        vault.deposit(2000 * 1e18, investor2);

        bytes32 adapterId = keccak256("DEX");
        bytes memory params = abi.encode("params");

        vm.prank(investor1);
        governance.createProposal(adapterId, params);

        vm.prank(investor2);
        governance.vote(1, false); // votesAgainst = 2000 > votesFor 1000

        vm.warp(block.timestamp + 4 days);

        assertFalse(governance.isApproved(adapterId, params));
    }

    function test_IsApprovedForDifferentProposal() public {
        vm.prank(investor1);
        vault.deposit(1000 * 1e18, investor1);

        vm.prank(investor1);
        governance.createProposal(keccak256("DEX"), abi.encode("params1"));

        vm.warp(block.timestamp + 4 days);

        assertFalse(governance.isApproved(keccak256("DEX"), abi.encode("params2"))); // different params
        assertTrue(governance.isApproved(keccak256("DEX"), abi.encode("params1"))); // same params
    }

    function test_ExecutionViaVaultRequiresApproval() public {
        vm.prank(investor1);
        vault.deposit(1000 * 1e18, investor1);

        vm.prank(curator);
        valuationModule.setPrice(address(weth), 2000e18);

        bytes memory params = abi.encodeCall(
            DexAdapter.execute,
            (abi.encode(address(usdc), address(weth), uint24(3000), 500 * 1e18, 0.19 ether, uint160(0)), address(vault))
        );

        bytes32 adapterId = keccak256("DEX");

        vm.prank(investor1);
        governance.createProposal(adapterId, params);

        vm.warp(block.timestamp + 4 days);

        // Non-curator (investor2) can execute if approved
        vm.prank(investor2);
        vault.executeAdapter(adapterId, params); // should succeed if approved

        // Invalid params reverts
        vm.prank(investor2);
        vm.expectRevert("Unauthorized()");
        vault.executeAdapter(adapterId, abi.encode("wrong params"));
    }
}
