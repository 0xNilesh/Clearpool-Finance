# Clearpool Finance Frontend

![Clearpool Finance Logo](./public/logo.png)

# Clearpool Finance

The frontend application for Clearpool Finance - A decentralized investment platform that enables fund managers to create and manage investment vaults with transparent, on-chain governance.

## Overview

This is the frontend repository for Clearpool Finance. All frontend code, components, and configurations are contained in this directory. The application provides a user-friendly interface for investors and fund managers to interact with the Clearpool Finance smart contracts.

## Features

### For Investors
- **Explore Funds**: Browse and discover investment vaults
- **Portfolio Management**: Track your investments and performance
- **Deposit & Withdraw**: Easy fund management with instant withdrawals
- **Transparency**: Real-time on-chain data and performance metrics
- **Governance**: Participate in fund governance decisions

### For Fund Managers
- **Vault Creation**: Create and deploy new investment vaults
- **Fund Management**: Manage vault assets and strategies
- **Adapter Integration**: Connect with various DeFi protocols
- **Performance Tracking**: Monitor fund performance and AUM
- **Governance Tools**: Propose and manage fund rebalancing

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Blockchain**: Wagmi, Viem, RainbowKit
- **Charts**: Chart.js
- **State Management**: React Hooks
- **Documentation**: Docusaurus

## Project Structure

```
frontend/
├── app/                    # Next.js app router pages
│   ├── app/               # Main application pages
│   ├── manager/           # Fund manager dashboard
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   └── ...                # Feature components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
├── docs/                  # Documentation site (Docusaurus)
└── public/                # Static assets
```

## Key Components

- **VaultsTable**: Main vault listing and exploration
- **Portfolio**: User investment portfolio management
- **VaultManagement**: Fund manager dashboard
- **AppBanner**: Statistics and overview
- **MetricsMarquee**: Landing page metrics display

## Configuration

### Environment Variables

Create a `.env.local` file with the following:

```env
NEXT_PUBLIC_RPC_URL_1=https://your-rpc-url-1
NEXT_PUBLIC_RPC_URL_2=https://your-rpc-url-2
NEXT_PUBLIC_RPC_URL_3=https://your-rpc-url-3
NEXT_PUBLIC_RPC_URL_4=https://your-rpc-url-4
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
```

### Network Configuration

The application is configured for **Mantle Sepolia Testnet** (Chain ID: 5003).

## Features & Capabilities

### Real-time Data
- On-chain vault data fetching
- Performance metrics
- Asset valuations
- Transaction history

### User Experience
- Responsive design
- Dark mode support
- Smooth animations
- Intuitive navigation

### Security
- Wallet connection via RainbowKit
- Transaction signing
- Approval workflows
- Error handling

## Documentation

Comprehensive documentation is available in the `/docs` directory, built with Docusaurus. Visit the documentation site for:
- Getting started guides
- Feature documentation
- Contract addresses
- API references

## License

See the main repository LICENSE file for details.
