---
sidebar_position: 6
---

# Smart Contracts

Clearpool Finance is built on a robust smart contract architecture that ensures security, transparency, and decentralization.

## Contract Architecture

### Core Contracts

#### AssetVault

The main vault contract that manages individual funds:

- **Fund Management**: Handles deposits, withdrawals, and NAV calculations
- **Asset Tracking**: Tracks all assets in the fund
- **Share Management**: Manages share issuance and redemption
- **Access Control**: Controls who can perform fund operations

**Key Functions:**
- `deposit(uint256 amount)`: Invest in the fund
- `withdraw(uint256 shares)`: Withdraw from the fund
- `calculateNAV()`: Calculate current Net Asset Value
- `rebalance()`: Rebalance fund portfolio

#### VaultFactory

Factory contract for creating new funds:

- **Fund Creation**: Creates new vault contracts
- **Configuration**: Sets initial fund parameters
- **Registration**: Registers funds in the system

**Key Functions:**
- `createVault(...)`: Create a new fund vault
- `registerVault(address vault)`: Register vault in system
- `getVaults()`: Get list of all vaults

### Adapter Contracts

Adapters allow funds to interact with different DeFi protocols:

#### DexAdapter

Handles decentralized exchange interactions:

- **Token Swaps**: Execute swaps on DEXs
- **Liquidity Provision**: Add/remove liquidity
- **Price Discovery**: Get token prices from DEXs

#### LendingAdapter

Manages lending protocol interactions:

- **Deposit/Lend**: Lend assets to earn yield
- **Withdraw**: Withdraw from lending pools
- **Yield Collection**: Collect earned interest

#### RWAAdapter

Real-world asset integration:

- **Asset Tokenization**: Manage tokenized real-world assets
- **Compliance**: Handle compliance requirements
- **Revenue Distribution**: Distribute real-world asset revenues

#### YieldAdapter

Yield farming and staking:

- **Staking**: Stake tokens to earn rewards
- **Yield Farming**: Participate in yield farms
- **Reward Collection**: Collect farming rewards

### Supporting Contracts

#### AdapterRegistry

Registers and manages adapters:

- **Adapter Management**: Register/remove adapters
- **Access Control**: Control adapter permissions
- **Versioning**: Manage adapter versions

#### ValuationModule

Handles asset valuation:

- **Price Feeds**: Integrate with price oracles
- **NAV Calculation**: Calculate Net Asset Value
- **Asset Valuation**: Value different asset types

#### PerformanceFeeModule

Manages performance fees:

- **Fee Calculation**: Calculate performance fees
- **Fee Distribution**: Distribute fees to managers
- **Fee Tracking**: Track fee accruals

#### GovernanceModule

Fund governance mechanisms:

- **Proposals**: Submit governance proposals
- **Voting**: Vote on proposals
- **Execution**: Execute approved proposals

## Contract Addresses

### Mainnet (When Deployed)

Contract addresses will be published here after mainnet deployment.

### Testnet (Mantle Testnet)

Current testnet contract addresses:

- **VaultFactory**: `0x...` (To be deployed)
- **AssetVault Template**: `0x...` (To be deployed)

## Contract Interactions

### For Users

#### Investing in a Fund

```solidity
// Approve vault to spend your tokens
IERC20(token).approve(vaultAddress, amount);

// Deposit into vault
AssetVault(vaultAddress).deposit(amount);
```

#### Withdrawing from a Fund

```solidity
// Withdraw shares
AssetVault(vaultAddress).withdraw(shares);
```

### For Fund Managers

#### Creating a Fund

```solidity
// Create vault through factory
VaultFactory(factoryAddress).createVault(
    name,
    symbol,
    managerAddress,
    feeConfig
);
```

#### Managing Fund

```solidity
// Rebalance portfolio
AssetVault(vaultAddress).rebalance();

// Update strategy
AssetVault(vaultAddress).updateStrategy(newStrategy);
```

## Security Features

### Access Control

- **Role-Based Access**: Different roles have different permissions
- **Multi-Signature**: Critical operations require multiple signatures
- **Timelocks**: Important changes have delay periods

### Upgradeability

- **Proxy Pattern**: Uses proxy pattern for upgrades
- **Governance**: Upgrades require governance approval
- **Backwards Compatibility**: Maintains compatibility with existing integrations

### Emergency Features

- **Pause Mechanism**: Contracts can be paused in emergencies
- **Circuit Breakers**: Automatic stops for unusual activity
- **Recovery Functions**: Secure recovery mechanisms

## Contract Verification

All contracts are:

- **Open Source**: Source code available on GitHub
- **Verified**: Verified on block explorers (Etherscan, etc.)
- **Audited**: Audited by security firms
- **Tested**: Extensive test coverage

## Contract Deployment

### Deployment Process

1. **Testing**: Contracts tested on testnet
2. **Audit**: Security audit completed
3. **Verification**: Source code verified on block explorer
4. **Deployment**: Deployed to mainnet
5. **Verification**: Post-deployment verification

### Upgrade Process

1. **Proposal**: Upgrade proposal submitted
2. **Governance Vote**: Community votes on upgrade
3. **Timelock**: Upgrade scheduled after timelock period
4. **Execution**: Upgrade executed
5. **Verification**: Post-upgrade verification

## Integration

### For Developers

Integrate with Clearpool Finance contracts:

```typescript
import { AssetVault, VaultFactory } from '@clearpool/contracts';

// Connect to contracts
const vault = new AssetVault(vaultAddress, provider);
const factory = new VaultFactory(factoryAddress, provider);

// Interact with contracts
const nav = await vault.calculateNAV();
const shares = await vault.balanceOf(userAddress);
```

### SDK Usage

Use the Clearpool Finance SDK for easier integration:

```typescript
import { ClearpoolSDK } from '@clearpool/sdk';

const sdk = new ClearpoolSDK(provider);
const funds = await sdk.getFunds();
const userInvestments = await sdk.getUserInvestments(userAddress);
```

## Audit Reports

Security audit reports will be published here after completion.

## Source Code

Contract source code is available at:
- GitHub: [Clearpool Finance Contracts](https://github.com/clearpool-finance/contracts)

## Support

For technical questions about contracts:
- Documentation: Check our technical docs
- Discord: Join our developer Discord
- GitHub: Open an issue on GitHub
