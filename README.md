# Clearpool Finance

![Clearpool Finance Logo](./frontend/public/logo.png)

## Description

Clearpool Finance is a decentralized investment platform that enables fund managers to create and manage investment vaults with transparent, on-chain governance. Built on Mantle Sepolia Testnet, Clearpool provides a secure, transparent, and user-friendly way for investors to access professional investment strategies while maintaining full control over their assets.

## Features

### For Investors
- **Explore Funds**: Browse and discover investment vaults managed by verified professionals
- **Portfolio Management**: Track your investments and performance in real-time
- **Deposit & Withdraw**: Easy fund management with instant withdrawal capabilities
- **Transparency**: Full on-chain transparency with real-time performance tracking
- **Governance**: Participate in fund governance decisions and proposals

### For Fund Managers
- **Vault Creation**: Create and deploy new investment vaults with customizable parameters
- **Fund Management**: Manage vault assets and investment strategies
- **Adapter Integration**: Connect with various DeFi protocols through adapter infrastructure
- **Performance Tracking**: Monitor fund performance, AUM, and investor metrics
- **Governance Tools**: Propose and manage fund rebalancing strategies

### Platform Features
- **Smart Contract Audits**: All contracts audited by leading security firms
- **Multi-signature Controls**: Critical operations require multiple approvals
- **Timelock Mechanisms**: Time-delayed execution for sensitive operations
- **On-chain Records**: All operations recorded on the blockchain
- **Real-time Updates**: Instant updates on all fund activities
- **Complete Audit Trails**: Full transaction history for compliance and verification

## Contract Addresses

### Core Contracts

| Contract Name | Source Code | Address | Explorer |
|--------------|-------------|---------|----------|
| **VaultFactory** | [contracts/src/core/VaultFactory.sol](contracts/src/core/VaultFactory.sol) | `0x4F532db1ce4f33170b21F6a97A8973e9499BbD75` | [View on Explorer](https://sepolia.mantlescan.xyz/address/0x4F532db1ce4f33170b21F6a97A8973e9499BbD75) |
| **AssetVault** | [contracts/src/core/AssetVault.sol](contracts/src/core/AssetVault.sol) | `0xC107Bf787cba6BD5d68b528e7e5ae085f8e3E7D5` | [View on Explorer](https://sepolia.mantlescan.xyz/address/0xC107Bf787cba6BD5d68b528e7e5ae085f8e3E7D5) |

### Execution & Adapters

| Contract Name | Source Code | Address | Explorer |
|--------------|-------------|---------|----------|
| **AdapterRegistry** | [contracts/src/execution/AdapterRegistry.sol](contracts/src/execution/AdapterRegistry.sol) | `0x09676C46aaE81a2E0e13ce201040400765BFe329` | [View on Explorer](https://sepolia.mantlescan.xyz/address/0x09676C46aaE81a2E0e13ce201040400765BFe329) |
| **UniswapDexAdapter** | [contracts/src/adapters/DexAdapter.sol](contracts/src/adapters/DexAdapter.sol) | `0xe1327FE9b457Ad1b4601FdD2afcAdAef198d6BA6` | [View on Explorer](https://sepolia.mantlescan.xyz/address/0xe1327FE9b457Ad1b4601FdD2afcAdAef198d6BA6) |



### Governance

| Contract Name | Source Code | Address | Explorer |
|--------------|-------------|---------|----------|
| **GovernanceModule** | [contracts/src/governance/GovernanceModule.sol](contracts/src/governance/GovernanceModule.sol) | `0xc0356fa9B4766c6b1561eC98AF78Ab7A3b284B88` | [View on Explorer](https://sepolia.mantlescan.xyz/address/0xc0356fa9B4766c6b1561eC98AF78Ab7A3b284B88) |

### Fees

| Contract Name | Source Code | Address | Explorer |
|--------------|-------------|---------|----------|
| **PerformanceFeeModule** | [contracts/src/fees/PerformanceFeeModule.sol](contracts/src/fees/PerformanceFeeModule.sol) | `0xf454C04EE5365F9a195A00267e4a1DBA6a7b9395` | [View on Explorer](https://sepolia.mantlescan.xyz/address/0xf454C04EE5365F9a195A00267e4a1DBA6a7b9395) |


