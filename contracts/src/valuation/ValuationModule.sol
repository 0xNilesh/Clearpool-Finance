// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IValuationModule} from "../interfaces/IValuationModule.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Initializable} from "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";

import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {OracleLibrary} from "../libraries/OracleLibrary.sol";
import {TickMath} from "@uniswap/v3-core/contracts/libraries/TickMath.sol";

contract ValuationModule is IValuationModule, Initializable, OwnableUpgradeable, UUPSUpgradeable {
    address public baseAsset; // e.g. USDC, WETH – prices are in baseAsset * 1e18
    mapping(address => uint256) public manualPrices; // token => price in base (1e18) – fallback

    // TWAP sources – set by owner/curator
    mapping(address => address) public tokenToPool; // token -> canonical Uniswap V3 pool (with baseAsset)
    mapping(address => uint24) public tokenToFeeTier; // fee tier of the pool (e.g. 500, 3000, 10000)

    uint32 public twapInterval = 1800; // 30 minutes default

    address[] public trackedTokens;

    // ── Events ────────────────────────────────────────────────────────────────
    event PriceSourceSet(address indexed token, address pool, uint24 feeTier);
    event ManualPriceSet(address indexed token, uint256 price);
    event TwapIntervalUpdated(uint32 newInterval);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ── Initialization ────────────────────────────────────────────────────────
    function initialize(address _owner, address _baseAsset) external initializer {
        __Ownable_init(_owner);

        baseAsset = _baseAsset;

        // Base asset always 1:1
        manualPrices[_baseAsset] = 1e18;
        if (!isTracked(_baseAsset)) {
            trackedTokens.push(_baseAsset);
        }
    }

    // ── Core NAV Calculation ──────────────────────────────────────────────────
    function calculateNAV(address vault) external view override returns (uint256 nav) {
        // Base asset balance (always included)
        nav = IERC20(baseAsset).balanceOf(vault);

        uint256 len = trackedTokens.length;
        for (uint256 i = 0; i < len; ++i) {
            address token = trackedTokens[i];
            if (token == baseAsset) continue;

            uint256 price = getPrice(token);
            if (price == 0) continue;

            uint256 balance = IERC20(token).balanceOf(vault);
            // Careful with overflow – in practice use mulDiv if available
            nav += (balance * price) / 1e18;
        }
    }

    // ── Main Price Fetch – TWAP > Manual fallback ─────────────────────────────
    function getPrice(address token) public view returns (uint256 priceInBase) {
        // 1. Try TWAP first (preferred)
        address pool = tokenToPool[token];
        if (pool != address(0)) {
            priceInBase = _getTwapPrice(pool, token);
            if (priceInBase > 0) return priceInBase;
        }

        // 2. Fallback to manual price set by owner/curator
        return manualPrices[token];
    }

    function _getTwapPrice(address pool, address token) internal view returns (uint256) {
        if (twapInterval == 0) return 0;

        uint32[] memory secondsAgos = new uint32[](2);
        secondsAgos[0] = twapInterval;
        secondsAgos[1] = 0;

        (int56[] memory tickCumulatives,) = IUniswapV3Pool(pool).observe(secondsAgos);

        int56 delta = tickCumulatives[1] - tickCumulatives[0];
        int24 averageTick = int24(delta / int56(uint56(twapInterval)));

        // Proper rounding for negative ticks
        if (delta < 0 && (delta % int56(uint56(twapInterval)) != 0)) {
            averageTick--;
        }

        uint256 rawQuote = OracleLibrary.getQuoteAtTick(averageTick, 1e8, token, baseAsset);

        return rawQuote * 1e10; // 1e18 / 1e8 = 1e10 scaling
    }

    // ── Price Management (Owner / Curator) ────────────────────────────────────
    function setManualPrice(address token, uint256 priceInBase) external onlyOwner {
        require(token != baseAsset, "Cannot override base asset");
        manualPrices[token] = priceInBase;
        emit ManualPriceSet(token, priceInBase);

        // Auto-track if not already
        if (!isTracked(token)) {
            trackedTokens.push(token);
        }
    }

    function setPriceSource(address token, address pool, uint24 feeTier) external onlyOwner {
        require(token != baseAsset, "Cannot set base asset");
        require(pool != address(0), "Invalid pool");

        address t0 = IUniswapV3Pool(pool).token0();
        address t1 = IUniswapV3Pool(pool).token1();
        require(
            (t0 == token && t1 == baseAsset) || (t0 == baseAsset && t1 == token), "Pool must contain token & baseAsset"
        );
        require(IUniswapV3Pool(pool).fee() == feeTier, "Fee tier mismatch");

        tokenToPool[token] = pool;
        tokenToFeeTier[token] = feeTier;

        emit PriceSourceSet(token, pool, feeTier);

        // Auto-track
        if (!isTracked(token)) {
            trackedTokens.push(token);
        }
    }

    function setTwapInterval(uint32 _interval) external onlyOwner {
        require(_interval >= 300 && _interval <= 86400, "TWAP interval out of reasonable range"); // 5min – 1day
        twapInterval = _interval;
        emit TwapIntervalUpdated(_interval);
    }

    // ── Token Tracking Helpers ────────────────────────────────────────────────
    function addTrackedToken(address token) external onlyOwner {
        if (!isTracked(token)) {
            trackedTokens.push(token);
        }
    }

    function isTracked(address token) public view returns (bool) {
        uint256 len = trackedTokens.length;
        for (uint256 i = 0; i < len; ++i) {
            if (trackedTokens[i] == token) return true;
        }
        return false;
    }

    // Value of single position
    function valueOf(address token, address vault) external view override returns (uint256) {
        if (token == baseAsset) {
            return IERC20(baseAsset).balanceOf(vault);
        }

        uint256 price = getPrice(token);
        if (price == 0) return 0;

        return (IERC20(token).balanceOf(vault) * price) / 1e18;
    }

    // ── Upgrade authorization ─────────────────────────────────────────────────
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
