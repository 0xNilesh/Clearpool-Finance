// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {VaultFactory} from "../src/core/VaultFactory.sol";
import {UniswapV3Integration} from "../src/integrations/UniswapV3Integration.sol";
import {DexAdapter} from "../src/adapters/DexAdapter.sol";

contract DeployComposableVaults is Script {
    address uniswapRouter = address(0);

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        // Deploy factory
        VaultFactory factory = new VaultFactory();

        // Deploy mock DEX (for testing/mainnet simulation)
        UniswapV3Integration mockDex = new UniswapV3Integration(uniswapRouter);

        // Example: Create USDC vault on Mantle Mainnet
        address USDC = 0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9; // Mantle bridged USDC
        address curator = deployer; // or your curator address

        bytes32 salt = keccak256("composable-usdc-v1");

        address vaultAddr = factory.createVault(
            salt,
            USDC,
            "Composable USDC Vault",
            "cUSDC-V1",
            false, // governanceEnabled
            curator
        );

        console2.log("Vault deployed at:", vaultAddr);
        console2.log("Factory at:", address(factory));
        console2.log("Mock DEX at:", address(mockDex));

        // Optional: Deploy and register DexAdapter
        DexAdapter dexAdapter = new DexAdapter();
        dexAdapter.initialize(address(mockDex), vaultAddr);
        console2.log("DexAdapter at:", address(dexAdapter));

        vm.stopBroadcast();
    }
}
