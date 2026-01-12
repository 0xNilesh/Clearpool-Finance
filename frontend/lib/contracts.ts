// Contract configuration file
// Contains ABIs and addresses for all deployed contracts

import contractsConfig from './contracts-config.json';

// Type definitions
export type ContractName = 
  | 'AssetVault'
  | 'VaultFactory'
  | 'AdapterRegistry'
  | 'ValuationModule'
  | 'PerformanceFeeModule'
  | 'GovernanceModule'
  | 'DexAdapter'
  | 'UniswapV3Integration';

// Network configuration
export const NETWORK_CONFIG = contractsConfig.network;

// Contract addresses
export const CONTRACT_ADDRESSES = {
  factory: contractsConfig.contracts.factory,
  vaultFactory: contractsConfig.contracts.vaultFactory,
  implementations: contractsConfig.contracts.implementations,
  core: contractsConfig.contracts.core,
  swapRouter: contractsConfig.contracts.swapRouter,
  positionManager: contractsConfig.contracts.positionManager,
  quoterV2: contractsConfig.contracts.quoterV2,
  vaults: contractsConfig.vaults,
} as const;

// Contract ABIs
export const CONTRACT_ABIS = contractsConfig.abis;

// Contract configuration with both address and ABI
export const CONTRACTS = {
  AssetVault: {
    address: CONTRACT_ADDRESSES.implementations.AssetVault,
    abi: CONTRACT_ABIS.AssetVault,
  },
  VaultFactory: {
    address: CONTRACT_ADDRESSES.vaultFactory,
    abi: CONTRACT_ABIS.VaultFactory,
  },
  AdapterRegistry: {
    address: CONTRACT_ADDRESSES.implementations.AdapterRegistry,
    abi: CONTRACT_ABIS.AdapterRegistry,
  },
  ValuationModule: {
    address: CONTRACT_ADDRESSES.implementations.ValuationModule,
    abi: CONTRACT_ABIS.ValuationModule,
  },
  PerformanceFeeModule: {
    address: CONTRACT_ADDRESSES.implementations.PerformanceFee,
    abi: CONTRACT_ABIS.PerformanceFeeModule,
  },
  GovernanceModule: {
    address: CONTRACT_ADDRESSES.implementations.GovernanceModule,
    abi: CONTRACT_ABIS.GovernanceModule,
  },
  DexAdapter: {
    address: CONTRACT_ADDRESSES.core.DexAdapter,
    abi: CONTRACT_ABIS.DexAdapter,
  },
  UniswapV3Integration: {
    address: CONTRACT_ADDRESSES.core.UniswapV3Integration,
    abi: CONTRACT_ABIS.UniswapV3Integration,
  },
} as const;

// Helper function to get contract config by name
export function getContract(name: ContractName) {
  return CONTRACTS[name];
}

// Helper function to get ABI by contract name
export function getAbi(name: ContractName) {
  return CONTRACT_ABIS[name];
}

// Helper function to get address by contract name
export function getAddress(name: ContractName | 'factory' | 'swapRouter' | 'positionManager' | 'quoterV2') {
  if (name === 'factory' || name === 'vaultFactory') {
    return CONTRACT_ADDRESSES.vaultFactory;
  }
  if (name === 'swapRouter') {
    return CONTRACT_ADDRESSES.swapRouter;
  }
  if (name === 'positionManager') {
    return CONTRACT_ADDRESSES.positionManager;
  }
  if (name === 'quoterV2') {
    return CONTRACT_ADDRESSES.quoterV2;
  }
  if (name === 'DexAdapter') {
    return CONTRACT_ADDRESSES.core.DexAdapter;
  }
  if (name === 'UniswapV3Integration') {
    return CONTRACT_ADDRESSES.core.UniswapV3Integration;
  }
  return CONTRACT_ADDRESSES.implementations[name as keyof typeof CONTRACT_ADDRESSES.implementations];
}

// Export the full config for advanced usage
export { contractsConfig };
