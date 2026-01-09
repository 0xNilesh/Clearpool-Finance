// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IAdapter} from "../interfaces/IAdapter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Errors} from "../libraries/Errors.sol";

interface IYieldVault {
    function deposit(uint256 amount) external returns (uint256);
    function withdraw(uint256 shares) external returns (uint256);
}

contract YieldAdapter is IAdapter {
    using SafeERC20 for IERC20;

    mapping(address => IYieldVault) public yieldVaults;

    function execute(bytes calldata params, address vault) external returns (uint256) {
        (address yieldVaultAddr, bool isDeposit, address asset, uint256 amount) =
            abi.decode(params, (address, bool, address, uint256));
        IYieldVault yieldVault = yieldVaults[yieldVaultAddr];
        if (address(yieldVault) == address(0)) revert Errors.InvalidVault();

        if (isDeposit) {
            IERC20(asset).safeTransferFrom(vault, address(this), amount);
            IERC20(asset).approve(address(yieldVault), amount);
            return yieldVault.deposit(amount);
        } else {
            return yieldVault.withdraw(amount);
        }
    }

    // Curator adds yield vaults
    function addYieldVault(address yieldVaultAddr, address asset) external {
        yieldVaults[yieldVaultAddr] = IYieldVault(yieldVaultAddr);
    }
}
