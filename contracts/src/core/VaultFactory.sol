// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";

import {AssetVault} from "./AssetVault.sol";
import {ValuationModule} from "../valuation/ValuationModule.sol";
import {PerformanceFeeModule} from "../fees/PerformanceFeeModule.sol";
import {GovernanceModule} from "../governance/GovernanceModule.sol";
import {AdapterRegistry} from "../execution/AdapterRegistry.sol";

contract VaultFactory is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    uint256 public vaultCount;

    // ─── Core mappings ───────────────────────────────────────────────────────
    mapping(uint256 => address) public vaultsById;
    mapping(address => uint256) public idOfVault;
    mapping(address => bool) public isVaultFromFactory;
    mapping(address => uint256[]) public vaultIdsByCreator;

    // ─── Vault information struct ────────────────────────────────────────────
    struct VaultInfo {
        address vault;
        address creator;
        address baseAsset;
        address curator;
        string name;
        string symbol;
        bool governanceEnabled;
        uint256 createdAt;
    }

    mapping(uint256 => VaultInfo) public vaultInfoById;

    address public adapterRegistryImpl;
    address public valuationImpl;
    address public feeImpl;
    address public governanceImpl;
    address public assetVaultImpl;

    // Events
    event VaultCreated(
        uint256 indexed vaultId,
        address indexed vault,
        address indexed creator,
        address baseAsset,
        address curator,
        bool governanceEnabled,
        string name,
        string symbol
    );

    // Custom errors (helps reduce size)
    error InvalidBaseAsset();
    error VaultDoesNotExist();

    function initialize(address _adapterRegistryImpl,
        address _valuationImpl,
        address _feeImpl,
        address _governanceImpl,
        address _assetVaultImpl) external initializer {
        __Ownable_init(msg.sender);

        adapterRegistryImpl = _adapterRegistryImpl;
        valuationImpl = _valuationImpl;
        feeImpl = _feeImpl;
        governanceImpl = _governanceImpl;
        assetVaultImpl = _assetVaultImpl;
    }

    function createVault(
        address baseAsset,
        string calldata name,
        string calldata symbol,
        bool governanceEnabled,
        address curator
    ) external returns (address vault) {
        if (baseAsset == address(0)) revert InvalidBaseAsset();

    uint256 vaultId = vaultCount;
    bytes32 salt = keccak256(abi.encodePacked(msg.sender, vaultId, block.chainid));

    // ─── STEP 1: Deploy ALL proxies UNINITIALIZED (empty calldata) ──────
    address regProxy = address(new ERC1967Proxy{salt: keccak256(abi.encode(vaultId, uint256(0)))}(
        adapterRegistryImpl, ""
    ));

    address valProxy = address(new ERC1967Proxy{salt: keccak256(abi.encode(vaultId, uint256(1)))}(
        valuationImpl, ""
    ));

    address feeProxy = address(new ERC1967Proxy{salt: keccak256(abi.encode(vaultId, uint256(2)))}(
        feeImpl, ""
    ));

    address govProxy = address(0);
    if (governanceEnabled) {
        govProxy = address(new ERC1967Proxy{salt: keccak256(abi.encode(vaultId, uint256(3)))}(
            governanceImpl, ""
        ));
    }

    // Deploy vault proxy LAST (now we have all addresses)
    bytes memory vaultInitData = abi.encodeWithSelector(
        AssetVault.initialize.selector,
        baseAsset, regProxy, valProxy, feeProxy, govProxy, governanceEnabled, curator, name, symbol
    );
    vault = address(new ERC1967Proxy{salt: salt}(assetVaultImpl, vaultInitData));

    // ─── STEP 2: POST-DEPLOY INITIALIZE modules with vault address ─────
    AdapterRegistry(regProxy).initialize(vault);
    ValuationModule(valProxy).initialize(vault, baseAsset);
    PerformanceFeeModule(feeProxy).initialize(vault, curator);
    
    if (governanceEnabled) {
        GovernanceModule(govProxy).initialize(vault);
    }

        vaultsById[vaultId] = vault;
        idOfVault[vault] = vaultId;
        isVaultFromFactory[vault] = true;

        vaultInfoById[vaultId] = VaultInfo({
            vault: vault,
            creator: msg.sender,
            baseAsset: baseAsset,
            curator: curator,
            name: name,
            symbol: symbol,
            governanceEnabled: governanceEnabled,
            createdAt: block.timestamp
        });

        vaultIdsByCreator[msg.sender].push(vaultId);

        unchecked {
            ++vaultCount;
        }

        emit VaultCreated(
            vaultId,
            vault,
            msg.sender,
            baseAsset,
            curator,
            governanceEnabled,
            name,
            symbol
        );

        return vault;
    }

    // View functions
    function getVaultInfo(uint256 id) external view returns (VaultInfo memory) {
        if (id >= vaultCount) revert VaultDoesNotExist();
        return vaultInfoById[id];
    }

    function getVaultIdsByCreator(address creator) external view returns (uint256[] memory) {
        return vaultIdsByCreator[creator];
    }

    // UUPS
    function _authorizeUpgrade(address) internal override onlyOwner {}
}