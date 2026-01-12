// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {VaultFactory} from "../src/core/VaultFactory.sol";
import {AssetVault} from "../src/core/AssetVault.sol";
import {UniswapV3Integration} from "../src/integrations/UniswapV3Integration.sol";
import {DexAdapter} from "../src/adapters/DexAdapter.sol";

contract DeployComposableVaults is Script {
    // ──────────────────────────────────────────────────────────────
    // CONFIG - Update these values before running
    // ──────────────────────────────────────────────────────────────

    // Official Mantle Mainnet RPC: https://rpc.mantle.xyz
    // Chain ID: 5000
    // Explorer: https://mantlescan.xyz (for verification)

    // Uniswap V3 SwapRouter on Mantle (verify before mainnet deploy!)
    // Note: Confirm latest address via official docs or explorer
    address constant UNISWAP_V3_ROUTER = 0xE175E3aBa428d028D2CEdE8e1cB338D1f1D50d13;

    // Official Mantle Bridged USDC (as of Jan 2026 - verify on mantlescan.xyz)
    address constant USDC_MANTLE = 0x70c3C79d33A9b08F1bc1e7DB113D1588Dad7d8Bc;

    string constant VAULT_NAME   = "Composable USDC Vault";
    string constant VAULT_SYMBOL = "cUSDC-V1";

    bool constant GOVERNANCE_ENABLED = false; // Set true when governance is ready

    // ──────────────────────────────────────────────────────────────
    // DEPLOYMENT LOGIC
    // ──────────────────────────────────────────────────────────────

    function run() external {
        // uint256 deployerKey = ;
        address deployer = 0x778D3206374f8AC265728E18E3fE2Ae6b93E4ce4;

        console2.log("=== Deployment started ===");
        console2.log("Deployer:", deployer);
        console2.log("Chain ID (should be 5000):", block.chainid);

        vm.startBroadcast();

        // 1. Deploy the Vault Factory (UUPS upgradeable)
        VaultFactory factory = new VaultFactory();
        console2.log("VaultFactory deployed", address(factory));

        // 2. Deploy UniswapV3 Integration wrapper
        UniswapV3Integration uniswapInt = new UniswapV3Integration(UNISWAP_V3_ROUTER);
        console2.log("UniswapV3Integration", address(uniswapInt));

        // 3. Create the vault (no salt needed anymore!)
        address vault = factory.createVault(
            USDC_MANTLE,
            VAULT_NAME,
            VAULT_SYMBOL,
            GOVERNANCE_ENABLED,
            deployer  // Curator = deployer (change if needed!)
        );

        console2.log("=====================================");
        console2.log("VAULT CREATED SUCCESSFULLY!");
        console2.log("Vault address:     ", vault);
        console2.log("Base asset (USDC): ", USDC_MANTLE);
        console2.log("Curator:           ", deployer);
        console2.log("Governance:        ", GOVERNANCE_ENABLED ? "ENABLED" : "DISABLED");
        console2.log("=====================================");

        // 4. Deploy & initialize DexAdapter + register it
        DexAdapter dexAdapter = new DexAdapter();
        dexAdapter.initialize(address(uniswapInt), vault);
        console2.log("DexAdapter deployed", address(dexAdapter));

        // Register adapter in vault (must be done by owner/curator)
        AssetVault(vault).registerAdapter(keccak256("DEX"), address(dexAdapter)); // ← adjust if factory doesn't have this function
        // Note: If registerAdapter is called on Vault instead, change to:
        // Vault(vault).registerAdapter(keccak256("DEX"), address(dexAdapter));

        console2.log("DEX Adapter registered in Vault");

        vm.stopBroadcast();

        // Final nice summary
        console2.log("\n=== DEPLOYMENT SUMMARY ===");
        console2.log("Factory:            ", address(factory));
        console2.log("Vault:              ", vault);
        console2.log("Uniswap Integration:", address(uniswapInt));
        console2.log("DexAdapter:         ", address(dexAdapter));
        console2.log("Next steps:");
    }
}