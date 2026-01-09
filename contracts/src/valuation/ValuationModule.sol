// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IValuationModule} from "../interfaces/IValuationModule.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Initializable} from "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";

contract ValuationModule is Initializable, UUPSUpgradeable, IValuationModule {
    // token => price in base asset (1e18 precision, e.g., 2000e18 for $2000 ETH if base=USDC)
    mapping(address => uint256) public prices;
    address public baseAsset; // USDC

    constructor(address _baseAsset) {
        baseAsset = _baseAsset;
        prices[_baseAsset] = 1e18;
        _disableInitializers();
    }

    function calculateNAV(address vault) external view returns (uint256 nav) {
        // Start with base asset balance
        nav = IERC20(baseAsset).balanceOf(vault);

        // You need to maintain a list of held tokens (or make this external)
        // For hacky version: assume only base for now, or add a function to query known tokens
        // Example placeholder:
        // address[] memory tokens = getHeldTokens(vault); // implement or hardcode
        // for (uint i = 0; i < tokens.length; i++) {
        //     if (tokens[i] != baseAsset) {
        //         uint256 balance = IERC20(tokens[i]).balanceOf(vault);
        //         nav += balance * prices[tokens[i]] / 1e18;
        //     }
        // }
        return nav;
    }

    function setPrice(address token, uint256 price) external {
        // Add access control in production (onlyOwner or curator)
        prices[token] = price;
    }

    function _authorizeUpgrade(address) internal override {}
}
