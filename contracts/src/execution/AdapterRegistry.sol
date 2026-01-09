// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";
import {Errors} from "../libraries/Errors.sol";

contract AdapterRegistry is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    mapping(bytes32 => address) public adapters;

    event AdapterRegistered(bytes32 indexed adapterId, address adapter);

    function initialize(address vault) external initializer {
        __Ownable_init(vault);
    }

    function registerAdapter(bytes32 adapterId, address adapter) external onlyOwner {
        if (adapter == address(0)) revert Errors.InvalidAddress();
        adapters[adapterId] = adapter;
        emit AdapterRegistered(adapterId, adapter);
    }

    function getAdapter(bytes32 adapterId) external view returns (address) {
        return adapters[adapterId];
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
