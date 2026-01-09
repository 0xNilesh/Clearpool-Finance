// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAdapter {
    function execute(bytes calldata params, address vault) external returns (uint256);
}
