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
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DeployComposableVaults is Script {
    // ──────────────────────────────────────────────────────────────
    // CONFIG - Mantle Mainnet (Jan 2026)
    // ──────────────────────────────────────────────────────────────

    uint256 constant MANTLE_CHAIN_ID = 5003;

    // Official addresses (verified Jan 2026)
    address constant UNISWAP_V3_ROUTER = 0xE175E3aBa428d028D2CEdE8e1cB338D1f1D50d13;
    address constant USDC_MANTLE = 0x70c3C79d33A9b08F1bc1e7DB113D1588Dad7d8Bc;

    address constant ETH = 0xEF9dA0056f03F0df3BB1b1b8650Fb83b62396ACe;
    address constant SOL = 0xA4A5162b96DbaA4c3d040977058C9F40A2B78CF9;
    address constant HYPE = 0xCF7bDE314aCE4Bf8f76C37777FDe79c0088C7B3F;
    address constant BTC = 0x1cc3e402376d44353bDA040CC9e15CD828169840;
    address constant WMNT = 0xF3Ccb7D82aeD24CB34ffC0a0b12C8D6141a888a6;

    uint24 feeTier = 3000;

    string constant VAULT_NAME = "Composable USDC Vault";
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
        address assetVaultImpl = address(new AssetVault());
        address adapterRegistryImpl = address(new AdapterRegistry());
        address valuationImpl = address(new ValuationModule());
        address feeImpl = address(new PerformanceFeeModule());
        address governanceImpl = GOVERNANCE_ENABLED ? address(new GovernanceModule()) : address(0);

        address valuationModuleProxy = address(new ERC1967Proxy{salt: keccak256(abi.encode(address(deployer), USDC_MANTLE))}(valuationImpl, ""));
        ValuationModule(valuationModuleProxy).initialize(address(deployer), USDC_MANTLE);

        ValuationModule(valuationModuleProxy).setPriceSource(ETH, 0x59576B17a738A21dF505C2D200FcBFC507824e38, feeTier);
        ValuationModule(valuationModuleProxy).setPriceSource(SOL, 0x2227f3DfC36E322817023300E9EB63e02Ae6419A, feeTier);
        ValuationModule(valuationModuleProxy).setPriceSource(HYPE, 0x084d88266F33B5B4DC883161B12fF6afDDf6c6f8, feeTier);
        ValuationModule(valuationModuleProxy).setPriceSource(BTC, 0x8921b8bdCFaf9e7dDCE57e450981f84B051Df963, feeTier);
        ValuationModule(valuationModuleProxy).setPriceSource(WMNT, 0xbc622C91f24C598135bD9385603F8AC7D1BF00E3, feeTier);

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
        factory.initialize(
            adapterRegistryImpl,
            valuationModuleProxy,
            feeImpl,
            governanceImpl, // can be address(0) if governance not enabled
            assetVaultImpl
        ); // comment out if constructor already inits everything

        console2.log("VaultFactory deployed at: %s", address(factory));

        // ─── 3. Deploy UniswapV3 Integration ─────────────────────────────────
        // UniswapV3Integration uniswapInt = new UniswapV3Integration(UNISWAP_V3_ROUTER);
        // console2.log("UniswapV3Integration:    %s", address(uniswapInt));

        // ─── 4. Create the first vault ───────────────────────────────────────
        address curator = deployer; // or set to multisig/DAO later

        address vault = factory.createVault(USDC_MANTLE, VAULT_NAME, VAULT_SYMBOL, GOVERNANCE_ENABLED, curator);

        console2.log("VAULT CREATED! Address: %s", vault);
        console2.log("Base asset (USDC): %s", USDC_MANTLE);
        console2.log("Curator:           %s", curator);
        console2.log("Governance:        %s", GOVERNANCE_ENABLED ? "ENABLED" : "DISABLED");

        // ─── 5. Deploy & register DexAdapter ─────────────────────────────────
        DexAdapter dexAdapter = new DexAdapter();
        dexAdapter.initialize(address(UNISWAP_V3_ROUTER), vault);
        console2.log("DexAdapter deployed & initialized: %s", address(dexAdapter));

        // Register in vault (assumes AssetVault has registerAdapter(bytes32, address))
        AssetVault(vault).registerAdapter(keccak256("DEX"), address(dexAdapter));
        console2.log("DEX Adapter registered in Vault");

        IERC20(USDC_MANTLE).approve(vault, 5000e18);
        AssetVault(vault).deposit(5000 * 1e18, msg.sender);

        bytes memory params = abi.encodeCall(
            DexAdapter.execute,
            (
                abi.encode(
                    USDC_MANTLE,
                    ETH,
                    uint24(3000),
                    2000 * 1e18,
                    0,
                    uint160(0)
                ),
                vault
            )
        );

        AssetVault(vault).executeAdapter(keccak256("DEX"), params);
        vm.stopBroadcast();

        // ─── FINAL SUMMARY ───────────────────────────────────────────────────
        console2.log("\n=== SUCCESS - FULL DEPLOYMENT SUMMARY ===");
        console2.log("Factory:              %s", address(factory));
        console2.log("Vault:                %s", vault);
        console2.log("USDC (base):          %s", USDC_MANTLE);
        // console2.log("Uniswap Integration:  %s", address(uniswapInt));
        console2.log("DexAdapter:           %s", address(dexAdapter));
        console2.log("----------------------------------------");
        console2.log("Next steps:");
    }
}
