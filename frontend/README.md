<div align="center">

<img src="./public/logo.png" alt="Clearpool Finance Logo" width="200" height="200">

# Clearpool Finance Frontend

</div>

The frontend application for Clearpool Finance - A decentralized investment platform built on DeFi composability principles that enables fund managers to create and manage investment vaults with transparent, on-chain governance.

## Overview

This is the frontend repository for Clearpool Finance. All frontend code, components, and configurations are contained in this directory. The application provides a user-friendly interface for investors and fund managers to interact with the Clearpool Finance smart contracts. The platform features a composable adapter architecture where any adapter can be integrated or managers can create custom adapters for their unique investment strategies, enabling unlimited DeFi protocol integration and strategy customization.

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
- **Composable Adapter System**: Connect with various DeFi protocols through our modular adapter infrastructure - any adapter can be added to the platform, or managers can create custom adapters for their unique investment strategies
- **Custom Adapter Development**: Build and deploy your own adapters to integrate with any DeFi protocol, enabling unlimited composability and strategy customization
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


## Features & Capabilities

### DeFi Composability
- **Modular Adapter Infrastructure**: Open, extensible adapter system where developers and fund managers can create, deploy, and integrate custom adapters
- **Universal Protocol Integration**: Seamless integration with any DeFi protocol through the composable adapter architecture
- **Custom Strategy Development**: Fund managers can build custom adapters tailored to their specific investment strategies

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
