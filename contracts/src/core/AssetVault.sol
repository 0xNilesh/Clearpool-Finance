// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IExecutionEngine} from "../interfaces/IExecutionEngine.sol";
import {IValuationModule} from "../interfaces/IValuationModule.sol";
import {Errors} from "../libraries/Errors.sol";
import {AdapterRegistry} from "../execution/AdapterRegistry.sol";
import {PerformanceFeeModule} from "../fees/PerformanceFeeModule.sol";
import {GovernanceModule} from "../governance/GovernanceModule.sol";

contract AssetVault is ERC4626, Ownable, Pausable, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant CURATOR_ROLE = keccak256("CURATOR_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    IERC20 public immutable baseAsset;

    IExecutionEngine public executionEngine;
    AdapterRegistry public adapterRegistry;
    IValuationModule public valuationModule;
    PerformanceFeeModule public feeModule;
    GovernanceModule public governanceModule;

    bool public governanceEnabled;
    uint256 public highWaterMark = 1e18;

    event ModuleUpdated(string moduleName, address newModule);
    event AdapterExecuted(bytes32 indexed adapterId, uint256 inputValue, uint256 outputValue);
    event FeesHarvested(uint256 feeShares);

    constructor(
        address _baseAsset,
        string memory _name,
        string memory _symbol
    ) ERC4626(IERC20(_baseAsset)) ERC20(_name, _symbol) Ownable(msg.sender) {
        baseAsset = IERC20(_baseAsset);
    }

    function initialize(
        address _executionEngine,
        address _adapterRegistry,
        address _valuationModule,
        address _feeModule,
        address _governanceModule,
        bool _governanceEnabled,
        address _curator
    ) external onlyOwner {
        executionEngine = IExecutionEngine(_executionEngine);
        adapterRegistry = AdapterRegistry(_adapterRegistry);
        valuationModule = IValuationModule(_valuationModule);
        feeModule = PerformanceFeeModule(_feeModule);

        governanceEnabled = _governanceEnabled;
        if (_governanceEnabled) {
            governanceModule = GovernanceModule(_governanceModule);
            _transferOwnership(address(_governanceModule));
        }

        _grantRole(CURATOR_ROLE, _curator);
        _grantRole(EMERGENCY_ROLE, owner());
    }

    // Deposits
    function deposit(uint256 assets, address receiver) public override nonReentrant whenNotPaused returns (uint256 shares) {
        baseAsset.safeTransferFrom(msg.sender, address(this), assets);
        shares = previewDeposit(assets);
        _mint(receiver, shares);
        emit Deposit(msg.sender, receiver, assets, shares);
    }

    function mint(uint256 shares, address receiver) public override nonReentrant whenNotPaused returns (uint256 assets) {
        assets = previewMint(shares);
        baseAsset.safeTransferFrom(msg.sender, address(this), assets);
        _mint(receiver, shares);
        emit Deposit(msg.sender, receiver, assets, shares);
    }

    // Withdrawals (Always-Exit)
    function withdraw(uint256 assets, address receiver, address ownerAddr) public override nonReentrant returns (uint256 shares) {
        shares = previewWithdraw(assets);
        if (msg.sender != ownerAddr) _spendAllowance(ownerAddr, msg.sender, shares);
        _burn(ownerAddr, shares);
        baseAsset.safeTransfer(receiver, assets);
        emit Withdraw(msg.sender, receiver, ownerAddr, assets, shares);
    }

    function redeem(uint256 shares, address receiver, address ownerAddr) public override nonReentrant returns (uint256 assets) {
        assets = previewRedeem(shares);
        if (msg.sender != ownerAddr) _spendAllowance(ownerAddr, msg.sender, shares);
        _burn(ownerAddr, shares);
        baseAsset.safeTransfer(receiver, assets);
        emit Withdraw(msg.sender, receiver, ownerAddr, assets, shares);
    }

    // Valuation via module
    function totalAssets() public view override returns (uint256) {
        return valuationModule.calculateNAV(address(this));
    }

    // Adapter execution
    function executeAdapter(bytes32 adapterId, bytes calldata params) external nonReentrant whenNotPaused {
        bool allowed = hasRole(CURATOR_ROLE, msg.sender) ||
            (governanceEnabled && governanceModule.isApproved(adapterId, params));
        if (!allowed) revert Errors.Unauthorized();

        address adapter = adapterRegistry.getAdapter(adapterId);
        if (adapter == address(0)) revert Errors.AdapterNotRegistered();

        uint256 outputValue = executionEngine.execute(adapter, params);
        emit AdapterExecuted(adapterId, totalAssets(), outputValue);
    }

    // Harvest fees
    function harvestFees() external {
        bool allowed = hasRole(CURATOR_ROLE, msg.sender) ||
            (governanceEnabled && governanceModule.isApprovedForHarvest());
        if (!allowed) revert Errors.Unauthorized();

        uint256 currentPrice = totalAssets() * 1e18 / totalSupply();
        uint256 feeShares = feeModule.calculatePerformanceFee(highWaterMark, currentPrice, totalSupply());
        if (feeShares > 0) {
            _mint(feeModule.feeRecipient(), feeShares);
            highWaterMark = currentPrice;
            emit FeesHarvested(feeShares);
        }
    }

    // Register adapter (curator)
    function registerAdapter(bytes32 adapterId, address adapter) external onlyRole(CURATOR_ROLE) {
        adapterRegistry.registerAdapter(adapterId, adapter);
    }

    // Module updates (owner/governance only)
    function updateModule(string calldata name, address newModule) external onlyOwner {
        if (newModule == address(0)) revert Errors.InvalidAddress();
        if (keccak256(bytes(name)) == keccak256("ExecutionEngine")) executionEngine = IExecutionEngine(newModule);
        else if (keccak256(bytes(name)) == keccak256("AdapterRegistry")) adapterRegistry = AdapterRegistry(newModule);
        else if (keccak256(bytes(name)) == keccak256("ValuationModule")) valuationModule = IValuationModule(newModule);
        else if (keccak256(bytes(name)) == keccak256("FeeModule")) feeModule = PerformanceFeeModule(newModule);
        else if (keccak256(bytes(name)) == keccak256("GovernanceModule")) governanceModule = GovernanceModule(newModule);
        else revert Errors.InvalidModule();
        emit ModuleUpdated(name, newModule);
    }

    function emergencyPause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
    }
}