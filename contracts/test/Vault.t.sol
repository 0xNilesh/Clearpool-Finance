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
import {ValuationModule} from "../src/valuation/ValuationModule.sol";

contract MockSwapRouter {
    ValuationModule public valuationModule;

    constructor(address _valuationModule) {
        valuationModule = ValuationModule(_valuationModule);
    }

    function exactInputSingle(ISwapRouter.ExactInputSingleParams calldata params)
        external
        returns (uint256 amountOut)
    {
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
    UniswapV3Integration public uniswapIntegration;
    DexAdapter public dexAdapter;
    MockSwapRouter public mockRouter;
    IValuationModule public valuationModule;

    address public curator = makeAddr("curator");
    address public investor1 = makeAddr("investor1");
    address public investor2 = makeAddr("investor2");

    ERC20Mock public usdc;
    ERC20Mock public weth;

    function setUp() public {
        factory = new VaultFactory();

        // mockRouter = new MockSwapRouter();
        // uniswapIntegration = new UniswapV3Integration(address(mockRouter));

        usdc = new ERC20Mock();
        weth = new ERC20Mock();

        usdc.mint(investor1, 100_000 * 1e18);
        usdc.mint(investor2, 100_000 * 1e18);
        usdc.mint(curator, 10_000 * 1e18);

        bytes32 salt = keccak256("test-vault-1");
        address vaultAddr = factory.createVault(
            salt,
            address(usdc),
            "Composable USDC Vault",
            "cUSDC",
            false,
            curator
        );

        vault = AssetVault(vaultAddr);

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
    }

    function test_VaultCreationAndCuratorRole() public {
        assertEq(address(vault.baseAsset()), address(usdc));
        assertTrue(vault.hasRole(vault.CURATOR_ROLE(), curator));
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
                    1.9 ether,           // min out ~$4750 worth
                    uint160(0)
                ),
                address(vault)
            )
        );

        vm.prank(curator);
        vault.executeAdapter(keccak256("DEX"), params);

        uint256 wethReceived = weth.balanceOf(address(vault));

        uint256 expectedAddedValue = (wethReceived * 2500e18) / 1e18; // in USDC units
        assertGe(vault.totalAssets(), usdcBefore + expectedAddedValue - 5000*1e18, "NAV increased");
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
                    1.9 ether,           // min out ~$4750 worth
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

    function test_WithdrawAfterSwapAndProfit() public {
        vm.prank(investor1);
        vault.deposit(10_000 * 1e18, investor1);

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
                    1.9 ether,           // min out ~$4750 worth
                    uint160(0)
                ),
                address(vault)
            )
        );

        vm.prank(curator);
        vault.executeAdapter(keccak256("DEX"), params);

        uint256 shares = vault.balanceOf(investor1);

        vm.prank(investor1);
        uint256 assets = vault.redeem(shares, investor1, investor1);

        assertGt(assets, 10_000 * 1e18, "Investor gets profit");
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
}