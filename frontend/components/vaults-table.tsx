"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Filter, X, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from "lucide-react"
import { useAllVaults } from "@/hooks/use-vaults"

interface Vault {
  address: string
  name: string
  symbol: string
  aum: string
  perf: string
  issuedShares: string
}

type SortColumn = "rating" | "oneYearReturn" | "allTimeReturn" | "aum" | "traderExperience" | null
type SortDirection = "asc" | "desc" | null

export default function VaultsTable() {
  const router = useRouter()
  const { vaults, isLoading } = useAllVaults()
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    name: "",
    aum: "",
  })
  const [sortColumn, setSortColumn] = useState<SortColumn>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  // Helper function to parse AUM for sorting
  const parseAUM = (value: string): number => {
    const numStr = value.replace(/[$,\s]/g, "").toLowerCase()
    if (numStr.endsWith("k")) {
      return parseFloat(numStr.slice(0, -1)) * 1000
    } else if (numStr.endsWith("m")) {
      return parseFloat(numStr.slice(0, -1)) * 1000000
    } else if (numStr.endsWith("b")) {
      return parseFloat(numStr.slice(0, -1)) * 1000000000
    }
    return parseFloat(numStr) || 0
  }

  // Helper function to parse percentage for sorting
  const parsePercentage = (value: string): number => {
    return parseFloat(value.replace(/[+%]/g, "")) || 0
  }

  const filteredVaults = useMemo(() => {
    return vaults.filter((vault) => {
      if (filters.name && !vault.name.toLowerCase().includes(filters.name.toLowerCase())) {
        return false
      }
    if (filters.aum && !vault.aum.toLowerCase().includes(filters.aum.toLowerCase())) {
      return false
    }
    return true
  })
  }, [vaults, filters])

  // Sort function
  const sortedVaults = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredVaults

    return [...filteredVaults].sort((a, b) => {
    let aValue: number
    let bValue: number

    switch (sortColumn) {
      case "rating":
          // Mock rating - could be calculated from performance
          aValue = 4.5
          bValue = 4.5
        break
      case "oneYearReturn":
          aValue = parsePercentage(a.perf)
          bValue = parsePercentage(b.perf)
        break
      case "allTimeReturn":
          aValue = parsePercentage(a.perf)
          bValue = parsePercentage(b.perf)
        break
      case "aum":
        aValue = parseAUM(a.aum)
        bValue = parseAUM(b.aum)
        break
      case "traderExperience":
          // Mock trader experience
          aValue = 8
          bValue = 8
        break
      default:
        return 0
    }

    if (sortDirection === "asc") {
      return aValue - bValue
    } else {
      return bValue - aValue
    }
  })
  }, [filteredVaults, sortColumn, sortDirection])

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortColumn(null)
        setSortDirection(null)
      }
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="w-4 h-4 text-primary" />
    }
    if (sortDirection === "desc") {
      return <ArrowDown className="w-4 h-4 text-primary" />
    }
    return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
  }

  const clearFilters = () => {
    setFilters({ name: "", aum: "" })
  }

  // Helper to get category (could be based on vault name or other logic)
  const getCategory = (vaultName: string): string => {
    const name = vaultName.toLowerCase()
    if (name.includes("crypto") || name.includes("btc") || name.includes("eth")) return "Crypto"
    if (name.includes("bond") || name.includes("fixed")) return "Fixed Income"
    if (name.includes("income") || name.includes("dividend")) return "Income"
    if (name.includes("growth")) return "Equity"
    return "Vault"
  }

  const handleRowClick = (vaultAddress: string) => {
    // Navigate to fund details page using vault address
    router.push(`/app/fund/${vaultAddress}`)
  }

  return (
    <Card className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-foreground">Funds</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {showFilters && (
        <div className="mb-6 p-4 border rounded-lg bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Additional Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Vault Name
              </label>
              <Input
                placeholder="Filter by name"
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                AUM
              </label>
              <Input
                placeholder="Filter by AUM"
                value={filters.aum}
                onChange={(e) => setFilters({ ...filters, aum: e.target.value })}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading vaults...</p>
        </div>
      ) : sortedVaults.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-lg">No vaults found</p>
        </div>
      ) : (

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold text-base py-4">Name</TableHead>
              <TableHead className="font-semibold text-base py-4">Category</TableHead>
              <TableHead className="font-semibold text-base py-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSort("rating")
                  }}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  Rating
                  {getSortIcon("rating")}
                </button>
              </TableHead>
              <TableHead className="font-semibold text-base py-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSort("oneYearReturn")
                  }}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  1 Yr Return
                  {getSortIcon("oneYearReturn")}
                </button>
              </TableHead>
              <TableHead className="font-semibold text-base py-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSort("allTimeReturn")
                  }}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  All Time Returns
                  {getSortIcon("allTimeReturn")}
                </button>
              </TableHead>
              <TableHead className="font-semibold text-base py-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSort("aum")
                  }}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  AUM
                  {getSortIcon("aum")}
                </button>
              </TableHead>
              <TableHead className="font-semibold text-base py-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSort("traderExperience")
                  }}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  Trader Experience
                  {getSortIcon("traderExperience")}
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedVaults.map((vault) => (
              <TableRow 
                  key={vault.address} 
                className="hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(vault.address)}
              >
                <TableCell className="font-medium text-base py-4">{vault.name}</TableCell>
                  <TableCell className="text-base py-4">{getCategory(vault.name)}</TableCell>
                <TableCell className="text-base py-4">
                  <div className="flex items-center gap-1">
                      <span>4.5</span>
                    <span className="text-muted-foreground">/5.0</span>
                  </div>
                </TableCell>
                  <TableCell className="text-primary font-semibold text-base py-4">{vault.perf}</TableCell>
                  <TableCell className="text-primary font-semibold text-base py-4">{vault.perf}</TableCell>
                <TableCell className="text-base py-4">{vault.aum}</TableCell>
                  <TableCell className="text-base py-4">8 years</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      )}
    </Card>
  )
}

