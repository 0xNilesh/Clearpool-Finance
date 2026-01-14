"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi"
import { useAllVaults } from "@/hooks/use-vaults"
import { useReadContracts } from "wagmi"
import { CONTRACTS } from "@/lib/contracts"
import { formatUnits, parseUnits, maxUint256, decodeEventLog } from "viem"
import { Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import addresses from "@/../addresses.json"

interface Position {
  userAddress: string
  vaultAddress: string
  orders: Array<{
    orderId: string
    type: "deposit" | "redeem"
    amount: number | null
    shares: number
    transactionHash: string
    blockNumber: string | null
    timestamp: Date | string
  }>
  totalShares: number
  totalInvestedValue: number
  createdAt: Date | string
  updatedAt: Date | string
}

interface Holding {
  vaultAddress: string
  name: string
  investedAmount: number
  currentAmount: number
  rateOfReturn: number
  shares: number
}

interface Order {
  id: string
  fund: string
  vaultAddress: string
  type: "Buy" | "Sell"
  amount: number
  shares: number
  price: number
  date: string
  status: "Completed"
}

export default function Portfolio() {
  const [activeTab, setActiveTab] = useState("holdings")
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { vaults, isLoading: vaultsLoading } = useAllVaults()
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoadingPositions, setIsLoadingPositions] = useState(false)
  const [redeemModalOpen, setRedeemModalOpen] = useState(false)
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null)
  const [sharesInput, setSharesInput] = useState("")
  const [isApproving, setIsApproving] = useState(false)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [isRedeemComplete, setIsRedeemComplete] = useState(false) // Track when transaction + API are complete
  const redeemLoggedRef = useRef<string | null>(null) // Track logged transaction hashes to prevent duplicate API calls

  // ERC20 ABI for approve and allowance
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
  ] as const

  // Fetch positions from API - extracted to be callable from other places
  const fetchPositions = useRef<(() => Promise<void>) | null>(null)
  
  useEffect(() => {
    if (!address || !isConnected) {
      setPositions([])
      return
    }

    const fetchPositionsFn = async () => {
      setIsLoadingPositions(true)
      try {
        const response = await fetch(`/api/positions?userAddress=${address}`)
        if (response.ok) {
          const data = await response.json()
          setPositions(data.positions || [])
        } else {
          console.error("Failed to fetch positions")
          setPositions([])
        }
      } catch (error) {
        console.error("Error fetching positions:", error)
        setPositions([])
      } finally {
        setIsLoadingPositions(false)
      }
    }

    // Store function in ref so it can be called from other places
    fetchPositions.current = fetchPositionsFn
    
    fetchPositionsFn()
  }, [address, isConnected])

  // Get vault addresses from positions
  const vaultAddresses = useMemo(() => {
    return positions.map((p) => p.vaultAddress.toLowerCase())
  }, [positions])

  // Fetch current prices (totalAssets / totalSupply) for each vault
  const priceContracts = useMemo(() => {
    if (vaultAddresses.length === 0) return []
    return vaultAddresses.flatMap((vaultAddr) => {
      const vault = vaults.find((v) => v.address.toLowerCase() === vaultAddr)
      if (!vault) return []
      return [
        {
          address: vault.address as `0x${string}`,
          abi: CONTRACTS.AssetVault.abi,
          functionName: "totalAssets" as const,
        },
        {
          address: vault.address as `0x${string}`,
          abi: CONTRACTS.AssetVault.abi,
          functionName: "totalSupply" as const,
        },
      ]
    }) as any
  }, [vaultAddresses, vaults])

  const { data: priceData, isLoading: priceLoading } = useReadContracts({
    contracts: priceContracts,
    query: {
      enabled: priceContracts.length > 0,
      refetchInterval: 300000, // Refetch every 5 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch on mount - use cache
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  })

  // Calculate holdings with current values
  const holdings = useMemo((): Holding[] => {
    if (!positions.length || !vaults.length || !priceData) return []

    const holdingsMap = new Map<string, Holding>()

    positions.forEach((position) => {
      const vault = vaults.find((v) => v.address.toLowerCase() === position.vaultAddress.toLowerCase())
      if (!vault) return

      const vaultIndex = vaultAddresses.indexOf(position.vaultAddress.toLowerCase())
      if (vaultIndex === -1) return

      const totalAssetsResult = priceData[vaultIndex * 2]
      const totalSupplyResult = priceData[vaultIndex * 2 + 1]

      const totalAssetsWei = totalAssetsResult?.status === "success" ? (totalAssetsResult.result as bigint) : BigInt(0)
      const totalSupplyWei = totalSupplyResult?.status === "success" ? (totalSupplyResult.result as bigint) : BigInt(1)

      // Convert from wei (18 decimals) to normal numbers
      const totalAssets = Number(formatUnits(totalAssetsWei, 18))
      const totalSupply = Number(formatUnits(totalSupplyWei, 18))

      // Calculate price per share: NAV (totalAssets) / total shares issued (totalSupply)
      const pricePerShare = totalSupply > 0 ? totalAssets / totalSupply : 0

      // Convert user shares from wei if needed (shares might be stored in wei format)
      // If shares > 1e10, they're likely in wei format (18 decimals)
      let userShares = position.totalShares
      if (userShares > 1e10) {
        // Convert from wei (18 decimals) to normal number
        userShares = Number(formatUnits(BigInt(Math.floor(userShares)), 18))
      }

      // Current value = user shares * price per share
      const currentAmount = userShares * pricePerShare
      const investedAmount = position.totalInvestedValue

      // Calculate rate of return
      const rateOfReturn = investedAmount > 0 ? ((currentAmount - investedAmount) / investedAmount) * 100 : 0

      holdingsMap.set(position.vaultAddress.toLowerCase(), {
        vaultAddress: position.vaultAddress,
        name: vault.name || `Vault ${vault.id}`,
        investedAmount,
        currentAmount,
        rateOfReturn,
        shares: userShares,
      })
    })

    return Array.from(holdingsMap.values())
  }, [positions, vaults, priceData, vaultAddresses])

  // Calculate all orders from positions
  const allOrders = useMemo((): Order[] => {
    if (!positions.length || !vaults.length) return []

    const orders: Order[] = []

    positions.forEach((position) => {
      const vault = vaults.find((v) => v.address.toLowerCase() === position.vaultAddress.toLowerCase())
      if (!vault) return

      position.orders.forEach((order) => {
        const orderDate = new Date(order.timestamp)
        const dateStr = orderDate.toISOString().split("T")[0]

        // Convert order shares from wei if needed
        let orderShares = order.shares
        if (orderShares > 1e10) {
          // Convert from wei (18 decimals) to normal number
          orderShares = Number(formatUnits(BigInt(Math.floor(orderShares)), 18))
        }

        // Calculate price per share at time of order
        // For simplicity, we'll use the current price (in a real app, you'd track historical prices)
        const vaultIndex = vaultAddresses.indexOf(position.vaultAddress.toLowerCase())
        let pricePerShare = 1 // Default

        if (vaultIndex !== -1 && priceData) {
          const totalAssetsResult = priceData[vaultIndex * 2]
          const totalSupplyResult = priceData[vaultIndex * 2 + 1]
          const totalAssetsWei = totalAssetsResult?.status === "success" ? (totalAssetsResult.result as bigint) : BigInt(0)
          const totalSupplyWei = totalSupplyResult?.status === "success" ? (totalSupplyResult.result as bigint) : BigInt(1)
          
          // Convert from wei (18 decimals) to normal numbers
          const totalAssets = Number(formatUnits(totalAssetsWei, 18))
          const totalSupply = Number(formatUnits(totalSupplyWei, 18))
          
          pricePerShare = totalSupply > 0 ? totalAssets / totalSupply : 1
        }

        orders.push({
          id: order.orderId,
          fund: vault.name || `Vault ${vault.id}`,
          vaultAddress: position.vaultAddress,
          type: order.type === "deposit" ? "Buy" : "Sell",
          amount: order.amount || orderShares * pricePerShare,
          shares: orderShares,
          price: pricePerShare,
          date: dateStr,
          status: "Completed",
        })
      })
    })

    // Sort by date (newest first)
    return orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [positions, vaults, vaultAddresses, priceData])

  // Filter redeemed orders
  const redeemedOrders = useMemo(() => {
    return allOrders.filter((order) => order.type === "Sell")
  }, [allOrders])

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    const totalInvested = holdings.reduce((sum, h) => sum + h.investedAmount, 0)
    const totalCurrentValue = holdings.reduce((sum, h) => sum + h.currentAmount, 0)
    const totalReturns = totalCurrentValue - totalInvested
    const totalReturnsPercent = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0

    return {
      portfolioValue: totalCurrentValue,
      totalReturns,
      totalReturnsPercent,
      invested: totalInvested,
    }
  }, [holdings])

  const formatCurrency = (value: number) => {
    if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`
    } else {
      return `$${value.toFixed(2)}`
    }
  }

  // Get USDC address
  const usdcAddress = addresses.testTokens.USDC.address as `0x${string}`

  // Convert shares input to wei for previewRedeem
  const sharesToRedeem = useMemo(() => {
    if (!selectedHolding || !sharesInput || parseFloat(sharesInput) <= 0) return null
    try {
      return parseUnits(sharesInput, 18)
    } catch {
      return null
    }
  }, [selectedHolding, sharesInput])

  // Call previewRedeem with entered shares
  const { data: previewRedeemResult, isLoading: isLoadingPreviewRedeem } = useReadContract({
    address: selectedHolding?.vaultAddress as `0x${string}` | undefined,
    abi: CONTRACTS.AssetVault.abi,
    functionName: "previewRedeem",
    args: sharesToRedeem ? [sharesToRedeem] : undefined,
    query: {
      enabled: !!selectedHolding && !!sharesToRedeem && isConnected,
      refetchInterval: false, // Don't auto-refetch preview calls
      refetchOnWindowFocus: false,
    },
  })

  // Get vault USDC balance
  const { data: vaultUSDCBalance } = useReadContract({
    address: usdcAddress,
    abi: [
      {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
      },
    ] as const,
    functionName: "balanceOf",
    args: selectedHolding?.vaultAddress ? [selectedHolding.vaultAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!selectedHolding && isConnected,
      refetchInterval: 300000, // Refetch every 5 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000,
    },
  })

  // Check if vault has enough USDC for redemption
  const hasEnoughBalance = useMemo(() => {
    if (!previewRedeemResult || !vaultUSDCBalance) return false
    return vaultUSDCBalance >= (previewRedeemResult as bigint)
  }, [previewRedeemResult, vaultUSDCBalance])

  // Check allowance for vault shares
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: selectedHolding?.vaultAddress as `0x${string}` | undefined,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && selectedHolding ? [address, selectedHolding.vaultAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!address && !!selectedHolding && isConnected,
      refetchInterval: false, // Don't auto-refetch allowance (only refetch after approval)
      refetchOnWindowFocus: false,
    },
  })

  const { writeContract: writeApprove, data: approveHash } = useWriteContract()
  const { writeContract: writeRedeem, data: redeemHash } = useWriteContract()
  const { writeContract: writeRequestRedeem, data: requestRedeemHash } = useWriteContract()

  const { isLoading: isApprovingTx, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  const { isLoading: isRedeemingTx, isSuccess: isRedeemSuccess, data: redeemReceipt } = useWaitForTransactionReceipt({
    hash: redeemHash,
  })

  const { isLoading: isRequestRedeemingTx, isSuccess: isRequestRedeemSuccess, data: requestRedeemReceipt } = useWaitForTransactionReceipt({
    hash: requestRedeemHash,
  })

  // Handle approve success
  useEffect(() => {
    if (isApproveSuccess) {
      toast.success("Shares approved successfully!")
      setIsApproving(false)
      refetchAllowance()
    }
  }, [isApproveSuccess, refetchAllowance])

  // Handle redeem success - ONLY call API when transaction is confirmed successful
  useEffect(() => {
    // Only proceed if transaction is successful, we have receipt, and we haven't logged this transaction yet
    const txHash = redeemReceipt?.transactionHash
    if (
      isRedeemSuccess && 
      redeemReceipt && 
      txHash &&
      address && 
      selectedHolding && 
      sharesToRedeem &&
      redeemLoggedRef.current !== txHash // Prevent duplicate calls
    ) {
      // Mark this transaction as being logged
      redeemLoggedRef.current = txHash

      const logRedeem = async () => {
        try {
          // Wait for blockchain state to update after transaction confirmation
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // Parse Withdraw event from transaction receipt to get exact shares and assets
          let sharesRedeemed: number = 0
          let amountReceived: number | null = null
          
          try {
            if (publicClient && redeemReceipt) {
              // Find the Withdraw event in the logs
              // Withdraw event signature: Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)
              const withdrawEventAbi = {
                anonymous: false,
                inputs: [
                  { indexed: true, name: 'sender', type: 'address' },
                  { indexed: true, name: 'receiver', type: 'address' },
                  { indexed: true, name: 'owner', type: 'address' },
                  { indexed: false, name: 'assets', type: 'uint256' },
                  { indexed: false, name: 'shares', type: 'uint256' },
                ],
                name: 'Withdraw',
                type: 'event',
              } as const
              
              // Find the Withdraw event in the transaction logs
              for (const log of redeemReceipt.logs || []) {
                try {
                  const decoded = decodeEventLog({
                    abi: [withdrawEventAbi],
                    data: log.data,
                    topics: log.topics,
                  })
                  
                  // Check if this is a Withdraw event and matches our vault address
                  if (decoded.eventName === 'Withdraw' && 
                      log.address.toLowerCase() === selectedHolding.vaultAddress.toLowerCase() &&
                      decoded.args.receiver?.toLowerCase() === address.toLowerCase()) {
                    // Found the Withdraw event! Extract shares and assets
                    if (decoded.args.shares && typeof decoded.args.shares === 'bigint') {
                      sharesRedeemed = Number(formatUnits(decoded.args.shares, 18))
                      console.log('Shares redeemed from Withdraw event:', sharesRedeemed)
                    }
                    if (decoded.args.assets && typeof decoded.args.assets === 'bigint') {
                      amountReceived = Number(formatUnits(decoded.args.assets, 18))
                      console.log('Assets received from Withdraw event:', amountReceived)
                    }
                    break
                  }
                } catch (e) {
                  // Not a Withdraw event, continue searching
                  continue
                }
              }
            }
          } catch (eventError) {
            console.warn('Failed to parse Withdraw event, falling back to calculation:', eventError)
          }
          
          // Fallback: Use sharesToRedeem and previewRedeemResult if event parsing failed
          if (sharesRedeemed === 0) {
            sharesRedeemed = Number(formatUnits(sharesToRedeem, 18))
            console.log('Shares from user input (fallback):', sharesRedeemed)
          }
          
          if (amountReceived === null) {
            amountReceived = previewRedeemResult 
              ? Number(formatUnits(previewRedeemResult as bigint, 18))
              : null
            console.log('Amount from previewRedeem (fallback):', amountReceived)
          }
          
          // Validate shares redeemed
          if (sharesRedeemed <= 0 || isNaN(sharesRedeemed)) {
            console.error('Invalid shares redeemed:', sharesRedeemed)
            toast.error('Failed to calculate shares redeemed. Please check the transaction.')
            redeemLoggedRef.current = null
            setIsRedeeming(false)
            return
          }

          // Call redeem API - ONLY ONCE after successful transaction
          const response = await fetch('/api/redeem', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userAddress: address,
              vaultAddress: selectedHolding.vaultAddress,
              shares: sharesRedeemed.toString(),
              amount: amountReceived?.toString() || null,
              transactionHash: txHash,
              blockNumber: redeemReceipt.blockNumber?.toString(),
              timestamp: new Date(),
            }),
          })

          if (!response.ok) {
            const error = await response.json()
            console.error('Failed to log redeem:', error)
            toast.error('Redeem successful but failed to log in database')
            // Reset ref on error so we can retry if needed
            redeemLoggedRef.current = null
            setIsRedeeming(false)
          } else {
            console.log('Redeem logged successfully')
            // Refetch positions to update UI with new values (reduced shares, etc.)
            if (fetchPositions.current) {
              await fetchPositions.current()
            }
            // Mark as complete - transaction + API both done
            setIsRedeemComplete(true)
            setIsRedeeming(false)
          }
        } catch (error) {
          console.error('Error logging redeem:', error)
          toast.error('Redeem successful but failed to log in database')
          // Reset ref on error so we can retry if needed
          redeemLoggedRef.current = null
          setIsRedeeming(false)
        }
      }

      // Don't close modal or clear input - keep it open until API completes
      setIsRedeeming(true) // Keep loading state
      
      // Log redeem to API
      logRedeem()
    }
  }, [isRedeemSuccess, redeemReceipt, address, selectedHolding, sharesToRedeem, previewRedeemResult, publicClient])

  // Handle request redeem success - ONLY call API when transaction is confirmed successful
  useEffect(() => {
    // Only proceed if transaction is successful, we have receipt, and we haven't logged this transaction yet
    const txHash = requestRedeemReceipt?.transactionHash
    if (
      isRequestRedeemSuccess && 
      requestRedeemReceipt && 
      txHash &&
      address && 
      selectedHolding && 
      sharesToRedeem &&
      redeemLoggedRef.current !== txHash // Prevent duplicate calls
    ) {
      // Mark this transaction as being logged
      redeemLoggedRef.current = txHash

      const logRedeem = async () => {
        try {
          // Wait for blockchain state to update after transaction confirmation
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // Parse WithdrawalRequested event from transaction receipt to get exact shares
          let sharesRedeemed: number = 0
          let amountReceived: number | null = null
          
          try {
            if (publicClient && requestRedeemReceipt) {
              // For requestRedeem, we look for WithdrawalRequested event
              // WithdrawalRequested event signature: WithdrawalRequested(uint256 indexed requestId, address indexed owner, uint256 sharesLocked)
              const withdrawalRequestedEventAbi = {
                anonymous: false,
                inputs: [
                  { indexed: true, name: 'requestId', type: 'uint256' },
                  { indexed: true, name: 'owner', type: 'address' },
                  { indexed: false, name: 'sharesLocked', type: 'uint256' },
                ],
                name: 'WithdrawalRequested',
                type: 'event',
              } as const
              
              // Find the WithdrawalRequested event in the transaction logs
              for (const log of requestRedeemReceipt.logs || []) {
                try {
                  const decoded = decodeEventLog({
                    abi: [withdrawalRequestedEventAbi],
                    data: log.data,
                    topics: log.topics,
                  })
                  
                  // Check if this is a WithdrawalRequested event and matches our vault address
                  if (decoded.eventName === 'WithdrawalRequested' && 
                      log.address.toLowerCase() === selectedHolding.vaultAddress.toLowerCase() &&
                      decoded.args.owner?.toLowerCase() === address.toLowerCase()) {
                    // Found the WithdrawalRequested event! Extract shares
                    if (decoded.args.sharesLocked && typeof decoded.args.sharesLocked === 'bigint') {
                      sharesRedeemed = Number(formatUnits(decoded.args.sharesLocked, 18))
                      console.log('Shares locked from WithdrawalRequested event:', sharesRedeemed)
                    }
                    break
                  }
                } catch (e) {
                  // Not a WithdrawalRequested event, continue searching
                  continue
                }
              }
            }
          } catch (eventError) {
            console.warn('Failed to parse WithdrawalRequested event, falling back to calculation:', eventError)
          }
          
          // Fallback: Use sharesToRedeem and previewRedeemResult if event parsing failed
          if (sharesRedeemed === 0) {
            sharesRedeemed = Number(formatUnits(sharesToRedeem, 18))
            console.log('Shares from user input (fallback):', sharesRedeemed)
          }
          
          if (amountReceived === null) {
            amountReceived = previewRedeemResult 
              ? Number(formatUnits(previewRedeemResult as bigint, 18))
              : null
            console.log('Amount from previewRedeem (fallback):', amountReceived)
          }
          
          // Validate shares redeemed
          if (sharesRedeemed <= 0 || isNaN(sharesRedeemed)) {
            console.error('Invalid shares redeemed:', sharesRedeemed)
            toast.error('Failed to calculate shares redeemed. Please check the transaction.')
            redeemLoggedRef.current = null
            setIsRedeeming(false)
            return
          }

          // Call redeem API - ONLY ONCE after successful transaction
          const response = await fetch('/api/redeem', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userAddress: address,
              vaultAddress: selectedHolding.vaultAddress,
              shares: sharesRedeemed.toString(),
              amount: amountReceived?.toString() || null,
              transactionHash: txHash,
              blockNumber: requestRedeemReceipt.blockNumber?.toString(),
              timestamp: new Date(),
            }),
          })

          if (!response.ok) {
            const error = await response.json()
            console.error('Failed to log redeem request:', error)
            toast.error('Redeem request submitted but failed to log in database')
            // Reset ref on error so we can retry if needed
            redeemLoggedRef.current = null
            setIsRedeeming(false)
          } else {
            console.log('Redeem request logged successfully')
            // Refetch positions to update UI with new values (reduced shares, etc.)
            if (fetchPositions.current) {
              await fetchPositions.current()
            }
            // Mark as complete - transaction + API both done
            setIsRedeemComplete(true)
            setIsRedeeming(false)
          }
        } catch (error) {
          console.error('Error logging redeem request:', error)
          toast.error('Redeem request submitted but failed to log in database')
          // Reset ref on error so we can retry if needed
          redeemLoggedRef.current = null
          setIsRedeeming(false)
        }
      }

      // Don't close modal or clear input - keep it open until API completes
      setIsRedeeming(true) // Keep loading state
      
      // Log redeem to API
      logRedeem()
    }
  }, [isRequestRedeemSuccess, requestRedeemReceipt, address, selectedHolding, sharesToRedeem, previewRedeemResult, publicClient])

  const handleRedeemClick = (holding: Holding) => {
    setSelectedHolding(holding)
    setSharesInput("")
    setRedeemModalOpen(true)
    setIsRedeemComplete(false) // Reset completion state
  }

  const handleCloseRedeemModal = () => {
    setRedeemModalOpen(false)
    setSharesInput("")
    setIsRedeemComplete(false)
    setIsRedeeming(false)
    setIsApproving(false)
    redeemLoggedRef.current = null
  }

  const handleApprove = () => {
    if (!selectedHolding || !sharesToRedeem || !address) return
    setIsApproving(true)
    // Approve the vault address (shares token) for the exact amount of shares to redeem
    writeApprove(
      {
        address: selectedHolding.vaultAddress as `0x${string}`, // Vault address is the token address
        abi: ERC20_ABI,
        functionName: "approve",
        args: [selectedHolding.vaultAddress as `0x${string}`, sharesToRedeem], // Approve exact amount
      },
      {
        onError: (error) => {
          toast.error(`Approval failed: ${error.message}`)
          setIsApproving(false)
        },
      }
    )
  }

  const handleRedeem = () => {
    if (!selectedHolding || !sharesToRedeem || !address) return
    setIsRedeeming(true)
    
    // Reset the logged ref when starting a new redeem
    redeemLoggedRef.current = null
    
    writeRedeem(
      {
        address: selectedHolding.vaultAddress as `0x${string}`,
        abi: CONTRACTS.AssetVault.abi,
        functionName: "redeem",
        args: [sharesToRedeem, address, address],
      },
      {
        onError: (error) => {
          toast.error(`Redeem failed: ${error.message}`)
          setIsRedeeming(false)
          // Reset ref on error
          redeemLoggedRef.current = null
        },
      }
    )
  }

  const handleRequestRedeem = () => {
    if (!selectedHolding || !sharesToRedeem || !address) return
    setIsRedeeming(true)
    
    // Reset the logged ref when starting a new request redeem
    redeemLoggedRef.current = null
    
    writeRequestRedeem(
      {
        address: selectedHolding.vaultAddress as `0x${string}`,
        abi: CONTRACTS.AssetVault.abi,
        functionName: "requestRedeem",
        args: [sharesToRedeem, address, address],
      },
      {
        onError: (error) => {
          toast.error(`Request redeem failed: ${error.message}`)
          setIsRedeeming(false)
          // Reset ref on error
          redeemLoggedRef.current = null
        },
      }
    )
  }

  const needsApproval = useMemo(() => {
    if (!allowance || !sharesToRedeem) return false
    return allowance < sharesToRedeem
  }, [allowance, sharesToRedeem])

  const formatNumber = (value: number) => {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const isLoading = vaultsLoading || isLoadingPositions || priceLoading

  if (!isConnected || !address) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Portfolio</h1>
          <p className="text-muted-foreground">Connect your wallet to view your portfolio</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Portfolio</h1>
        <p className="text-muted-foreground">View your portfolio performance and trading history</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Current Value</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(portfolioMetrics.portfolioValue)}
              </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Total Returns</p>
              <p className={`text-2xl font-bold ${portfolioMetrics.totalReturns >= 0 ? "text-green-500" : "text-red-500"}`}>
                {portfolioMetrics.totalReturns >= 0 ? "+" : ""}
                {formatCurrency(portfolioMetrics.totalReturns)} ({portfolioMetrics.totalReturnsPercent >= 0 ? "+" : ""}
                {portfolioMetrics.totalReturnsPercent.toFixed(2)}%)
              </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Invested</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(portfolioMetrics.invested)}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-6 mb-4 border-b border-border">
          <button
            onClick={() => setActiveTab("holdings")}
            className={`pb-3 px-2 text-sm font-medium border-b-2 transition ${
              activeTab === "holdings"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Holdings
          </button>
          <button
            onClick={() => setActiveTab("all-orders")}
            className={`pb-3 px-2 text-sm font-medium border-b-2 transition ${
              activeTab === "all-orders"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setActiveTab("redeemed")}
            className={`pb-3 px-2 text-sm font-medium border-b-2 transition ${
              activeTab === "redeemed"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Redeemed Orders
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === "holdings" && (
                <>
                  {holdings.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No holdings found. Start investing to see your portfolio here.</p>
                    </div>
                  ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-base py-4">Name</TableHead>
                  <TableHead className="font-semibold text-base py-4">Invested Amount</TableHead>
                  <TableHead className="font-semibold text-base py-4">Current Amount</TableHead>
                  <TableHead className="font-semibold text-base py-4">Rate of Return</TableHead>
                  <TableHead className="font-semibold text-base py-4">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.map((holding) => (
                          <TableRow key={holding.vaultAddress} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-base py-4">{holding.name}</TableCell>
                            <TableCell className="text-base py-4">{formatCurrency(holding.investedAmount)}</TableCell>
                            <TableCell className="text-base py-4">{formatCurrency(holding.currentAmount)}</TableCell>
                            <TableCell
                              className={`font-semibold text-base py-4 ${
                                holding.rateOfReturn >= 0 ? "text-green-500" : "text-red-500"
                              }`}
                            >
                              {holding.rateOfReturn >= 0 ? "+" : ""}
                              {holding.rateOfReturn.toFixed(2)}%
                            </TableCell>
                            <TableCell className="text-base py-4">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRedeemClick(holding)}
                              >
                                Redeem
                              </Button>
                            </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
                  )}
                </>
          )}

          {activeTab === "all-orders" && (
                <>
                  {allOrders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No orders found. Your deposit and redeem transactions will appear here.</p>
                    </div>
                  ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-base py-4">Fund</TableHead>
                  <TableHead className="font-semibold text-base py-4">Type</TableHead>
                  <TableHead className="font-semibold text-base py-4">Amount</TableHead>
                          <TableHead className="font-semibold text-base py-4">Shares</TableHead>
                  <TableHead className="font-semibold text-base py-4">Price</TableHead>
                  <TableHead className="font-semibold text-base py-4">Date</TableHead>
                  <TableHead className="font-semibold text-base py-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-base py-4">{order.fund}</TableCell>
                    <TableCell className="text-base py-4">
                      <span className={`font-semibold ${order.type === "Buy" ? "text-green-500" : "text-red-500"}`}>
                        {order.type}
                      </span>
                    </TableCell>
                            <TableCell className="text-base py-4">{formatCurrency(order.amount)}</TableCell>
                            <TableCell className="text-base py-4">{formatNumber(order.shares)}</TableCell>
                            <TableCell className="text-base py-4">${formatNumber(order.price)}</TableCell>
                    <TableCell className="text-base py-4">{order.date}</TableCell>
                    <TableCell className="text-base py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === "Completed" 
                          ? "bg-green-500/10 text-green-500" 
                          : "bg-yellow-500/10 text-yellow-500"
                      }`}>
                        {order.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
                  )}
                </>
          )}

          {activeTab === "redeemed" && (
                <>
                  {redeemedOrders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No redeemed orders found. Redeemed transactions will appear here.</p>
                    </div>
                  ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-base py-4">Fund</TableHead>
                  <TableHead className="font-semibold text-base py-4">Type</TableHead>
                  <TableHead className="font-semibold text-base py-4">Amount</TableHead>
                          <TableHead className="font-semibold text-base py-4">Shares</TableHead>
                  <TableHead className="font-semibold text-base py-4">Price</TableHead>
                  <TableHead className="font-semibold text-base py-4">Date</TableHead>
                  <TableHead className="font-semibold text-base py-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redeemedOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-base py-4">{order.fund}</TableCell>
                    <TableCell className="text-base py-4">
                      <span className={`font-semibold ${order.type === "Buy" ? "text-green-500" : "text-red-500"}`}>
                        {order.type}
                      </span>
                    </TableCell>
                            <TableCell className="text-base py-4">{formatCurrency(order.amount)}</TableCell>
                            <TableCell className="text-base py-4">{formatNumber(order.shares)}</TableCell>
                            <TableCell className="text-base py-4">${formatNumber(order.price)}</TableCell>
                    <TableCell className="text-base py-4">{order.date}</TableCell>
                    <TableCell className="text-base py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === "Completed" 
                          ? "bg-green-500/10 text-green-500" 
                          : "bg-yellow-500/10 text-yellow-500"
                      }`}>
                        {order.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
                  )}
                </>
          )}
        </div>
      </Card>

      {/* Redeem Modal */}
      <Dialog open={redeemModalOpen} onOpenChange={(open) => {
        // Prevent closing during transaction/API call
        if (!open && (isRedeeming || isApproving || isRedeemingTx || isApprovingTx || isRequestRedeemingTx)) {
          return
        }
        if (!open) {
          handleCloseRedeemModal()
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          {isRedeemComplete ? (
            // Success State
            <div>
              <DialogHeader>
                <DialogTitle>Redeem Successful</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
                <p className="text-lg font-semibold text-green-500">Redeem Successful</p>
                {selectedHolding && previewRedeemResult && sharesToRedeem ? (
                  <p className="text-sm text-muted-foreground text-center">
                    You have successfully redeemed {formatNumber(Number(formatUnits(sharesToRedeem, 18)))} shares
                    <br />
                    and received {formatCurrency(Number(formatUnits(previewRedeemResult as bigint, 18)))} USDC
                  </p>
                ) : null}
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCloseRedeemModal}
                  className="w-full"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          ) : (
            // Normal State
            <>
              <DialogHeader>
                <DialogTitle>Redeem Shares</DialogTitle>
                <DialogDescription>
                  Enter the number of shares to redeem and preview the USDC amount you will receive.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {selectedHolding && (
                  <>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Vault Name</label>
                      <p className="text-sm text-muted-foreground">{selectedHolding.name}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Number of Shares</label>
                      <Input
                        type="number"
                        placeholder="Enter shares to redeem"
                        value={sharesInput}
                        onChange={(e) => setSharesInput(e.target.value)}
                        disabled={isApproving || isRedeeming || isApprovingTx || isRedeemingTx || isRequestRedeemingTx}
                      />
                      <p className="text-xs text-muted-foreground">
                        Available shares: {formatNumber(selectedHolding.shares)}
                      </p>
                    </div>
                    {sharesInput && parseFloat(sharesInput) > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-medium">USDC You Will Receive</label>
                          {isLoadingPreviewRedeem ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              <span className="text-sm text-muted-foreground">Loading...</span>
                            </div>
                          ) : previewRedeemResult ? (
                            <p className="text-lg font-semibold text-primary">
                              {formatCurrency(Number(formatUnits(previewRedeemResult as bigint, 18)))}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">No preview available</p>
                          )}
                        </div>
                      </div>
                    )}
                    {!hasEnoughBalance && previewRedeemResult && (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-sm text-yellow-600 font-medium">
                          ⚠️ No Reserve USDC Funds
                        </p>
                        <p className="text-xs text-yellow-600/80 mt-1">
                          The vault does not have enough USDC reserves. A redeem request will be submitted, asking the manager to liquidate positions.
                        </p>
                      </div>
                    )}
                    {(isRedeemingTx || isRequestRedeemingTx) && (
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          <p className="text-sm text-blue-600 font-medium">
                            Transaction in progress... Please wait.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                {needsApproval ? (
                  <Button
                    onClick={handleApprove}
                    disabled={isApproving || isApprovingTx || !sharesInput || parseFloat(sharesInput) <= 0}
                    className="w-full sm:w-auto"
                  >
                    {(isApproving || isApprovingTx) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {isApproving || isApprovingTx ? "Approving..." : "Approve Shares"}
                  </Button>
                ) : (
                  <>
                    {hasEnoughBalance ? (
                      <Button
                        onClick={handleRedeem}
                        disabled={isRedeeming || isRedeemingTx || !sharesInput || parseFloat(sharesInput) <= 0}
                        variant="destructive"
                        className="w-full sm:w-auto"
                      >
                        {(isRedeeming || isRedeemingTx) && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        {isRedeeming || isRedeemingTx ? "Redeeming..." : "Redeem"}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleRequestRedeem}
                        disabled={isRedeeming || isRequestRedeemingTx || !sharesInput || parseFloat(sharesInput) <= 0}
                        variant="destructive"
                        className="w-full sm:w-auto"
                      >
                        {(isRedeeming || isRequestRedeemingTx) && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        {isRedeeming || isRequestRedeemingTx ? "Submitting Request..." : "Request Redeem"}
                      </Button>
                    )}
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={handleCloseRedeemModal}
                  disabled={isApproving || isRedeeming || isApprovingTx || isRedeemingTx || isRequestRedeemingTx}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>        </>
      )}
    </div>
  )
}

