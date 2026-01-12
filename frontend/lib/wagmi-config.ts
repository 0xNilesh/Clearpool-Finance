import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { defineChain } from 'viem'
import { NETWORK_CONFIG } from './contracts'

// Mantle Sepolia chain definition
const mantleSepolia = defineChain({
  id: NETWORK_CONFIG.chainId,
  name: NETWORK_CONFIG.name,
  nativeCurrency: {
    decimals: 18,
    name: 'Mantle',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: {
      http: [NETWORK_CONFIG.rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mantle Sepolia Explorer',
      url: 'https://sepolia.explorer.mantle.xyz',
    },
  },
  testnet: true,
})

export const config = getDefaultConfig({
  appName: 'Clearpool Finance',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [mantleSepolia],
  ssr: true,
})

