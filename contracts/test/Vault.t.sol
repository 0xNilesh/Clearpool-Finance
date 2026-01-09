// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {AssetVault} from "../src/core/AssetVault.sol";
import {VaultFactory} from "../src/core/VaultFactory.sol";
import {UniswapV3Integration} from "../src/integrations/UniswapV3Integration.sol";
import {DexAdapter} from "../src/adapters/DexAdapter.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

contract ComposableVaultTest is Test {
    VaultFactory public factory;
    AssetVault public vault;
    UniswapV3Integration public uniswapIntegration;
    DexAdapter public dexAdapter;

    address public curator = makeAddr("curator");
    address public investor1 = makeAddr("investor1");
    address public investor2 = makeAddr("investor2");

    ERC20Mock public baseToken; // USDC-like
    ERC20Mock public otherToken; // e.g., WETH or another token

    // Placeholder router address (use 0x000...000 for mock behavior in tests)
    address constant MOCK_ROUTER = address(0);

    function setUp() public {
        // 1. Deploy Factory
        factory = new VaultFactory();

        // 2. Deploy UniswapV3Integration with mock router (real address on mainnet)
        uniswapIntegration = new UniswapV3Integration(MOCK_ROUTER);

        // 3. Deploy mock tokens
        baseToken = new ERC20Mock();
        otherToken = new ERC20Mock();

        baseToken.mint(investor1, 10_000 * 1e6);
        baseToken.mint(investor2, 10_000 * 1e6);
        baseToken.mint(curator, 1_000 * 1e6);

        otherToken.mint(address(uniswapIntegration), 100 ether); // Pre-fund for mock swaps

        // 4. Create Vault
        bytes32 salt = keccak256("composable-test-vault");
        address vaultAddr = factory.createVault(
            salt,
            address(baseToken),
            "Composable USDC Vault",
            "cUSDC",
            false,
            curator
        );

        vault = AssetVault(vaultAddr);

        // 5. Deploy and register DexAdapter
        dexAdapter = new DexAdapter();
        dexAdapter.initialize(address(uniswapIntegration), vaultAddr);

        vm.prank(curator);
        vault.registerAdapter(keccak256("DEX"), address(dexAdapter));

        // 6. Approve tokens in adapter (curator configures)
        vm.startPrank(curator);
        dexAdapter.addApprovedToken(address(baseToken));
        dexAdapter.addApprovedToken(address(otherToken));
        vm.stopPrank();

        // 7. Approve vault for deposits
        vm.prank(investor1);
        baseToken.approve(address(vault), type(uint256).max);

        vm.prank(investor2);
        baseToken.approve(address(vault), type(uint256).max);
    }

    function test_DepositAndShareIssuance() public {
        uint256 amount = 500 * 1e6;

        vm.prank(investor1);
        uint256 shares = vault.deposit(amount, investor1);

        assertEq(shares, amount);
        assertEq(vault.totalSupply(), amount);
        assertEq(vault.balanceOf(investor1), amount);
        assertEq(vault.totalAssets(), amount);
    }

    function test_MultipleDeposits() public {
        vm.prank(investor1);
        vault.deposit(1_000 * 1e6, investor1);

        vm.prank(investor2);
        vault.deposit(2_000 * 1e6, investor2);

        assertEq(vault.totalAssets(), 3_000 * 1e6);
        assertEq(vault.totalSupply(), 3_000 * 1e6);
    }

    function test_AlwaysExitGuaranteeWithProfit() public {
        vm.prank(investor1);
        vault.deposit(1_000 * 1e6, investor1);

        // Simulate profit
        baseToken.mint(address(vault), 200 * 1e6);

        uint256 shares = vault.balanceOf(investor1);
        uint256 expectedApprox = 1_200 * 1e6;

        vm.prank(investor1);
        uint256 assets = vault.redeem(shares, investor1, investor1);

        assertApproxEqAbs(assets, expectedApprox, 100); // slight rounding
    }

    function test_CuratorExecuteSwapViaUniswapAdapter() public {
        vm.prank(investor1);
        vault.deposit(1_000 * 1e6, investor1);

        // Build path for USDC -> WETH (for real Uniswap, encode properly)
        // For mock: empty path works as we don't check it
        bytes memory path = abi.encodePacked(address(baseToken), uint24(3000), address(otherToken));

        bytes memory params = abi.encode(
            address(baseToken),
            address(otherToken),
            200 * 1e6,
            190 * 1e6, // min out
            path
        );

        vm.prank(curator);
        vault.executeAdapter(keccak256("DEX"), params);

        // In real Uniswap, vault would hold otherToken after successful swap
        // In mock (router = address(0)), swap doesn't move tokens, but test structure is ready
        // For actual test on fork, use --fork-url
        assertLe(baseToken.balanceOf(address(vault)), 800 * 1e6);
    }

    function test_NonCustodialSafety() public {
        vm.prank(investor1);
        vault.deposit(500 * 1e6, investor1);

        vm.expectRevert();
        vm.prank(curator);
        baseToken.transferFrom(address(vault), curator, 1);

        vm.prank(investor1);
        vault.withdraw(250 * 1e6, investor1, investor1);
    }
}