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
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DeployComposableVaults is Script {
    uint256 constant MANTLE_CHAIN_ID = 5003;

    address constant USDC_MANTLE = 0x70c3C79d33A9b08F1bc1e7DB113D1588Dad7d8Bc;
    address constant WETH = 0xEF9dA0056f03F0df3BB1b1b8650Fb83b62396ACe;

    address constant VAULT = 0xa9c2f569F7fE282D3333AF7aC17f955daf376f70;

    function run() external {
        vm.startBroadcast();

        IERC20(USDC_MANTLE).approve(VAULT, 5000e18);
        AssetVault(VAULT).deposit(5000 * 1e18, msg.sender);

        bytes memory params = abi.encodeCall(
            DexAdapter.execute,
            (
                abi.encode(
                    USDC_MANTLE,
                    WETH,
                    uint24(3000),
                    1000 * 1e18,
                    0, // min out ~$4750 worth
                    uint160(0)
                ),
                VAULT
            )
        );

        AssetVault(VAULT).executeAdapter(keccak256("DEX"), params);
        vm.stopBroadcast();
    }
}
