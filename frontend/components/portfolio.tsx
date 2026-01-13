"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAccount } from "wagmi"
import { useAllVaults } from "@/hooks/use-vaults"
import { useReadContracts } from "wagmi"
import { CONTRACTS } from "@/lib/contracts"
import { formatUnits } from "viem"
import { Loader2 } from "lucide-react"

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
  const { vaults, isLoading: vaultsLoading } = useAllVaults()
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoadingPositions, setIsLoadingPositions] = useState(false)

  // Fetch positions from API
  useEffect(() => {
    if (!address || !isConnected) {
      setPositions([])
      return
    }

    const fetchPositions = async () => {
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

    fetchPositions()
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
    })
  }, [vaultAddresses, vaults])

  const { data: priceData, isLoading: priceLoading } = useReadContracts({
    contracts: priceContracts,
    query: {
      enabled: priceContracts.length > 0,
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
      xirr: "0.00%", // XIRR calculation would require more complex logic
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">XIRR</p>
              <p className="text-2xl font-bold text-foreground">{portfolioMetrics.xirr}</p>
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
        </>
      )}
    </div>
  )
}

