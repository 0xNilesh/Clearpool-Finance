// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract UniswapV3Integration {
    using SafeERC20 for IERC20;

    ISwapRouter public router;

    constructor(address _router) {
        router = ISwapRouter(_router);
    }

    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        bytes memory path,
        address recipient
    ) external returns (uint256) {
        IERC20(tokenIn).approve(address(router), amountIn);
        ISwapRouter.ExactInputParams memory params = ISwapRouter.ExactInputParams({
            path: path,
            recipient: recipient,
            deadline: block.timestamp + 300,
            amountIn: amountIn,
            amountOutMinimum: amountOutMin
        });
        return router.exactInput(params);
    }
}