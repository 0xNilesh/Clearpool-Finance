// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
// import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IValuationModule} from "../interfaces/IValuationModule.sol";
import {Errors} from "../libraries/Errors.sol";
import {AdapterRegistry} from "../execution/AdapterRegistry.sol";
import {PerformanceFeeModule} from "../fees/PerformanceFeeModule.sol";
import {GovernanceModule} from "../governance/GovernanceModule.sol";
import {Initializable} from "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin-upgradeable/contracts/access/AccessControlUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";
import {ERC20Upgradeable} from "@openzeppelin-upgradeable/contracts/token/ERC20/ERC20Upgradeable.sol";
import {ERC4626Upgradeable} from "@openzeppelin-upgradeable/contracts/token/ERC20/extensions/ERC4626Upgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin-upgradeable/contracts/utils/PausableUpgradeable.sol";

contract AssetVault is Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ERC20Upgradeable,
    ERC4626Upgradeable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public baseAsset;
    address public curator;

    AdapterRegistry public adapterRegistry;
    IValuationModule public valuationModule;
    PerformanceFeeModule public feeModule;
    GovernanceModule public governanceModule;

    bool public governanceEnabled;
    uint256 public highWaterMark = 1e18;

    struct WithdrawalRequest {
        address owner;
        uint256 sharesLocked;
        uint256 requestTime;
        bool fulfilled;
    }

    WithdrawalRequest[] public requests;

    uint256 public constant FULFILL_TIMEOUT = 3 days; // adjustable via governance later

    event WithdrawalRequested(uint256 indexed requestId, address indexed owner, uint256 sharesLocked);
    event WithdrawalFulfilled(uint256 indexed requestId, address indexed owner, uint256 assetsPaid);

    event ModuleUpdated(string moduleName, address newModule);
    event AdapterExecuted(bytes32 indexed adapterId, uint256 inputValue, uint256 outputValue);
    event FeesHarvested(uint256 feeShares);

    modifier onlyCurator() {
        require(msg.sender == curator, "Unauthorized");
        _;
    }

    /**
     * @notice Initializes the vault proxy (called exactly once via proxy constructor data)
     * @param _baseAsset base asset address
     * @param _adapterRegistry Address of the adapter registry proxy
     * @param _valuationModule Address of the valuation module proxy
     * @param _feeModule Address of the performance fee module proxy
     * @param _governanceModule Address of governance module proxy (can be address(0))
     * @param _governanceEnabled Whether governance is active
     * @param _curator Initial curator address (gets CURATOR_ROLE)
     */
    function initialize(
        address _baseAsset,
        address _adapterRegistry,
        address _valuationModule,
        address _feeModule,
        address _governanceModule,
        bool _governanceEnabled,
        address _curator,
        string memory _name,
        string memory _symbol
    ) public initializer {
        // 1. Initialize parents in correct order
        __ERC20_init(_name, _symbol);
        __ERC4626_init(IERC20(_baseAsset)); // or pass baseAsset directly
        baseAsset = IERC20(_baseAsset);

        // 2. Set modules
        adapterRegistry = AdapterRegistry(_adapterRegistry);
        valuationModule = IValuationModule(_valuationModule);
        feeModule = PerformanceFeeModule(_feeModule);

        governanceEnabled = _governanceEnabled;
        if (_governanceEnabled && _governanceModule != address(0)) {
            governanceModule = GovernanceModule(_governanceModule);
        }

        curator = _curator;
    }

    function decimals() public view override(ERC20Upgradeable, ERC4626Upgradeable) returns (uint8) {
        return 18;
    }

    // Deposits
    function deposit(uint256 assets, address receiver)
        public
        override
        nonReentrant
        
        returns (uint256 shares)
    {
        shares = previewDeposit(assets);
        require(shares > 0, "Zero shares");
        // THEN transfer assets
        baseAsset.safeTransferFrom(msg.sender, address(this), assets);
        // Mint shares
        _mint(receiver, shares);
        emit Deposit(msg.sender, receiver, assets, shares);
        return shares;
    }

    function mint(uint256 shares, address receiver)
        public
        override
        nonReentrant
        
        returns (uint256 assets)
    {
        assets = previewMint(shares);
        baseAsset.safeTransferFrom(msg.sender, address(this), assets);
        _mint(receiver, shares);
        emit Deposit(msg.sender, receiver, assets, shares);
        return assets;
    }

    // Withdrawals (Always-Exit)
    function withdraw(uint256 assets, address receiver, address ownerAddr)
        public
        override
        nonReentrant
        returns (uint256 shares)
    {
        shares = previewWithdraw(assets);
        if (msg.sender != ownerAddr) _spendAllowance(ownerAddr, msg.sender, shares);
        _burn(ownerAddr, shares);
        baseAsset.safeTransfer(receiver, assets);
        emit Withdraw(msg.sender, receiver, ownerAddr, assets, shares);
    }

    function redeem(uint256 shares, address receiver, address ownerAddr)
        public
        override
        nonReentrant
        returns (uint256 assets)
    {
        assets = previewRedeem(shares);
        if (msg.sender != ownerAddr) _spendAllowance(ownerAddr, msg.sender, shares);
        _burn(ownerAddr, shares);
        baseAsset.safeTransfer(receiver, assets);
        emit Withdraw(msg.sender, receiver, ownerAddr, assets, shares);
    }

    function previewDeposit(uint256 assets) public view override returns (uint256) {
        uint256 supply = totalSupply();
        return supply == 0 ? assets : (assets * supply) / totalAssets();
    }

    // Valuation via module
    function totalAssets() public view override returns (uint256) {
        return valuationModule.calculateNAV(address(this));
    }

    // Adapter execution
    function executeAdapter(bytes32 adapterId, bytes calldata params) external nonReentrant {
        bool allowed =
            msg.sender == curator || (governanceEnabled && governanceModule.isApproved(adapterId, params));
        if (!allowed) revert Errors.Unauthorized();

        address adapter = adapterRegistry.getAdapter(adapterId);
        if (adapter == address(0)) revert Errors.AdapterNotRegistered();

        // Direct call to adapter.execute(params, address(this))
        (bool success, bytes memory retData) = adapter.call(params);
        if (!success) revert Errors.ExecutionFailed();

        uint256 outputValue = abi.decode(retData, (uint256));
        emit AdapterExecuted(adapterId, totalAssets(), outputValue);
    }

    // Harvest fees
    function harvestFees() external {
        bool allowed =
            msg.sender == curator || (governanceEnabled && governanceModule.isApprovedForHarvest());
        if (!allowed) revert Errors.Unauthorized();

        uint256 currentPrice = totalAssets() * 1e18 / totalSupply();
        uint256 feeShares = feeModule.calculatePerformanceFee(highWaterMark, currentPrice, totalSupply());
        if (feeShares > 0) {
            _mint(feeModule.feeRecipient(), feeShares);
            highWaterMark = currentPrice;
            emit FeesHarvested(feeShares);
        }
    }

    function requestRedeem(uint256 shares) external nonReentrant  returns (uint256 requestId) {
        require(shares > 0 && balanceOf(msg.sender) >= shares, "Insufficient shares");

        // Lock shares by transferring to vault
        _transfer(msg.sender, address(this), shares);

        requestId = requests.length;
        requests.push(
            WithdrawalRequest({owner: msg.sender, sharesLocked: shares, requestTime: block.timestamp, fulfilled: false})
        );

        emit WithdrawalRequested(requestId, msg.sender, shares);
        return requestId;
    }

    function fulfillWithdrawal(uint256 requestId) external nonReentrant {
        WithdrawalRequest storage req = requests[requestId];
        require(!req.fulfilled, "Already fulfilled");

        bool isCurator = msg.sender == curator;
        bool isTimedOut = block.timestamp >= req.requestTime + FULFILL_TIMEOUT;
        require(isCurator || isTimedOut, "Not authorized yet");

        // Calculate CURRENT owed amount at fulfillment time
        uint256 owed = previewRedeem(req.sharesLocked);

        require(baseAsset.balanceOf(address(this)) >= owed, "Insufficient liquidity");

        // Burn the previously locked shares
        _burn(address(this), req.sharesLocked);

        req.fulfilled = true;
        baseAsset.safeTransfer(req.owner, owed);

        emit WithdrawalFulfilled(requestId, req.owner, owed);
    }

    // Batch version (same logic, looped)
    function fulfillWithdrawals(uint256[] calldata requestIds) external nonReentrant {
        bool isCurator = msg.sender == curator;

        uint256 totalOwed = 0;
        for (uint256 i = 0; i < requestIds.length; i++) {
            uint256 id = requestIds[i];
            WithdrawalRequest storage req = requests[id];
            require(!req.fulfilled, "Already fulfilled");

            bool canFulfill = isCurator || (block.timestamp >= req.requestTime + FULFILL_TIMEOUT);
            require(canFulfill, "Not authorized for this request");

            totalOwed += previewRedeem(req.sharesLocked);
        }

        require(baseAsset.balanceOf(address(this)) >= totalOwed, "Insufficient liquidity");

        for (uint256 i = 0; i < requestIds.length; i++) {
            uint256 id = requestIds[i];
            WithdrawalRequest storage req = requests[id];
            uint256 owed = previewRedeem(req.sharesLocked);
            _burn(address(this), req.sharesLocked);
            req.fulfilled = true;
            baseAsset.safeTransfer(req.owner, owed);
            emit WithdrawalFulfilled(id, req.owner, owed);
        }
    }

    // Optional: View pending requests (for UI/front-end)
    function getPendingRequests() external view returns (WithdrawalRequest[] memory pending) {
        // Simple implementation - in production use a better indexing
        uint256 count = 0;
        for (uint256 i = 0; i < requests.length; i++) {
            if (!requests[i].fulfilled) count++;
        }

        pending = new WithdrawalRequest[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < requests.length; i++) {
            if (!requests[i].fulfilled) pending[idx++] = requests[i];
        }
    }

    // Register adapter (curator)
    function registerAdapter(bytes32 adapterId, address adapter) external onlyCurator {
        adapterRegistry.registerAdapter(adapterId, adapter);
        baseAsset.approve(adapter, type(uint256).max);
    }

    // Module updates (owner/governance only)
    function updateModule(string calldata _name, address newModule) external onlyOwner {
        if (newModule == address(0)) revert Errors.InvalidAddress();
        else if (keccak256(bytes(_name)) == keccak256("AdapterRegistry")) adapterRegistry = AdapterRegistry(newModule);
        else if (keccak256(bytes(_name)) == keccak256("ValuationModule")) valuationModule = IValuationModule(newModule);
        else if (keccak256(bytes(_name)) == keccak256("FeeModule")) feeModule = PerformanceFeeModule(newModule);
        else if (keccak256(bytes(_name)) == keccak256("GovernanceModule")) governanceModule = GovernanceModule(newModule);
        else revert Errors.InvalidModule();
        emit ModuleUpdated(_name, newModule);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
