"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import AppNavbar from "@/components/app-navbar"
import { useState } from "react"
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

// Mock fund data - in real app, fetch based on ID
const fundData = {
  id: 1,
  name: "Tech Growth Fund",
  category: "Equity",
  rating: 4.5,
  oneYearReturn: "+18.5%",
  allTimeReturn: "+45.2%",
  aum: "$4.2M",
  traderExperience: 8,
  description: "A high-growth equity fund focused on technology companies with strong fundamentals and innovative products.",
  minInvestment: "$100",
  fees: "2% management fee, 20% performance fee",
}

const similarFunds = [
  { id: 2, name: "Dividend Income", category: "Income", return: "+8.2%", aum: "$3.8M" },
  { id: 3, name: "Crypto Emerging", category: "Crypto", return: "+45.3%", aum: "$2.1M" },
  { id: 5, name: "Small Cap Value", category: "Equity", return: "+22.3%", aum: "$5.1M" },
  { id: 8, name: "International Equity", category: "Equity", return: "+19.2%", aum: "$4.5M" },
  { id: 12, name: "Healthcare Sector", category: "Sector", return: "+16.8%", aum: "$4.8M" },
]

// Mock fund token holdings
const fundTokens = [
  { token: "ETH", percentage: "35%", amount: "$1,470,000" },
  { token: "BTC", percentage: "25%", amount: "$1,050,000" },
  { token: "USDC", percentage: "20%", amount: "$840,000" },
  { token: "MATIC", percentage: "12%", amount: "$504,000" },
  { token: "LINK", percentage: "8%", amount: "$336,000" },
]

// Mock active proposals
const activeProposals = [
  { id: 1, type: "Rebalance", description: "Reduce ETH allocation to 30%, increase BTC to 30%", votes: 45, status: "Active" },
  { id: 2, type: "Rebalance", description: "Add UNI token at 5% allocation", votes: 32, status: "Active" },
]

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
  const [duration, setDuration] = useState("1Y")
  const [amount, setAmount] = useState("")

  const data = chartData[duration as keyof typeof chartData] || chartData["1Y"]
  const maxValue = Math.max(...data)
  const minValue = Math.min(...data)

  const handleProposeRebalance = () => {
    // TODO: Implement propose rebalance functionality
    console.log("Propose fund rebalance clicked")
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
            <h1 className="text-2xl font-bold text-foreground">{fundData.name}</h1>
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

            {/* Buy Section */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Invest in this Fund</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-foreground whitespace-nowrap">
                    Investment Amount
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 border-2 border-border"
                  />
                </div>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  Buy Now
                </Button>
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Token</TableHead>
                        <TableHead>Current Percentage</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fundTokens.map((holding, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{holding.token}</TableCell>
                          <TableCell>{holding.percentage}</TableCell>
                          <TableCell className="text-right">{holding.amount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                {similarFunds.map((fund) => (
                  <div
                    key={fund.id}
                    className="p-4 border rounded-lg hover:border-primary/50 transition cursor-pointer"
                    onClick={() => router.push(`/app/fund/${fund.id}`)}
                  >
                    <h3 className="font-semibold text-foreground mb-1">{fund.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{fund.category}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-semibold">{fund.return}</span>
                      <span className="text-xs text-muted-foreground">{fund.aum}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}

