// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library Errors {
    error ZeroAmount();
    error InvalidAddress();
    error Unauthorized();
    error ExecutionFailed();
    error AdapterNotRegistered();
    error InvalidToken();
    error InvalidPool();
    error InvalidVault();
    error InvalidRWA();
    error AlreadyInitialized();
    error NoShares();
    error VotingEnded();
    error InvalidModule();
}
