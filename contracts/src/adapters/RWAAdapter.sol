// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IAdapter} from "../interfaces/IAdapter.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Errors} from "../libraries/Errors.sol";
// Assume tokenized RWA like BlackRock BUIDL
interface IRWA {
    function mint(uint256 amount) external returns (uint256);
    function redeem(uint256 shares) external returns (uint256);
}

contract RWAAdapter is IAdapter {
    using SafeERC20 for IERC20;

    mapping(address => IRWA) public rwaTokens;

    function execute(bytes calldata params, address vault) external returns (uint256) {
        (address rwaAddr, bool isMint, address asset, uint256 amount) = abi.decode(params, (address, bool, address, uint256));
        IRWA rwa = rwaTokens[rwaAddr];
        if (address(rwa) == address(0)) revert Errors.InvalidRWA();

        if (isMint) {
            IERC20(asset).safeTransferFrom(vault, address(this), amount);
            IERC20(asset).approve(rwaAddr, amount);
            return rwa.mint(amount);
        } else {
            return rwa.redeem(amount);
        }
    }

    // Curator adds RWA
    function addRWA(address rwaAddr) external {
        rwaTokens[rwaAddr] = IRWA(rwaAddr);
    }
}