// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AssetVault} from "../core/AssetVault.sol";
import {Errors} from "../libraries/Errors.sol";
import {Initializable} from "@openzeppelin-upgradeable/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";

contract GovernanceModule is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    enum ProposalState { Pending, Active, Defeated, Succeeded }
    struct Proposal {
        uint256 id;
        address proposer;
        bytes32 adapterId;
        bytes params;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 startTime;
        uint256 endTime;
        bool executed;
    }

    AssetVault public vault;
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant QUORUM = 40; // 40%

    function initialize(address _vault) external initializer {
        __Ownable_init(_vault);
        vault = AssetVault(_vault);
    }

    function createProposal(bytes32 adapterId, bytes calldata params) external {
        uint256 balance = vault.balanceOf(msg.sender);
        if (balance == 0) revert Errors.NoShares();

        uint256 id = ++proposalCount;
        proposals[id] = Proposal({
            id: id,
            proposer: msg.sender,
            adapterId: adapterId,
            params: params,
            votesFor: balance, // Proposer auto-votes yes
            votesAgainst: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + VOTING_PERIOD,
            executed: false
        });
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage prop = proposals[proposalId];
        if (block.timestamp > prop.endTime) revert Errors.VotingEnded();
        uint256 weight = vault.balanceOf(msg.sender);
        if (support) prop.votesFor += weight;
        else prop.votesAgainst += weight;
    }

    function isApproved(bytes32 adapterId, bytes calldata params) external view returns (bool) {
        // Simplified: check latest proposal
        Proposal memory prop = proposals[proposalCount];
        if (keccak256(prop.params) != keccak256(params) || prop.adapterId != adapterId) return false;
        if (block.timestamp <= prop.endTime) return false;
        uint256 total = vault.totalSupply();
        return (prop.votesFor * 100 / total >= QUORUM) && (prop.votesFor > prop.votesAgainst);
    }

    function isApprovedForHarvest() external view returns (bool) {
        // Similar logic for harvest proposals
        return true; // Placeholder
    }

    function _authorizeUpgrade(address) internal override {}
}
