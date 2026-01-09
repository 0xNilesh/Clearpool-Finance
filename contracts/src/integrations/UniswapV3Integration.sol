// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract UniswapV3Integration {
    using SafeERC20 for IERC20;

    ISwapRouter public immutable router;

    constructor(address _router) {
        router = ISwapRouter(_router);
    }

    /**
     * @notice Performs a single-hop swap using exactInputSingle
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param fee Pool fee tier (e.g., 500 = 0.05%, 3000 = 0.3%, 10000 = 1%)
     * @param amountIn Exact amount of tokenIn to spend
     * @param amountOutMin Minimum amount of tokenOut to receive (slippage protection)
     * @param sqrtPriceLimitX96 Price limit (set to 0 for no limit)
     * @param recipient Address that will receive the output tokens (usually the vault)
     * @return amountOut The amount of tokenOut received
     */
    function swap(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint256 amountOutMin,
        uint160 sqrtPriceLimitX96,
        address recipient
    ) external returns (uint256 amountOut) {
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // Approve the router to spend our input tokens
        IERC20(tokenIn).approve(address(router), amountIn);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: fee,
            recipient: recipient,
            deadline: block.timestamp + 300, // 5 minutes from now
            amountIn: amountIn,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: sqrtPriceLimitX96
        });

        // Execute the swap
        amountOut = router.exactInputSingle(params);
    }
}
