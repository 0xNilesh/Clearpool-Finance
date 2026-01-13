"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import AppNavbar from "@/components/app-navbar"
import { useState, useMemo, useEffect, useRef } from "react"
import { useAllVaults } from "@/hooks/use-vaults"
import { Loader2 } from "lucide-react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useReadContracts } from "wagmi"
import { parseUnits, formatUnits, maxUint256 } from "viem"
import { toast } from "sonner"
import { CONTRACTS } from "@/lib/contracts"
import addresses from "@/../addresses.json"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Mock fund data - will be replaced with dynamic data
const defaultFundData = {
  name: "Loading...",
  category: "N/A",
  rating: 0,
  oneYearReturn: "+0.0%",
  allTimeReturn: "+0.0%",
  aum: "$0.00M",
  traderExperience: 0,
  description: "Loading vault data...",
  minInvestment: "$100",
  fees: "2% management fee, 20% performance fee",
}


// Mock active proposals
const activeProposals = [
  { id: 1, type: "Rebalance", description: "Reduce ETH allocation to 30%, increase BTC to 30%", votes: 45, status: "Active" },
  { id: 2, type: "Rebalance", description: "Add UNI token at 5% allocation", votes: 32, status: "Active" },
]

// ERC20 ABI for approve, allowance, and balanceOf
const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const

// Create token address to name mapping from addresses.json
const createTokenMap = () => {
  const tokenMap = new Map<string, { name: string; symbol: string; decimals: number }>()
  
  // Add tokens from testTokens
  Object.entries(addresses.testTokens).forEach(([key, token]: [string, any]) => {
    tokenMap.set(token.address.toLowerCase(), {
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
    })
  })
  
  // Add WMNT from contracts
  tokenMap.set(addresses.contracts.WPC.toLowerCase(), {
    name: "WMNT",
    symbol: "WMNT",
    decimals: 18,
  })
  
  // Add tokens from pools (token0 and token1)
  Object.values(addresses.pools).forEach((pool: any) => {
    // Add token0 if not already in map
    const token0Lower = pool.token0.toLowerCase()
    if (!tokenMap.has(token0Lower)) {
      tokenMap.set(token0Lower, {
        name: pool.token0Symbol,
        symbol: pool.token0Symbol,
        decimals: 18, // Default to 18
      })
    }
    
    // Add token1 if not already in map
    const token1Lower = pool.token1.toLowerCase()
    if (!tokenMap.has(token1Lower)) {
      tokenMap.set(token1Lower, {
        name: pool.token1Symbol,
        symbol: pool.token1Symbol,
        decimals: 18, // Default to 18
      })
    }
  })
  
  return tokenMap
}

const TOKEN_MAP = createTokenMap()

// Mock chart data with realistic variations
const chartData = {
  "1M": [120, 118, 122, 125, 123, 128, 130, 127, 132, 135, 133, 138, 140, 137, 142, 145, 143, 148, 150, 147, 152, 155, 153, 158, 160, 157, 162, 165],
  "3M": [100, 105, 102, 108, 110, 107, 112, 115, 113, 118, 120, 117, 122, 125, 123, 128, 130, 127, 132, 135, 133, 138, 140, 137, 142, 145, 143, 148, 150, 147, 152, 155, 153, 158, 160, 157, 162, 165, 163, 168, 170, 167, 172, 175, 173, 178, 180],
  "6M": [80, 82, 79, 85, 88, 85, 90, 92, 89, 95, 98, 95, 100, 102, 99, 105, 108, 105, 110, 112, 109, 115, 118, 115, 120, 122, 119, 125, 128, 125, 130, 132, 129, 135, 138, 135, 140, 142, 139, 145, 148, 145, 150, 152, 149, 155, 158, 155, 160, 162, 159, 165, 168, 165, 170, 172, 169, 175, 178, 175, 180, 182, 179, 185, 188, 185, 190, 192, 189, 195],
  "1Y": [50, 52, 48, 55, 58, 55, 60, 62, 59, 65, 68, 65, 70, 72, 69, 75, 78, 75, 80, 82, 79, 85, 88, 85, 90, 92, 89, 95, 98, 95, 100, 102, 99, 105, 108, 105, 110, 112, 109, 115, 118, 115, 120, 122, 119, 125, 128, 125, 130, 132, 129, 135, 138, 135, 140, 142, 139, 145, 148, 145, 150, 152, 149, 155, 158, 155, 160, 162, 159, 165, 168, 165, 170, 172, 169, 175, 178, 175, 180, 182, 179, 185, 188, 185, 190, 192, 189, 195, 198, 195, 200, 202, 199, 205, 208, 205, 210, 212, 209, 215, 218, 215, 220, 222, 219, 225, 228, 225, 230, 232, 229, 235, 238, 235, 240, 242, 239, 245, 248, 245, 250, 252, 249, 255, 258, 255, 260, 262, 259, 265, 268, 265, 270, 272, 269, 275, 278, 275, 280, 282, 279, 285, 288, 285, 290, 292, 289, 295, 298, 295, 300, 302, 299, 305],
  "All": [20, 22, 18, 25, 28, 25, 30, 32, 29, 35, 38, 35, 40, 42, 39, 45, 48, 45, 50, 52, 49, 55, 58, 55, 60, 62, 59, 65, 68, 65, 70, 72, 69, 75, 78, 75, 80, 82, 79, 85, 88, 85, 90, 92, 89, 95, 98, 95, 100, 102, 99, 105, 108, 105, 110, 112, 109, 115, 118, 115, 120, 122, 119, 125, 128, 125, 130, 132, 129, 135, 138, 135, 140, 142, 139, 145, 148, 145, 150, 152, 149, 155, 158, 155, 160, 162, 159, 165, 168, 165, 170, 172, 169, 175, 178, 175, 180, 182, 179, 185, 188, 185, 190, 192, 189, 195, 198, 195, 200, 202, 199, 205, 208, 205, 210, 212, 209, 215, 218, 215, 220, 222, 219, 225, 228, 225, 230, 232, 229, 235, 238, 235, 240, 242, 239, 245, 248, 245, 250, 252, 249, 255, 258, 255, 260, 262, 259, 265, 268, 265, 270, 272, 269, 275, 278, 275, 280, 282, 279, 285, 288, 285, 290, 292, 289, 295, 298, 295, 300, 302, 299, 305, 308, 305, 310, 312, 309, 315, 318, 315, 320, 322, 319, 325, 328, 325, 330, 332, 329, 335, 338, 335, 340, 342, 339, 345, 348, 345, 350, 352, 349, 355, 358, 355, 360, 362, 359, 365, 368, 365, 370, 372, 369, 375, 378, 375, 380, 382, 379, 385, 388, 385, 390, 392, 389, 395, 398, 395, 400, 402, 399, 405, 408, 405, 410, 412, 409, 415, 418, 415, 420, 422, 419, 425, 428, 425, 430, 432, 429, 435, 438, 435, 440, 442, 439, 445, 448, 445, 450, 452, 449, 455, 458, 455, 460, 462, 459, 465, 468, 465, 470, 472, 469, 475, 478, 475, 480, 482, 479, 485, 488, 485, 490, 492, 489, 495, 498, 495, 500],
}

export default function FundPage() {
  const params = useParams()
  const router = useRouter()
  const vaultAddress = params.address as string
  const { vaults, isLoading } = useAllVaults()
  const { address, isConnected } = useAccount()
  const [duration, setDuration] = useState("1Y")
  const [amount, setAmount] = useState("")
  const [isApproving, setIsApproving] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  const depositLoggedRef = useRef<string | null>(null) // Track logged transaction hashes to prevent duplicate API calls

  // Find the current vault by address
  const currentVault = useMemo(() => {
    if (!vaultAddress || !vaults) return null
    return vaults.find((v) => v.address.toLowerCase() === vaultAddress.toLowerCase())
  }, [vaultAddress, vaults])

  // Get base asset address (USDC) from vault
  const baseAssetAddress = useMemo(() => {
    if (!currentVault) return null
    return currentVault.baseAsset as `0x${string}`
  }, [currentVault])

  // Check USDC allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: baseAssetAddress || undefined,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && vaultAddress && baseAssetAddress ? [address, vaultAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!address && !!vaultAddress && !!baseAssetAddress && isConnected,
    },
  })

  const { writeContract: writeApprove, data: approveHash } = useWriteContract()
  const { writeContract: writeDeposit, data: depositHash } = useWriteContract()

  const { isLoading: isApprovingTx, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  const { isLoading: isDepositingTx, isSuccess: isDepositSuccess, data: depositReceipt } = useWaitForTransactionReceipt({
    hash: depositHash,
  })

  // Read vault totalSupply before deposit to calculate shares received
  const { data: totalSupplyBefore, refetch: refetchTotalSupplyBefore } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: CONTRACTS.AssetVault.abi,
    functionName: "totalSupply",
    query: {
      enabled: !!vaultAddress && isConnected,
    },
  })

  // Read vault totalSupply after deposit
  const { data: totalSupplyAfter, refetch: refetchTotalSupplyAfter } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: CONTRACTS.AssetVault.abi,
    functionName: "totalSupply",
    query: {
      enabled: !!vaultAddress && isConnected && isDepositSuccess,
    },
  })

  // Handle approve success
  useEffect(() => {
    if (isApproveSuccess) {
      toast.success("USDC approved successfully!")
      setIsApproving(false)
      refetchAllowance()
    }
  }, [isApproveSuccess, refetchAllowance])

  // Read previewDeposit to calculate shares that will be received
  const { data: previewShares } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: CONTRACTS.AssetVault.abi,
    functionName: "previewDeposit",
    args: amount ? [parseUnits(amount, 18)] : undefined,
    query: {
      enabled: !!vaultAddress && !!amount && parseFloat(amount) > 0 && isConnected,
    },
  })

  // Handle deposit success - ONLY call API when transaction is confirmed successful
  useEffect(() => {
    // Only proceed if transaction is successful, we have receipt, and we haven't logged this transaction yet
    const txHash = depositReceipt?.transactionHash
    if (
      isDepositSuccess && 
      depositReceipt && 
      txHash &&
      address && 
      vaultAddress && 
      amount &&
      depositLoggedRef.current !== txHash // Prevent duplicate calls
    ) {
      // Mark this transaction as being logged
      depositLoggedRef.current = txHash

      const logDeposit = async () => {
        try {
          // Wait for blockchain state to update after transaction confirmation
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // Refetch totalSupply to get updated value after deposit
          await refetchTotalSupplyAfter()
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Calculate shares received from totalSupply difference
          let sharesReceived: number
          
          if (totalSupplyAfter && totalSupplyBefore && typeof totalSupplyAfter === 'bigint' && typeof totalSupplyBefore === 'bigint') {
            // Convert both from wei, then subtract
            const totalSupplyAfterNum = Number(formatUnits(totalSupplyAfter, 18))
            const totalSupplyBeforeNum = Number(formatUnits(totalSupplyBefore, 18))
            sharesReceived = totalSupplyAfterNum - totalSupplyBeforeNum
          } else {
            // Fallback: use previewDeposit if available
            if (previewShares && typeof previewShares === 'bigint') {
              sharesReceived = Number(formatUnits(previewShares, 18))
            } else {
              sharesReceived = parseFloat(amount) // Final fallback: assume 1:1
            }
          }

          // Call deposit API - ONLY ONCE after successful transaction
          const response = await fetch('/api/deposit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userAddress: address,
              vaultAddress: vaultAddress,
              amount: amount,
              shares: sharesReceived.toString(),
              transactionHash: txHash,
              blockNumber: depositReceipt.blockNumber?.toString(),
              timestamp: new Date(),
            }),
          })

          if (!response.ok) {
            const error = await response.json()
            console.error('Failed to log deposit:', error)
            toast.error('Deposit successful but failed to log in database')
            // Reset ref on error so we can retry if needed
            depositLoggedRef.current = null
          } else {
            console.log('Deposit logged successfully')
          }
        } catch (error) {
          console.error('Error logging deposit:', error)
          toast.error('Deposit successful but failed to log in database')
          // Reset ref on error so we can retry if needed
          depositLoggedRef.current = null
        }
      }

      // Show success toast immediately
      toast.success(`Successfully deposited ${amount} USDC!`)
      setIsDepositing(false)
      setAmount("")
      
      // Log deposit to API
      logDeposit()
    }
  }, [isDepositSuccess, depositReceipt?.transactionHash, address, vaultAddress, amount, refetchTotalSupplyAfter, totalSupplyAfter, totalSupplyBefore, previewShares])

  const handleDeposit = async () => {
    if (!isConnected || !address || !currentVault || !amount || parseFloat(amount) <= 0) {
      return
    }

    try {
      const depositAmount = parseUnits(amount, 18) // USDC has 18 decimals
      setIsDepositing(true)
      
      // Reset the logged ref when starting a new deposit
      depositLoggedRef.current = null
      
      // Capture totalSupply before deposit for share calculation
      await refetchTotalSupplyBefore()
      
      toast.info("Depositing USDC...")

      writeDeposit(
        {
          address: vaultAddress as `0x${string}`,
          abi: CONTRACTS.AssetVault.abi,
          functionName: "deposit",
          args: [depositAmount, address],
        },
        {
          onSuccess: () => {
            toast.info("Waiting for deposit confirmation...")
          },
          onError: (error) => {
            toast.error(`Deposit failed: ${error.message}`)
            setIsDepositing(false)
            // Reset ref on error
            depositLoggedRef.current = null
          },
        }
      )
    } catch (error: any) {
      toast.error(`Deposit failed: ${error.message}`)
      setIsDepositing(false)
    }
  }

  const handleInvest = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (!currentVault) {
      toast.error("Vault not found")
      return
    }

    try {
      const depositAmount = parseUnits(amount, 18) // USDC has 18 decimals
      const currentAllowance = allowance || BigInt(0)

      // Check if approval is needed
      if (currentAllowance < depositAmount) {
        // First, approve USDC
        setIsApproving(true)
        toast.info("Approving USDC...")

        if (!baseAssetAddress) {
          toast.error("Base asset address not found")
          setIsApproving(false)
          return
        }

        writeApprove(
          {
            address: baseAssetAddress,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [vaultAddress as `0x${string}`, maxUint256], // Approve max for convenience
          },
          {
            onSuccess: () => {
              toast.info("Waiting for approval confirmation...")
            },
            onError: (error) => {
              toast.error(`Approval failed: ${error.message}`)
              setIsApproving(false)
            },
          }
        )

        // Wait for approval to complete before depositing
        // The deposit will be triggered after approval success
        return
      }

      // If already approved, proceed with deposit
      handleDeposit()
    } catch (error: any) {
      toast.error(`Transaction failed: ${error.message}`)
      setIsApproving(false)
      setIsDepositing(false)
    }
  }

  // Trigger deposit after approval succeeds
  useEffect(() => {
    if (isApproveSuccess && isApproving && amount && !isDepositing) {
      setIsApproving(false)
      // Small delay to ensure state is updated
      setTimeout(() => {
        handleDeposit()
      }, 1000)
    }
  }, [isApproveSuccess])

  // Get similar vaults (other vaults excluding current)
  const similarVaults = useMemo(() => {
    if (!vaults || !currentVault) return []
    return vaults
      .filter((v) => v.address.toLowerCase() !== vaultAddress.toLowerCase())
      .slice(0, 5)
      .map((v) => ({
        address: v.address,
        name: v.name,
        category: "Vault",
        return: v.perf,
        aum: v.aum,
      }))
  }, [vaults, currentVault, vaultAddress])

  // Get all unique token addresses to check balances
  const tokenAddresses = useMemo(() => {
    return Array.from(TOKEN_MAP.keys()).map(addr => addr as `0x${string}`)
  }, [])

  // Get balances for all tokens in the vault
  const balanceContracts = useMemo(() => {
    if (!vaultAddress) return []
    return tokenAddresses.map((tokenAddr) => ({
      address: tokenAddr,
      abi: ERC20_ABI,
      functionName: "balanceOf" as const,
      args: [vaultAddress as `0x${string}`],
    }))
  }, [vaultAddress, tokenAddresses])

  const { data: balanceResults, isLoading: balancesLoading } = useReadContracts({
    contracts: balanceContracts,
    query: {
      enabled: balanceContracts.length > 0 && !!vaultAddress,
    },
  })

  // Calculate vault holdings with percentages
  const vaultHoldings = useMemo(() => {
    if (!balanceResults || !currentVault || !currentVault.totalAssets) return []
    
    const holdings: Array<{ token: string; percentage: string; amount: string }> = []
    const totalAssets = currentVault.totalAssets
    
    balanceResults.forEach((result, index) => {
      if (result.status === "success" && result.result) {
        const balance = result.result as bigint
        const tokenAddress = tokenAddresses[index]
        const tokenInfo = TOKEN_MAP.get(tokenAddress.toLowerCase())
        
        if (tokenInfo && balance > BigInt(0)) {
          const balanceFormatted = formatUnits(balance, tokenInfo.decimals)
          const balanceValue = Number(balanceFormatted)
          const totalAssetsValue = Number(formatUnits(totalAssets, 18))
          
          // Calculate percentage (assuming 1:1 value for simplicity, or use actual pricing)
          const percentage = totalAssetsValue > 0 
            ? ((balanceValue / totalAssetsValue) * 100).toFixed(2)
            : "0.00"
          
          // Format amount in USD (simplified - would need actual token prices)
          const amountUSD = `$${(balanceValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          
          holdings.push({
            token: tokenInfo.symbol,
            percentage: `${percentage}%`,
            amount: amountUSD,
          })
        }
      }
    })
    
    // Sort by percentage descending
    return holdings.sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage))
  }, [balanceResults, currentVault, tokenAddresses])

  // Map vault data to fund data format
  const fundData = useMemo(() => {
    if (!currentVault) return defaultFundData
    return {
      name: currentVault.name,
      category: "Vault",
      rating: 4.5, // Mock rating
      oneYearReturn: currentVault.perf,
      allTimeReturn: currentVault.perf,
      aum: currentVault.aum,
      traderExperience: 0, // Mock
      description: `A decentralized vault managed on-chain. Total assets under management: ${currentVault.aum}. Issued shares: ${currentVault.issuedShares}.`,
      minInvestment: "$100",
      fees: "2% management fee, 20% performance fee",
    }
  }, [currentVault])

  const data = chartData[duration as keyof typeof chartData] || chartData["1Y"]
  const maxValue = Math.max(...data)
  const minValue = Math.min(...data)

  const handleProposeRebalance = () => {
    // TODO: Implement propose rebalance functionality
    console.log("Propose fund rebalance clicked")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading vault data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentVault) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-muted-foreground text-lg mb-4">Vault not found</p>
            <Button onClick={() => router.push("/app")} variant="outline">
              Back to Vaults
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{fundData.name}</h1>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                {vaultAddress}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Chart Section */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1M">1 Month</SelectItem>
                    <SelectItem value="3M">3 Months</SelectItem>
                    <SelectItem value="6M">6 Months</SelectItem>
                    <SelectItem value="1Y">1 Year</SelectItem>
                    <SelectItem value="All">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-64 relative">
                <svg className="w-full h-full" viewBox="0 0 1000 264" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  <polygon
                    fill="url(#lineGradient)"
                    className="text-primary"
                    points={`0,264 ${data.map((value, index) => {
                      const x = (index / (data.length - 1)) * 1000
                      const y = 264 - ((value - minValue) / (maxValue - minValue)) * 264
                      return `${x},${y}`
                    }).join(" ")} 1000,264`}
                  />
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-primary"
                    points={data.map((value, index) => {
                      const x = (index / (data.length - 1)) * 1000
                      const y = 264 - ((value - minValue) / (maxValue - minValue)) * 264
                      return `${x},${y}`
                    }).join(" ")}
                  />
                </svg>
              </div>
            </Card>

            {/* Invest Section */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Invest Amount (in USDC)</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-foreground whitespace-nowrap">
                    Investment Amount (USDC)
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter amount in USDC"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 border-2 border-border"
                    disabled={isApproving || isDepositing || isApprovingTx || isDepositingTx}
                  />
                </div>
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleInvest}
                  disabled={
                    !isConnected ||
                    !amount ||
                    parseFloat(amount) <= 0 ||
                    isApproving ||
                    isDepositing ||
                    isApprovingTx ||
                    isDepositingTx
                  }
                >
                  {isApproving || isApprovingTx ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Approving USDC...
                    </>
                  ) : isDepositing || isDepositingTx ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Depositing...
                    </>
                  ) : (
                    "Invest Now"
                  )}
                </Button>
                {!isConnected && (
                  <p className="text-sm text-muted-foreground text-center">
                    Please connect your wallet to invest
                  </p>
                )}
              </div>
            </Card>

            {/* Details Section */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Fund Details</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Description</h3>
                  <p className="text-muted-foreground">{fundData.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-semibold text-foreground">{fundData.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <p className="font-semibold text-foreground">{fundData.rating}/5.0</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">1 Year Return</p>
                    <p className="font-semibold text-primary">{fundData.oneYearReturn}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">All Time Return</p>
                    <p className="font-semibold text-primary">{fundData.allTimeReturn}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">AUM</p>
                    <p className="font-semibold text-foreground">{fundData.aum}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Trader Experience</p>
                    <p className="font-semibold text-foreground">{fundData.traderExperience} years</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Fees</h3>
                  <p className="text-muted-foreground">{fundData.fees}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-4">Current Holdings</h3>
                  {balancesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="ml-2 text-muted-foreground">Loading holdings...</span>
                    </div>
                  ) : vaultHoldings.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Token</TableHead>
                          <TableHead>Current Percentage</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vaultHoldings.map((holding, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{holding.token}</TableCell>
                            <TableCell>{holding.percentage}</TableCell>
                            <TableCell className="text-right">{holding.amount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">No holdings found</p>
                  )}
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-4">
                    If you believe the fund's current allocation is not performing optimally or needs adjustment, you can propose a rebalancing strategy that will be reviewed by the fund manager and voted on by other investors.
                  </p>
                  <Button
                    onClick={handleProposeRebalance}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Propose a Fund Rebalance
                  </Button>
                </div>
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-foreground mb-4">Active Proposals!</h3>
                  {activeProposals.length > 0 ? (
                    <div className="space-y-3">
                      {activeProposals.map((proposal) => (
                        <Card key={proposal.id} className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                                  {proposal.type}
                                </span>
                                <span className={`text-xs font-medium px-2 py-1 rounded ${
                                  proposal.status === "Active"
                                    ? "text-green-600 bg-green-500/10"
                                    : "text-muted-foreground bg-muted"
                                }`}>
                                  {proposal.status}
                                </span>
                              </div>
                              <p className="text-sm text-foreground mb-2">{proposal.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {proposal.votes} votes
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No active proposals at this time.</p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Similar Funds Sidebar - Sticky */}
          <aside className="lg:sticky lg:top-20 h-fit">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Similar Funds</h2>
              <div className="space-y-4">
                {similarVaults.length > 0 ? (
                  similarVaults.map((fund) => (
                    <div
                      key={fund.address}
                      className="p-4 border rounded-lg hover:border-primary/50 transition cursor-pointer"
                      onClick={() => router.push(`/app/fund/${fund.address}`)}
                    >
                      <h3 className="font-semibold text-foreground mb-1">{fund.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{fund.category}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-semibold">{fund.return}</span>
                        <span className="text-xs text-muted-foreground">{fund.aum}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No other vaults available</p>
                )}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}

