// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IValuationModule {
    function calculateNAV(address vault) external view returns (uint256);
    function setPrice(address token, uint256 priceInBase) external;
    function valueOf(address token, address vault) external view returns (uint256);
    function baseAsset() external view returns (address);
}
