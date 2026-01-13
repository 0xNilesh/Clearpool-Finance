"use client"

import AppNavbar from "@/components/app-navbar"
import Footer from "@/components/footer"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { parseUnits } from "viem"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import addresses from "@/../addresses.json"

// Extract unique tokens from pools
const extractTokensFromPools = () => {
  const tokenMap = new Map<string, { name: string; address: string; decimals: number }>()
  
  // Add WMNT from contracts
  tokenMap.set(addresses.contracts.WPC.toLowerCase(), {
    name: "WMNT",
    address: addresses.contracts.WPC,
    decimals: 18,
  })

  // Addresses to exclude
  const excludedAddresses = [
    "0xf76C0491B360Ce9625226C85A70b6C6516dFf7AF", // BTC
    "0xe0b7A8833f77C5728295D489F4B64f9DA236E4C8", // USDC
  ].map(addr => addr.toLowerCase())

  // Extract tokens from all pools
  Object.values(addresses.pools).forEach((pool: any) => {
    // Add token0 (skip excluded addresses)
    const token0Lower = pool.token0.toLowerCase()
    if (!tokenMap.has(token0Lower) && !excludedAddresses.includes(token0Lower)) {
      tokenMap.set(token0Lower, {
        name: pool.token0Symbol,
        address: pool.token0,
        decimals: 18, // Default to 18, can be adjusted if needed
      })
    }

    // Add token1 (skip excluded addresses)
    const token1Lower = pool.token1.toLowerCase()
    if (!tokenMap.has(token1Lower) && !excludedAddresses.includes(token1Lower)) {
      tokenMap.set(token1Lower, {
        name: pool.token1Symbol,
        address: pool.token1,
        decimals: 18, // Default to 18, can be adjusted if needed
      })
    }
  })

  return Array.from(tokenMap.values())
}

// Token configuration with tentative amounts
const getTestTokens = () => {
  const tokens = extractTokensFromPools()
  
  // Define tentative amounts for each token
  const amountMap: Record<string, string> = {
    USDC: "100",
    ETH: "0.1",
    SOL: "1",
    HYPE: "100",
    BTC: "0.01",
    WMNT: "100",
  }

  // Define priority order: USDC and WMNT first, then others
  const priorityOrder = ["USDC", "WMNT"]
  
  const tokenList = tokens.map((token) => ({
    name: token.name,
    address: token.address as `0x${string}`,
    amount: amountMap[token.name] || "100",
    decimals: token.decimals,
  }))

  // Sort: USDC and WMNT first, then remaining tokens
  return tokenList.sort((a, b) => {
    const aPriority = priorityOrder.indexOf(a.name)
    const bPriority = priorityOrder.indexOf(b.name)
    
    // If both are in priority list, sort by priority order
    if (aPriority !== -1 && bPriority !== -1) {
      return aPriority - bPriority
    }
    // If only a is in priority list, it comes first
    if (aPriority !== -1) return -1
    // If only b is in priority list, it comes first
    if (bPriority !== -1) return 1
    // If neither is in priority list, maintain original order
    return 0
  })
}

// ERC20 ABI for mint function - mints to caller (msg.sender)
const ERC20_ABI = [
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const

export default function ClaimPage() {
  const { address, isConnected } = useAccount()
  const [claimingToken, setClaimingToken] = useState<string | null>(null)

  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const testTokens = useMemo(() => getTestTokens(), [])

  const handleClaim = async (token: typeof testTokens[0]) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first")
      return
    }

    setClaimingToken(token.address)

    try {
      const amount = parseUnits(token.amount, token.decimals)

      writeContract(
        {
          address: token.address,
          abi: ERC20_ABI,
          functionName: "mint",
          args: [amount], // Only pass amount, function mints to caller
        },
        {
          onSuccess: () => {
            toast.info(`Claiming ${token.amount} ${token.name}...`)
          },
          onError: (error) => {
            toast.error(`Failed to claim ${token.name}: ${error.message}`)
            setClaimingToken(null)
          },
        }
      )
    } catch (error: any) {
      toast.error(`Failed to claim ${token.name}: ${error.message}`)
      setClaimingToken(null)
    }
  }

  // Handle transaction confirmation
  useEffect(() => {
    if (isSuccess && claimingToken) {
      const token = testTokens.find((t) => t.address === claimingToken)
      if (token) {
        toast.success(`Successfully claimed ${token.amount} ${token.name}!`)
        setClaimingToken(null)
      }
    }
  }, [isSuccess, claimingToken, testTokens])

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNavbar />
      <main className="flex-1 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
        <Card className="p-8">
          <h1 className="text-3xl font-bold text-foreground mb-8">Claim Testnet Funds</h1>
          <p className="text-muted-foreground mb-6">
            Claim testnet tokens for free. All tokens are available to everyone.
          </p>

          {!isConnected && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Please connect your wallet to claim testnet funds.
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-base py-4">Token Name</TableHead>
                  <TableHead className="font-semibold text-base py-4">Token Address</TableHead>
                  <TableHead className="font-semibold text-base py-4">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testTokens.map((token) => {
                  const isClaiming = claimingToken === token.address && (isPending || isConfirming)
                  return (
                    <TableRow key={token.address}>
                      <TableCell className="font-medium text-base py-4">{token.name}</TableCell>
                      <TableCell className="text-base py-4 font-mono text-sm">
                        {formatAddress(token.address)}
                      </TableCell>
                      <TableCell className="text-base py-4">
                        <Button
                          onClick={() => handleClaim(token)}
                          disabled={!isConnected || isClaiming}
                          className="min-w-[120px]"
                        >
                          {isClaiming ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Claiming...
                            </>
                          ) : (
                            `Claim ${token.amount} ${token.name}`
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
