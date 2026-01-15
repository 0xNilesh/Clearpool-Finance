<div align="center">

<img src="../frontend/public/logo.png" alt="Clearpool Finance Logo" width="200" height="200">

# Clearpool Finance Contracts

</div>

Smart contracts for Clearpool Finance - A decentralized investment platform built on Mantle Sepolia Testnet with a focus on DeFi composability and modular architecture.

## Overview

Clearpool Finance enables fund managers to create and manage investment vaults with transparent, on-chain governance. The platform is built on composability principles, featuring a modular adapter system where any adapter can be integrated or fund managers can create custom adapters for their specific investment strategies. This composable architecture allows seamless integration with any DeFi protocol, enabling unlimited strategy customization and extensibility. Investors can deposit funds, track performance, and participate in governance decisions.

## Composable Adapter Architecture

Clearpool Finance is built on DeFi composability principles, featuring a modular adapter system that enables:

- **Universal Adapter Integration**: Any adapter can be added to the platform, allowing seamless integration with any DeFi protocol
- **Custom Adapter Development**: Fund managers can create and deploy their own adapters tailored to specific investment strategies
- **Modular Design**: The adapter registry system ensures that new protocols can be integrated without modifying core contracts
- **Infinite Composability**: Combine multiple adapters within a single vault to create complex, multi-protocol investment strategies

The `AdapterRegistry` contract manages all adapters, while individual adapters implement the `IAdapter` interface, ensuring consistent interaction patterns across all DeFi integrations.

## Network

- **Network**: Mantle Sepolia Testnet
- **Chain ID**: 5003
- **Explorer**: [Mantle Sepolia Explorer](https://sepolia.mantlescan.xyz/)

## Contracts

### Core Contracts

| Contract Name | Source Code | Address | Explorer |
|--------------|-------------|---------|----------|
| **VaultFactory** | [src/core/VaultFactory.sol](src/core/VaultFactory.sol) | `0x4F532db1ce4f33170b21F6a97A8973e9499BbD75` | [View on Explorer](https://sepolia.mantlescan.xyz/address/0x4F532db1ce4f33170b21F6a97A8973e9499BbD75) |
| **AssetVault** | [src/core/AssetVault.sol](src/core/AssetVault.sol) | `0xC107Bf787cba6BD5d68b528e7e5ae085f8e3E7D5` | [View on Explorer](https://sepolia.mantlescan.xyz/address/0xC107Bf787cba6BD5d68b528e7e5ae085f8e3E7D5) |

### Execution & Adapters

| Contract Name | Source Code | Address | Explorer |
|--------------|-------------|---------|----------|
| **AdapterRegistry** | [src/execution/AdapterRegistry.sol](src/execution/AdapterRegistry.sol) | `0x09676C46aaE81a2E0e13ce201040400765BFe329` | [View on Explorer](https://sepolia.mantlescan.xyz/address/0x09676C46aaE81a2E0e13ce201040400765BFe329) |
| **DexAdapter** | [src/adapters/DexAdapter.sol](src/adapters/DexAdapter.sol) | `0xe1327FE9b457Ad1b4601FdD2afcAdAef198d6BA6` | [View on Explorer](https://sepolia.mantlescan.xyz/address/0xe1327FE9b457Ad1b4601FdD2afcAdAef198d6BA6) |
| **LendingAdapter** | [src/adapters/LendingAdapter.sol](src/adapters/LendingAdapter.sol) | - | - |
| **RWAAdapter** | [src/adapters/RWAAdapter.sol](src/adapters/RWAAdapter.sol) | - | - |
| **YieldAdapter** | [src/adapters/YieldAdapter.sol](src/adapters/YieldAdapter.sol) | - | - |

### Valuation & Pricing

| Contract Name | Source Code | Address | Explorer |
|--------------|-------------|---------|----------|
| **ValuationModule** | [src/valuation/ValuationModule.sol](src/valuation/ValuationModule.sol) | `0x3e437EaCf65e5a0D311EF139B29D825b41619435` | [View on Explorer](https://sepolia.mantlescan.xyz/address/0x3e437EaCf65e5a0D311EF139B29D825b41619435) |

### Governance

| Contract Name | Source Code | Address | Explorer |
|--------------|-------------|---------|----------|
| **GovernanceModule** | [src/governance/GovernanceModule.sol](src/governance/GovernanceModule.sol) | `0xc0356fa9B4766c6b1561eC98AF78Ab7A3b284B88` | [View on Explorer](https://sepolia.mantlescan.xyz/address/0xc0356fa9B4766c6b1561eC98AF78Ab7A3b284B88) |

### Fees

| Contract Name | Source Code | Address | Explorer |
|--------------|-------------|---------|----------|
| **PerformanceFeeModule** | [src/fees/PerformanceFeeModule.sol](src/fees/PerformanceFeeModule.sol) | `0xf454C04EE5365F9a195A00267e4a1DBA6a7b9395` | [View on Explorer](https://sepolia.mantlescan.xyz/address/0xf454C04EE5365F9a195A00267e4a1DBA6a7b9395) |



