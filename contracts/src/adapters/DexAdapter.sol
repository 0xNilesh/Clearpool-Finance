// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IAdapter} from "../interfaces/IAdapter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {UniswapV3Integration} from "../integrations/UniswapV3Integration.sol";
import {Errors} from "../libraries/Errors.sol";
import {Initializable} from "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";

contract DexAdapter is Initializable, UUPSUpgradeable, OwnableUpgradeable, IAdapter {
    using SafeERC20 for IERC20;

    UniswapV3Integration public uniswapIntegration;
    mapping(address => bool) public approvedTokens;

    function initialize(address _uniswapRouter, address vault) external initializer {
        __Ownable_init(vault);
        uniswapIntegration = new UniswapV3Integration(_uniswapRouter);
    }

    function execute(bytes calldata params, address vault) external returns (uint256) {
        (
            address tokenIn,
            address tokenOut,
            uint24 fee,
            uint256 amountIn,
            uint256 amountOutMin,
            uint160 sqrtPriceLimitX96
        ) = abi.decode(params, (address, address, uint24, uint256, uint256, uint160));

        IERC20(tokenIn).safeTransferFrom(vault, address(this), amountIn);
        IERC20(tokenIn).approve(address(uniswapIntegration), amountIn);

        // Call the updated swap function
        uint256 amountOut = uniswapIntegration.swap(
            tokenIn,
            tokenOut,
            fee,
            amountIn,
            amountOutMin,
            sqrtPriceLimitX96,
            vault // recipient = vault
        );

        return amountOut;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
