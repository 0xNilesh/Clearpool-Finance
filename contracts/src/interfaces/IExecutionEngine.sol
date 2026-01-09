// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IExecutionEngine {
    function execute(address adapter, bytes calldata params) external returns (uint256);
    function initialize(address vault) external;
}