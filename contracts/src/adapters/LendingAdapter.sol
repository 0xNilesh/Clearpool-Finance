// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IAdapter} from "../interfaces/IAdapter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Errors} from "../libraries/Errors.sol";

// Assume Aave-like on Mantle
interface ILendingPool {
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

contract LendingAdapter is IAdapter {
    using SafeERC20 for IERC20;

    ILendingPool public lendingPool;
    mapping(address => bool) public approvedPools;

    constructor(address _lendingPool) {
        lendingPool = ILendingPool(_lendingPool);
    }

    function execute(bytes calldata params, address vault) external returns (uint256) {
        (bool isDeposit, address asset, uint256 amount) = abi.decode(params, (bool, address, uint256));
        if (!approvedPools[address(lendingPool)]) revert Errors.InvalidPool();

        if (isDeposit) {
            IERC20(asset).safeTransferFrom(vault, address(this), amount);
            IERC20(asset).approve(address(lendingPool), amount);
            lendingPool.deposit(asset, amount, vault, 0);
            return amount;
        } else {
            uint256 withdrawn = lendingPool.withdraw(asset, amount, vault);
            return withdrawn;
        }
    }
}
