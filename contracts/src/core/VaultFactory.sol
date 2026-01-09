// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";
import {AssetVault} from "./AssetVault.sol";
import {ValuationModule} from "../valuation/ValuationModule.sol";
import {PerformanceFeeModule} from "../fees/PerformanceFeeModule.sol";
import {GovernanceModule} from "../governance/GovernanceModule.sol";
import {Initializable} from "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import {AdapterRegistry} from "../execution/AdapterRegistry.sol";

contract VaultFactory is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    event VaultCreated(address indexed vault, address baseAsset, address curator);

    function initialize() external initializer {
        __Ownable_init(msg.sender);
    }

    function createVault(
        bytes32 salt,
        address baseAsset,
        string calldata name,
        string calldata symbol,
        bool governanceEnabled,
        address curator
    ) external returns (address vault) {
        vault = address(new AssetVault{salt: salt}(baseAsset, name, symbol));

        // Deploy UUPS proxy modules
        address regImpl = address(new AdapterRegistry());
        address regProxy = address(new ERC1967Proxy(regImpl, ""));
        AdapterRegistry(regProxy).initialize(vault);

        address valImpl = address(new ValuationModule());
        bytes memory initDataValuation = abi.encodeWithSelector(
                ValuationModule.initialize.selector,
                address(vault),
                address(baseAsset)
            );
        address valProxy = address(new ERC1967Proxy(valImpl, initDataValuation));

        address feeImpl = address(new PerformanceFeeModule());
        bytes memory initDataFee = abi.encodeWithSelector(
                ValuationModule.initialize.selector,
                address(vault),
                address(curator)
            );
        address feeProxy = address(new ERC1967Proxy(feeImpl, initDataFee));

        address govProxy = address(0);
        if (governanceEnabled) {
            address govImpl = address(new GovernanceModule());
            bytes memory initDataGov = abi.encodeWithSelector(
                GovernanceModule.initialize.selector,
                address(vault)
            );
            govProxy = address(new ERC1967Proxy(govImpl, initDataGov));
        }

        AssetVault(vault).initialize(
            regProxy,
            valProxy,
            feeProxy,
            govProxy,
            governanceEnabled,
            curator
        );

        AssetVault(vault).transferOwnership(msg.sender);
        emit VaultCreated(vault, baseAsset, curator);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}