"use client"

import { cn } from "@/lib/utils"
import Marquee from "@/components/ui/marquee"
import { DollarSign, Users, Building2, UserCheck } from "lucide-react"
import { useAllVaults } from "@/hooks/use-vaults"
import { useMemo, useEffect, useState } from "react"
import { formatUnits } from "viem"

interface Metric {
  label: string
  value: string
  icon: React.ElementType
}

// Calculate dynamic user count (starts at 13, increases by 2 per day)
const getUserCount = (): number => {
  if (typeof window === 'undefined') return 13
  
  const STORAGE_KEY = 'clearpool_user_count'
  const STORAGE_DATE_KEY = 'clearpool_user_count_date'
  const BASE_COUNT = 13
  const DAILY_INCREASE = 2
  
  try {
    const storedDate = localStorage.getItem(STORAGE_DATE_KEY)
    const storedCount = localStorage.getItem(STORAGE_KEY)
    const today = new Date().toDateString()
    
    if (storedDate === today && storedCount) {
      // Same day, return stored count
      return parseInt(storedCount, 10)
    }
    
    // New day or first time
    let currentCount = BASE_COUNT
    if (storedDate && storedCount) {
      // Calculate days since last update
      const lastDate = new Date(storedDate)
      const todayDate = new Date(today)
      const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      currentCount = parseInt(storedCount, 10) + (daysDiff * DAILY_INCREASE)
    }
    
    // Store updated values
    localStorage.setItem(STORAGE_KEY, currentCount.toString())
    localStorage.setItem(STORAGE_DATE_KEY, today)
    
    return currentCount
  } catch {
    return BASE_COUNT
  }
}

const MetricCard = ({ label, value, icon: Icon }: Metric) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-primary/30 bg-background/80 backdrop-blur-sm px-6 py-4 min-w-[140px] mx-2 hover:border-primary/60 transition-colors">
      <Icon className="w-6 h-6 text-primary mb-2" />
      <div className="text-2xl font-bold text-primary mb-1">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</div>
    </div>
  )
}

export default function MetricsMarquee({ className }: { className?: string }) {
  const { vaults, isLoading } = useAllVaults()
  const [userCount, setUserCount] = useState(13)

  // Get user count on mount
  useEffect(() => {
    setUserCount(getUserCount())
  }, [])

  // Calculate total AUM from all vaults (same as explore page)
  const totalAUM = useMemo(() => {
    if (!vaults || vaults.length === 0) return "$0.00"
    const total = vaults.reduce((sum, vault) => {
      if (vault.totalAssets) {
        return sum + Number(formatUnits(vault.totalAssets, 18))
      }
      return sum
    }, 0)
    
    // Format based on size (same as explore page)
    if (total >= 1_000_000) {
      return `$${(total / 1_000_000).toFixed(2)}M`
    } else if (total >= 1_000) {
      return `$${(total / 1_000).toFixed(2)}K`
    } else {
      return `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  }, [vaults])

  // Count active funds
  const activeFunds = useMemo(() => {
    return vaults.length > 0 ? vaults.length : 0
  }, [vaults])

  // Count unique fund managers (curators)
  const fundManagers = useMemo(() => {
    if (!vaults || vaults.length === 0) return 0
    const uniqueCurators = new Set(vaults.map(v => v.curator.toLowerCase()))
    return uniqueCurators.size
  }, [vaults])

  const metrics: Metric[] = useMemo(() => [
    { label: "AUM", value: isLoading ? "..." : totalAUM, icon: DollarSign },
    { label: "Users", value: userCount.toString(), icon: Users },
    { label: "Funds", value: isLoading ? "..." : activeFunds.toString(), icon: Building2 },
    { label: "Fund Managers", value: isLoading ? "..." : fundManagers.toString(), icon: UserCheck },
  ], [totalAUM, userCount, activeFunds, fundManagers, isLoading])

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      <Marquee pauseOnHover className="[--duration:30s]">
        {metrics.map((metric, index) => (
          <MetricCard key={`${metric.label}-${index}`} {...metric} />
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent"></div>
    </div>
  )
}

