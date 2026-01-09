// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";
import {IExecutionEngine} from "../interfaces/IExecutionEngine.sol";
import {Errors} from "../libraries/Errors.sol";

contract ExecutionEngine is Initializable, UUPSUpgradeable, IExecutionEngine {
    address public vault;

    function initialize(address _vault) external initializer {
        
        vault = _vault;
    }

    function execute(address adapter, bytes calldata params) external returns (uint256) {
        if (msg.sender != vault) revert Errors.Unauthorized();
        (bool success, bytes memory data) = adapter.delegatecall(params);
        if (!success) revert Errors.ExecutionFailed();
        return abi.decode(data, (uint256));
    }

    function _authorizeUpgrade(address) internal override {}
}