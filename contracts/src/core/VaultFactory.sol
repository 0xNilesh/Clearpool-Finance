// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";
import {AssetVault} from "./AssetVault.sol";
import {ValuationModule} from "../valuation/ValuationModule.sol";
import {PerformanceFeeModule} from "../fees/PerformanceFeeModule.sol";
import {GovernanceModule} from "../governance/GovernanceModule.sol";
import {Initializable} from "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import {AdapterRegistry} from "../execution/AdapterRegistry.sol";

contract VaultFactory is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    uint256 public vaultCount; // 0,1,2,... also acts as total count & next ID

    // Core: ID -> Vault address
    mapping(uint256 => address) public vaultsById;

    // Reverse: Vault address -> its creation ID
    mapping(address => uint256) public idOfVault;

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
    mapping(address => bool) public isVaultFromFactory;
    mapping(address => uint256[]) public vaultIdsByCreator;

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

    function createVault(
        address baseAsset,
        string calldata name,
        string calldata symbol,
        bool governanceEnabled,
        address curator
    ) external returns (address vault) {
        require(baseAsset != address(0), "Invalid base asset");

        uint256 vaultId = vaultCount;

        bytes32 salt = keccak256(abi.encodePacked(
            msg.sender,
            vaultId,
            block.chainid
        ));

        // ─── Deploy vault & modules (your existing code, fixed selector) ───
        vault = address(new AssetVault{salt: salt}(baseAsset, name, symbol));

        // Deploy UUPS proxy modules
        address regImpl = address(new AdapterRegistry());
        address regProxy = address(new ERC1967Proxy(regImpl, ""));
        AdapterRegistry(regProxy).initialize(vault);

        address valImpl = address(new ValuationModule());
        bytes memory initDataValuation =
            abi.encodeWithSelector(ValuationModule.initialize.selector, address(vault), address(baseAsset));
        address valProxy = address(new ERC1967Proxy(valImpl, initDataValuation));

        address feeImpl = address(new PerformanceFeeModule());
        bytes memory initDataFee =
            abi.encodeWithSelector(ValuationModule.initialize.selector, address(vault), address(curator));
        address feeProxy = address(new ERC1967Proxy(feeImpl, initDataFee));

        address govProxy = address(0);
        if (governanceEnabled) {
            address govImpl = address(new GovernanceModule());
            bytes memory initDataGov = abi.encodeWithSelector(GovernanceModule.initialize.selector, address(vault));
            govProxy = address(new ERC1967Proxy(govImpl, initDataGov));
        }

        AssetVault(vault).initialize(regProxy, valProxy, feeProxy, govProxy, governanceEnabled, curator);

        AssetVault(vault).transferOwnership(msg.sender);

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

        vaultCount++;

        emit VaultCreated(vaultId, vault, msg.sender, baseAsset, curator, governanceEnabled, name, symbol);

        return vault;
    }

    /// @notice Get full info for a vault by its sequential ID
    function getVaultInfo(uint256 id) external view returns (VaultInfo memory) {
        require(id < vaultCount, "Vault does not exist");
        return vaultInfoById[id];
    }

    /// @notice Get vault address + full info by address
    function getVaultInfoByAddress(address vaultAddr) external view returns (VaultInfo memory info) {
        uint256 id = idOfVault[vaultAddr];
        require(isVaultFromFactory[vaultAddr], "Not a factory vault");
        return vaultInfoById[id];
    }

    /// @notice Paginated list of vaults with full info
    function getVaultsPaginated(uint256 start, uint256 limit) external view returns (VaultInfo[] memory page) {
        uint256 end = start + limit > vaultCount ? vaultCount : start + limit;
        uint256 length = end > start ? end - start : 0;

        page = new VaultInfo[](length);

        for (uint256 i = 0; i < length; i++) {
            page[i] = vaultInfoById[start + i];
        }

        return page;
    }

    /// @notice Get all vault IDs created by a specific address
    function getVaultIdsByCreator(address creator) external view returns (uint256[] memory) {
        return vaultIdsByCreator[creator];
    }

    // UUPS
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
