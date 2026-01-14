"use client"

import { Card } from "@/components/ui/card"
import { useAllVaults } from "@/hooks/use-vaults"
import { useMemo } from "react"
import { formatUnits } from "viem"
import { useAccount } from "wagmi"

export default function VaultOverview() {
  const { address: connectedAddress } = useAccount()
  const { vaults: allVaults, isLoading, vaultCount } = useAllVaults()

  // Filter vaults to only show those created by the connected user
  const vaults = useMemo(() => {
    if (!connectedAddress || !allVaults) return []
    return allVaults.filter(vault => 
      vault.curator.toLowerCase() === connectedAddress.toLowerCase()
    )
  }, [allVaults, connectedAddress])

  const totalAUM = useMemo(() => {
    if (!vaults || vaults.length === 0) return "$0.00"
    
    // Calculate total AUM from all user's vaults
    const totalInUSDC = vaults.reduce((sum, vault) => {
      if (vault.totalAssets) {
        return sum + Number(formatUnits(vault.totalAssets, 18))
      }
      return sum
    }, 0)
    
    // Format based on size (same logic as formatAUM in other components)
    if (totalInUSDC >= 1_000_000) {
      // Show in millions (M)
      return `$${(totalInUSDC / 1_000_000).toFixed(2)}M`
    } else if (totalInUSDC >= 1_000) {
      // Show in thousands (K)
      return `$${(totalInUSDC / 1_000).toFixed(2)}K`
    } else {
      // Show as is
      return `$${totalInUSDC.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  }, [vaults])

  const avgPerformance = useMemo(() => {
    // Mock calculation - would need historical data for real performance
    if (!vaults || vaults.length === 0) return "+0.0%"
    return "+0.0%"
  }, [vaults])

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold text-foreground mb-6">Overview</h3>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Total AUM</p>
          <p className="text-3xl font-bold text-primary">
            {isLoading ? "..." : totalAUM}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Active Vaults</p>
          <p className="text-2xl font-bold text-foreground">
            {isLoading ? "..." : vaults.length}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Avg Performance</p>
          <p className="text-2xl font-bold text-green-500">
            {isLoading ? "..." : avgPerformance}
          </p>
        </div>
      </div>
    </Card>
  )
}
