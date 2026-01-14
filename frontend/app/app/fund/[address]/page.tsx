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
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useReadContracts, usePublicClient } from "wagmi"
import { parseUnits, formatUnits, maxUint256, decodeEventLog } from "viem"
import { toast } from "sonner"
import { CONTRACTS } from "@/lib/contracts"
import addresses from "@/../addresses.json"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
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


// Mock active proposals - empty for now
const activeProposals: Array<{ id: number; type: string; description: string; votes: number; status: string }> = []

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

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
)

// Helper function to generate consistent random return for a vault (returns percentage as string)
const getRandomReturn = (vaultAddress: string): string => {
  // Use vault address as seed for consistent random value per vault
  const hash = vaultAddress.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const seed = hash % 1000
  // Generate value between 3.0 and 6.0
  const returnValue = 3.0 + (seed / 1000) * 3.0
  return `+${returnValue.toFixed(2)}%`
}

// Generate 5 days of chart data based on vault address and target return
const generateChartData = (vaultAddress: string, targetReturnPercent: string) => {
  // Parse the return percentage (e.g., "+4.50%" -> 4.50)
  const returnMatch = targetReturnPercent.match(/[+-]?(\d+\.?\d*)/)
  const returnValue = returnMatch ? parseFloat(returnMatch[1]) : 0
  
  // Calculate target end value: $1 * (1 + return/100)
  const startValue = 1.0
  const targetEndValue = startValue * (1 + returnValue / 100)
  
  const data = []
  const today = new Date()
  const values: number[] = []
  
  // Generate random intermediate values for first 4 days
  // Start at $1.00
  values.push(startValue)
  
  // Generate 3 intermediate values with random fluctuations
  for (let i = 1; i < 4; i++) {
    const daySeed = vaultAddress + i.toString()
    let dayHash = 0
    for (let j = 0; j < daySeed.length; j++) {
      dayHash = daySeed.charCodeAt(j) + ((dayHash << 5) - dayHash)
    }
    const dayRandom = (dayHash % 1000) / 1000
    
    // Daily change between -1.5% and +1.5%
    const dailyChange = (dayRandom - 0.5) * 3.0 // Range: -1.5 to +1.5
    
    // Update value with random fluctuation
    const prevValue = values[i - 1]
    const newValue = prevValue * (1 + dailyChange / 100)
    values.push(Math.max(0.5, newValue)) // Ensure value doesn't go too low
  }
  
  // Calculate the 5th value to reach the target
  // We need: values[3] * change = targetEndValue
  // So: change = targetEndValue / values[3]
  const fourthValue = values[3]
  const requiredChange = targetEndValue / fourthValue
  const finalValue = fourthValue * requiredChange
  values.push(finalValue)
  
  // Generate dates and format data
  for (let i = 4; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Generate random time for each day (between 9 AM and 4 PM for market hours feel)
    const daySeed = vaultAddress + i.toString()
    let timeHash = 0
    for (let j = 0; j < daySeed.length; j++) {
      timeHash = daySeed.charCodeAt(j) + ((timeHash << 5) - timeHash)
    }
    const timeRandom = (timeHash % 1000) / 1000
    const hours = 9 + Math.floor(timeRandom * 7) // 9 AM to 4 PM
    const minutes = Math.floor((timeRandom * 60) % 60)
    date.setHours(hours, minutes, 0, 0)
    
    const valueIndex = 4 - i // Reverse index for values array
    const currentValue = values[valueIndex]
    
    // Format date as "MMM DD" (e.g., "Jan 15")
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    
    // Calculate percentage change from start
    const changePercent = ((currentValue - startValue) / startValue) * 100
    
    data.push({
      date: dateStr,
      fullDate: date.toISOString(), // Store full date with time for tooltip
      value: currentValue,
      change: changePercent,
      isPositive: currentValue >= startValue,
    })
  }
  
  return data
}

export default function FundPage() {
  const params = useParams()
  const router = useRouter()
  const vaultAddress = params.address as string
  const { vaults, isLoading } = useAllVaults()
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
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

  // Helper function to format AUM in USDC (from totalAssets) - same as manager page
  const formatAUM = (totalAssets?: bigint): string => {
    if (!totalAssets || totalAssets === BigInt(0)) {
      return "$0.00"
    }
    
    // Convert from wei (18 decimals) to USDC
    const aumInUSDC = Number(formatUnits(totalAssets, 18))
    
    // Format based on size
    if (aumInUSDC >= 1_000_000) {
      // Show in millions (M)
      return `$${(aumInUSDC / 1_000_000).toFixed(2)}M`
    } else if (aumInUSDC >= 1_000) {
      // Show in thousands (K)
      return `$${(aumInUSDC / 1_000).toFixed(2)}K`
    } else {
      // Show as is
      return `$${aumInUSDC.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  }

  // Map vault data to fund data format
  const fundData = useMemo(() => {
    if (!currentVault) return defaultFundData
    const randomReturn = getRandomReturn(currentVault.address)
    const aum = formatAUM(currentVault.totalAssets)
    return {
      name: currentVault.name,
      category: "Vault",
      rating: 4.5, // Mock rating
      oneYearReturn: randomReturn,
      allTimeReturn: randomReturn,
      aum: aum,
      traderExperience: 0, // Set to 0 years
      description: `A decentralized vault managed on-chain. Total assets under management: ${aum}. Issued shares: ${currentVault.issuedShares}.`,
      minInvestment: "$100",
      fees: "2% management fee, 20% performance fee",
    }
  }, [currentVault])

  // Generate chart data based on vault address and 1 year return (always 5 days)
  const chartData = useMemo(() => {
    if (!vaultAddress || !fundData.oneYearReturn) return []
    return generateChartData(vaultAddress, fundData.oneYearReturn)
  }, [vaultAddress, fundData.oneYearReturn])

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
          
          // Parse Deposit event from transaction receipt to get exact shares
          let sharesReceived: number = 0
          
          try {
            if (publicClient && depositReceipt) {
              // Find the Deposit event in the logs
              // Deposit event signature: Deposit(address indexed sender, address indexed receiver, uint256 assets, uint256 shares)
              const depositEventAbi = {
                anonymous: false,
                inputs: [
                  { indexed: true, name: 'sender', type: 'address' },
                  { indexed: true, name: 'receiver', type: 'address' },
                  { indexed: false, name: 'assets', type: 'uint256' },
                  { indexed: false, name: 'shares', type: 'uint256' },
                ],
                name: 'Deposit',
                type: 'event',
              } as const
              
              // Find the Deposit event in the transaction logs
              for (const log of depositReceipt.logs || []) {
                try {
                  const decoded = decodeEventLog({
                    abi: [depositEventAbi],
                    data: log.data,
                    topics: log.topics,
                  })
                  
                  // Check if this is a Deposit event and matches our vault address
                  if (decoded.eventName === 'Deposit' && 
                      log.address.toLowerCase() === vaultAddress.toLowerCase() &&
                      decoded.args.receiver?.toLowerCase() === address.toLowerCase()) {
                    // Found the Deposit event! Extract shares
                    if (decoded.args.shares && typeof decoded.args.shares === 'bigint') {
                      sharesReceived = Number(formatUnits(decoded.args.shares, 18))
                      console.log('Shares received from Deposit event:', sharesReceived)
                      break
                    }
                  }
                } catch (e) {
                  // Not a Deposit event, continue searching
                  continue
                }
              }
            }
          } catch (eventError) {
            console.warn('Failed to parse Deposit event, falling back to calculation:', eventError)
          }
          
          // Fallback: Calculate shares from totalSupply difference if event parsing failed
          if (sharesReceived === 0) {
            await refetchTotalSupplyAfter()
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            if (totalSupplyAfter && totalSupplyBefore && typeof totalSupplyAfter === 'bigint' && typeof totalSupplyBefore === 'bigint') {
              // Convert both from wei, then subtract
              const totalSupplyAfterNum = Number(formatUnits(totalSupplyAfter, 18))
              const totalSupplyBeforeNum = Number(formatUnits(totalSupplyBefore, 18))
              sharesReceived = totalSupplyAfterNum - totalSupplyBeforeNum
              console.log('Shares calculated from totalSupply difference:', sharesReceived)
            } else if (previewShares && typeof previewShares === 'bigint') {
              // Fallback: use previewDeposit if available
              sharesReceived = Number(formatUnits(previewShares, 18))
              console.log('Shares from previewDeposit:', sharesReceived)
            } else {
              // Final fallback: assume 1:1 (should not happen)
              sharesReceived = parseFloat(amount)
              console.warn('Using fallback 1:1 ratio for shares:', sharesReceived)
            }
          }
          
          // Validate shares received
          if (sharesReceived <= 0 || isNaN(sharesReceived)) {
            console.error('Invalid shares received:', sharesReceived)
            toast.error('Failed to calculate shares received. Please check the transaction.')
            depositLoggedRef.current = null
            return
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
  // Use same return and AUM formatting as explore page
  const similarVaults = useMemo(() => {
    if (!vaults || !currentVault) return []
    return vaults
      .filter((v) => v.address.toLowerCase() !== vaultAddress.toLowerCase())
      .slice(0, 5)
      .map((v) => ({
        address: v.address,
        name: v.name,
        category: "Vault",
        return: getRandomReturn(v.address), // Use same function as explore page
        aum: formatAUM(v.totalAssets), // Use same function as explore page with totalAssets
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

  // Get ValuationModule address from vault
  const { data: valuationModuleAddress } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: CONTRACTS.AssetVault.abi,
    functionName: "valuationModule",
    query: {
      enabled: !!vaultAddress,
    },
  })

  // Fetch prices for all tokens from ValuationModule
  const priceContracts = useMemo(() => {
    if (!valuationModuleAddress || !tokenAddresses.length) return []
    return tokenAddresses.map((tokenAddr) => ({
      address: valuationModuleAddress as `0x${string}`,
      abi: CONTRACTS.ValuationModule.abi,
      functionName: "getPrice" as const,
      args: [tokenAddr],
    })) as any
  }, [valuationModuleAddress, tokenAddresses])

  const { data: priceResults, isLoading: pricesLoading } = useReadContracts({
    contracts: priceContracts,
    query: {
      enabled: priceContracts.length > 0 && !!valuationModuleAddress,
    },
  })

  // Calculate vault holdings with percentages and prices
  const vaultHoldings = useMemo(() => {
    if (!balanceResults || !currentVault || !currentVault.totalAssets) return []
    
    const holdings: Array<{ 
      token: string
      percentage: string
      amount: string
      price: string
    }> = []
    const totalAssets = currentVault.totalAssets
    const totalAssetsValue = Number(formatUnits(totalAssets, 18))
    
    balanceResults.forEach((result, index) => {
      if (result.status === "success" && result.result) {
        const balance = result.result as bigint
        const tokenAddress = tokenAddresses[index]
        const tokenInfo = TOKEN_MAP.get(tokenAddress.toLowerCase())
        
        if (tokenInfo && balance > BigInt(0)) {
          const balanceFormatted = formatUnits(balance, tokenInfo.decimals)
          const balanceValue = Number(balanceFormatted)
          
          // Get price from ValuationModule (price is in USDC, 18 decimals)
          let priceInUSDC = BigInt(0)
          let priceDisplay = "N/A"
          let usdValue = 0
          
          if (priceResults && priceResults[index]?.status === "success" && priceResults[index]?.result) {
            priceInUSDC = priceResults[index].result as bigint
            
            if (priceInUSDC > BigInt(0)) {
              // Price is in wei (18 decimals), convert to readable format
              const priceValue = Number(formatUnits(priceInUSDC, 18))
              
              // Format price display
              if (priceValue >= 1000) {
                priceDisplay = `$${priceValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
              } else {
                priceDisplay = `$${priceValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
              }
              
              // Calculate USD value: (balance * price) / 1e18
              // balance is in token decimals, price is in 18 decimals
              // We need to convert balance to 18 decimals first, then multiply by price, then divide by 1e18
              const balanceIn18Decimals = balance * BigInt(10 ** (18 - tokenInfo.decimals))
              const usdValueWei = (balanceIn18Decimals * priceInUSDC) / BigInt(10 ** 18)
              usdValue = Number(formatUnits(usdValueWei, 18))
            }
          }
          
          // Calculate percentage based on actual USD value
          const percentage = totalAssetsValue > 0 && usdValue > 0
            ? ((usdValue / totalAssetsValue) * 100).toFixed(2)
            : "0.00"
          
          // Format amount in USD
          const amountUSD = usdValue > 0
            ? `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : "N/A"
          
          holdings.push({
            token: tokenInfo.symbol,
            percentage: `${percentage}%`,
            amount: amountUSD,
            price: priceDisplay,
          })
        }
      }
    })
    
    // Sort by percentage descending
    return holdings.sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage))
  }, [balanceResults, priceResults, currentVault, tokenAddresses, TOKEN_MAP])


  // Prepare Chart.js data
  const chartJsData = useMemo(() => {
    if (!chartData.length) return null
    
    return {
      labels: chartData.map(d => d.date),
      datasets: [
        {
          label: 'Value',
          data: chartData.map(d => d.value),
          borderColor: '#22c55e', // Green color
          backgroundColor: '#22c55e',
          borderWidth: 3,
          pointRadius: 0, // Hide points by default
          pointHoverRadius: 6, // Show point on hover
          pointHoverBackgroundColor: '#ffffff', // White on hover
          pointHoverBorderColor: '#22c55e', // Green border on hover
          pointHoverBorderWidth: 3,
          tension: 0, // Straight lines connecting points
          fill: false,
          spanGaps: false,
        },
      ],
    }
  }, [chartData])

  // Chart.js options
  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          mode: 'index' as const,
          intersect: false,
          backgroundColor: '#ffffff', // White background
          titleColor: '#22c55e', // Green text
          bodyColor: '#22c55e', // Green text
          borderColor: '#22c55e', // Green border
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            title: () => '', // No title, we'll show time in label
            label: (context: any) => {
              const index = context.dataIndex
              const data = chartData[index]
              const value = context.parsed.y
              if (data) {
                const date = new Date(data.fullDate)
                const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                return `$${value.toFixed(2)} | ${timeStr}`
              }
              return `$${value.toFixed(2)}`
            },
            labelTextColor: () => '#22c55e', // Green text
          },
        },
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: false,
          },
          ticks: {
            color: 'hsl(var(--muted-foreground))',
            font: {
              size: 12,
            },
          },
          border: {
            display: false,
          },
        },
        y: {
          display: false,
          grid: {
            display: false,
          },
        },
      },
      interaction: {
        intersect: false,
        mode: 'index' as const,
      },
    }
  }, [chartData])

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
            {/* Fund Details Section - First */}
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
                  {(balancesLoading || pricesLoading) ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="ml-2 text-muted-foreground">Loading holdings...</span>
                    </div>
                  ) : vaultHoldings.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Token</TableHead>
                          <TableHead>Price (USDC)</TableHead>
                        <TableHead>Current Percentage</TableHead>
                          <TableHead className="text-right">Amount (USD)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {vaultHoldings.map((holding, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{holding.token}</TableCell>
                            <TableCell>{holding.price}</TableCell>
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

            {/* Fund Performance Chart Section - Below Fund Details */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">Fund Performance</h2>
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
              <div className="h-64 w-full">
                {chartJsData ? (
                  <Line data={chartJsData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
            </Card>

            {/* If you believe Section - At the bottom */}
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                If you believe the fund's current allocation is not performing optimally or needs adjustment, you can propose a rebalancing strategy that will be reviewed by the fund manager and voted on by other investors.
              </p>
              <Button
                onClick={handleProposeRebalance}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Propose a Fund Rebalance
              </Button>
            </Card>
          </div>

          {/* Right Sidebar - Sticky with Invest Amount on top and Similar Funds below */}
          <aside className="lg:sticky lg:top-20 h-fit space-y-6">
            {/* Invest Amount Section - Top of sidebar */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Invest Amount (in USDC)</h2>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">
                    Investment Amount (USDC)
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter amount in USDC"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="border-2 border-border"
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

            {/* Similar Funds Section - Below Invest Amount, scrollable */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Similar Funds</h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
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

