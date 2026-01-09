// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IValuationModule} from "../interfaces/IValuationModule.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ValuationModule is IValuationModule {
    mapping(address => uint256) public prices; // token => price in base (1e18)
    address[] public trackedTokens; // list of tokens to value (curator adds)

    address public immutable baseAsset;

    constructor(address _baseAsset) {
        baseAsset = _baseAsset;
        prices[_baseAsset] = 1e18;
        trackedTokens.push(_baseAsset);
    }

    function calculateNAV(address vault) external view returns (uint256 nav) {
        // Always include base asset
        nav = IERC20(baseAsset).balanceOf(vault);

        // Add value of tracked tokens
        for (uint256 i = 0; i < trackedTokens.length; i++) {
            address token = trackedTokens[i];
            if (token == baseAsset) continue;

            uint256 price = prices[token];
            if (price == 0) continue;

            uint256 balance = IERC20(token).balanceOf(vault);
            nav += (balance * price) / 1e18;
        }

        return nav;
    }

    function setPrice(address token, uint256 priceInBase) external {
        // TODO: add onlyCurator / onlyOwner
        prices[token] = priceInBase;

        // Auto-add to tracked list if new
        if (!isTracked(token)) {
            trackedTokens.push(token);
        }
    }

    function isTracked(address token) internal view returns (bool) {
        for (uint256 i = 0; i < trackedTokens.length; i++) {
            if (trackedTokens[i] == token) return true;
        }
        return false;
    }

    function valueOf(address token, address vault) external view returns (uint256) {
        uint256 price = prices[token];
        if (price == 0) return 0;
        return IERC20(token).balanceOf(vault) * price / 1e18;
    }

    // Optional: Curator can add tracked token manually without price
    function addTrackedToken(address token) external {
        if (!isTracked(token)) {
            trackedTokens.push(token);
        }
    }
}