// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {VaultFactory} from "../src/core/VaultFactory.sol";
import {AssetVault} from "../src/core/AssetVault.sol";
import {AdapterRegistry} from "../src/execution/AdapterRegistry.sol";
import {ValuationModule} from "../src/valuation/ValuationModule.sol";
import {PerformanceFeeModule} from "../src/fees/PerformanceFeeModule.sol";
import {GovernanceModule} from "../src/governance/GovernanceModule.sol";
import {UniswapV3Integration} from "../src/integrations/UniswapV3Integration.sol";
import {DexAdapter} from "../src/adapters/DexAdapter.sol";

contract DeployComposableVaults is Script {
    // ──────────────────────────────────────────────────────────────
    // CONFIG - Mantle Mainnet (Jan 2026)
    // ──────────────────────────────────────────────────────────────

    uint256 constant MANTLE_CHAIN_ID = 5003;

    // Official addresses (verified Jan 2026)
    address constant UNISWAP_V3_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address constant USDC_MANTLE      = 0x70c3C79d33A9b08F1bc1e7DB113D1588Dad7d8Bc;

    string constant VAULT_NAME   = "Composable USDC Vault";
    string constant VAULT_SYMBOL = "cUSDC-V1";

    bool constant GOVERNANCE_ENABLED = true; // flip to true once GovernanceModule is production-ready

    // ──────────────────────────────────────────────────────────────
    // DEPLOYMENT LOGIC
    // ──────────────────────────────────────────────────────────────

    function run() external {
        vm.startBroadcast();

        address deployer = 0x778D3206374f8AC265728E18E3fE2Ae6b93E4ce4;
        console2.log("Deploying on Mantle (chainId %s) from %s", block.chainid, deployer);

        // ─── 1. Deploy all IMPLEMENTATIONS first ─────────────────────────────
        address assetVaultImpl      = address(new AssetVault());
        address adapterRegistryImpl = address(new AdapterRegistry());
        address valuationImpl       = address(new ValuationModule());
        address feeImpl             = address(new PerformanceFeeModule());
        address governanceImpl      = GOVERNANCE_ENABLED ? address(new GovernanceModule()) : address(0);

        console2.log("Implementations deployed:");
        console2.log("  AssetVault:        %s", assetVaultImpl);
        console2.log("  AdapterRegistry:   %s", adapterRegistryImpl);
        console2.log("  ValuationModule:   %s", valuationImpl);
        console2.log("  PerformanceFee:    %s", feeImpl);
        if (governanceImpl != address(0)) {
            console2.log("  GovernanceModule:  %s", governanceImpl);
        }

        // ─── 2. Deploy VaultFactory with all impl addresses ──────────────────
        VaultFactory factory = new VaultFactory();

        // If your VaultFactory needs a separate initialize call (most do)
        factory.initialize(adapterRegistryImpl,
            valuationImpl,
            feeImpl,
            governanceImpl,       // can be address(0) if governance not enabled
            assetVaultImpl);   // comment out if constructor already inits everything

        console2.log("VaultFactory deployed at: %s", address(factory));

        // ─── 3. Deploy UniswapV3 Integration ─────────────────────────────────
        UniswapV3Integration uniswapInt = new UniswapV3Integration(UNISWAP_V3_ROUTER);
        console2.log("UniswapV3Integration:    %s", address(uniswapInt));

        // ─── 4. Create the first vault ───────────────────────────────────────
        address curator = deployer; // or set to multisig/DAO later

        address vault = factory.createVault(
            USDC_MANTLE,
            VAULT_NAME,
            VAULT_SYMBOL,
            GOVERNANCE_ENABLED,
            curator
        );

        console2.log("VAULT CREATED! Address: %s", vault);
        console2.log("Base asset (USDC): %s", USDC_MANTLE);
        console2.log("Curator:           %s", curator);
        console2.log("Governance:        %s", GOVERNANCE_ENABLED ? "ENABLED" : "DISABLED");

        // ─── 5. Deploy & register DexAdapter ─────────────────────────────────
        DexAdapter dexAdapter = new DexAdapter();
        dexAdapter.initialize(address(uniswapInt), vault);
        console2.log("DexAdapter deployed & initialized: %s", address(dexAdapter));

        // Register in vault (assumes AssetVault has registerAdapter(bytes32, address))
        AssetVault(vault).registerAdapter(keccak256("DEX"), address(dexAdapter));
        console2.log("DEX Adapter registered in Vault");

        vm.stopBroadcast();

        // ─── FINAL SUMMARY ───────────────────────────────────────────────────
        console2.log("\n=== SUCCESS - FULL DEPLOYMENT SUMMARY ===");
        console2.log("Factory:              %s", address(factory));
        console2.log("Vault:                %s", vault);
        console2.log("USDC (base):          %s", USDC_MANTLE);
        console2.log("Uniswap Integration:  %s", address(uniswapInt));
        console2.log("DexAdapter:           %s", address(dexAdapter));
        console2.log("----------------------------------------");
        console2.log("Next steps:");
    }
}