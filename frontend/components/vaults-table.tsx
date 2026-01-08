"use client"

import { useState } from "react"
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
import { Filter, X } from "lucide-react"

interface Vault {
  id: number
  name: string
  category: string
  rating: number
  oneYearReturn: string
  allTimeReturn: string
  aum: string
  traderExperience: number
}

const vaults: Vault[] = [
  { id: 1, name: "Tech Growth Fund", category: "Equity", rating: 4.5, oneYearReturn: "+18.5%", allTimeReturn: "+45.2%", aum: "$4.2M", traderExperience: 8 },
  { id: 2, name: "Dividend Income", category: "Income", rating: 4.2, oneYearReturn: "+8.2%", allTimeReturn: "+32.1%", aum: "$3.8M", traderExperience: 12 },
  { id: 3, name: "Crypto Emerging", category: "Crypto", rating: 4.8, oneYearReturn: "+45.3%", allTimeReturn: "+120.5%", aum: "$2.1M", traderExperience: 5 },
  { id: 4, name: "Bond Portfolio", category: "Fixed Income", rating: 3.9, oneYearReturn: "+2.1%", allTimeReturn: "+8.5%", aum: "$1.9M", traderExperience: 15 },
  { id: 5, name: "Small Cap Value", category: "Equity", rating: 4.6, oneYearReturn: "+22.3%", allTimeReturn: "+58.7%", aum: "$5.1M", traderExperience: 10 },
  { id: 6, name: "Real Estate Trust", category: "REIT", rating: 4.1, oneYearReturn: "+12.4%", allTimeReturn: "+28.9%", aum: "$3.2M", traderExperience: 7 },
  { id: 7, name: "Commodity Futures", category: "Commodities", rating: 4.3, oneYearReturn: "+15.7%", allTimeReturn: "+42.3%", aum: "$2.8M", traderExperience: 9 },
  { id: 8, name: "International Equity", category: "Equity", rating: 4.4, oneYearReturn: "+19.2%", allTimeReturn: "+51.6%", aum: "$4.5M", traderExperience: 11 },
  { id: 9, name: "Balanced Growth", category: "Balanced", rating: 4.0, oneYearReturn: "+10.5%", allTimeReturn: "+35.2%", aum: "$6.2M", traderExperience: 14 },
  { id: 10, name: "High Yield Bonds", category: "Fixed Income", rating: 3.8, oneYearReturn: "+5.3%", allTimeReturn: "+18.7%", aum: "$2.5M", traderExperience: 13 },
  { id: 11, name: "Emerging Markets", category: "Equity", rating: 4.7, oneYearReturn: "+28.9%", allTimeReturn: "+67.4%", aum: "$3.9M", traderExperience: 6 },
  { id: 12, name: "Healthcare Sector", category: "Sector", rating: 4.5, oneYearReturn: "+16.8%", allTimeReturn: "+48.3%", aum: "$4.8M", traderExperience: 8 },
  { id: 13, name: "Energy Sector", category: "Sector", rating: 4.2, oneYearReturn: "+14.2%", allTimeReturn: "+39.6%", aum: "$3.4M", traderExperience: 7 },
  { id: 14, name: "Technology Sector", category: "Sector", rating: 4.9, oneYearReturn: "+35.7%", allTimeReturn: "+89.2%", aum: "$7.1M", traderExperience: 9 },
  { id: 15, name: "Global Diversified", category: "Multi-Asset", rating: 4.3, oneYearReturn: "+13.6%", allTimeReturn: "+41.8%", aum: "$5.5M", traderExperience: 12 },
]

export default function VaultsTable() {
  const router = useRouter()
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    aum: "",
    traderExperience: "",
  })

  const filteredVaults = vaults.filter((vault) => {
    if (filters.aum && !vault.aum.toLowerCase().includes(filters.aum.toLowerCase())) {
      return false
    }
    if (filters.traderExperience && vault.traderExperience < parseInt(filters.traderExperience)) {
      return false
    }
    return true
  })

  const clearFilters = () => {
    setFilters({ aum: "", traderExperience: "" })
  }

  const handleRowClick = (vaultId: number) => {
    // Navigate to fund details page
    router.push(`/app/fund/${vaultId}`)
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
                AUM
              </label>
              <Input
                placeholder="Filter by AUM"
                value={filters.aum}
                onChange={(e) => setFilters({ ...filters, aum: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Trader Experience (Years)
              </label>
              <Input
                type="number"
                placeholder="Min years of experience"
                value={filters.traderExperience}
                onChange={(e) => setFilters({ ...filters, traderExperience: e.target.value })}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold text-base py-4">Name</TableHead>
              <TableHead className="font-semibold text-base py-4">Category</TableHead>
              <TableHead className="font-semibold text-base py-4">Rating</TableHead>
              <TableHead className="font-semibold text-base py-4">1 Yr Return</TableHead>
              <TableHead className="font-semibold text-base py-4">All Time Returns</TableHead>
              <TableHead className="font-semibold text-base py-4">AUM</TableHead>
              <TableHead className="font-semibold text-base py-4">Trader Experience</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVaults.map((vault) => (
              <TableRow 
                key={vault.id} 
                className="hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleRowClick(vault.id)}
              >
                <TableCell className="font-medium text-base py-4">{vault.name}</TableCell>
                <TableCell className="text-base py-4">{vault.category}</TableCell>
                <TableCell className="text-base py-4">
                  <div className="flex items-center gap-1">
                    <span>{vault.rating}</span>
                    <span className="text-muted-foreground">/5.0</span>
                  </div>
                </TableCell>
                <TableCell className="text-primary font-semibold text-base py-4">{vault.oneYearReturn}</TableCell>
                <TableCell className="text-primary font-semibold text-base py-4">{vault.allTimeReturn}</TableCell>
                <TableCell className="text-base py-4">{vault.aum}</TableCell>
                <TableCell className="text-base py-4">{vault.traderExperience} years</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

