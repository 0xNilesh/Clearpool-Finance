// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Errors} from "../libraries/Errors.sol";
import {Initializable} from "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";

contract PerformanceFeeModule is Initializable, UUPSUpgradeable {
    uint256 public constant PERFORMANCE_FEE_BPS = 2000; // 20%
    address public feeRecipient;

    constructor(address _recipient) {
        feeRecipient = _recipient;
        _disableInitializers();
    }

    function calculatePerformanceFee(uint256 hwm, uint256 currentPrice, uint256 totalSupply) external pure returns (uint256) {
        if (currentPrice <= hwm) return 0;
        uint256 gain = currentPrice - hwm;
        uint256 fee = (gain * totalSupply * PERFORMANCE_FEE_BPS) / 10000 / currentPrice;
        return fee;
    }

    function _authorizeUpgrade(address) internal override {}
}