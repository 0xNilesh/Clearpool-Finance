"use client"

import { Card } from "@/components/ui/card"
import { useAllVaults } from "@/hooks/use-vaults"
import { useMemo } from "react"
import { formatUnits } from "viem"

export default function VaultOverview() {
  const { vaults, isLoading, vaultCount } = useAllVaults()

  const totalAUM = useMemo(() => {
    if (!vaults || vaults.length === 0) return "$0.00M"
    const total = vaults.reduce((sum, vault) => {
      if (vault.totalAssets) {
        return sum + Number(formatUnits(vault.totalAssets, 18))
      }
      return sum
    }, 0)
    return `$${(total / 1e6).toFixed(2)}M`
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
            {isLoading ? "..." : vaultCount}
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
