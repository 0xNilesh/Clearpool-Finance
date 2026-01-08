"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Holding {
  id: number
  name: string
  investedAmount: string
  currentAmount: string
  rateOfReturn: string
}

interface Order {
  id: number
  fund: string
  type: "Buy" | "Sell"
  amount: string
  price: string
  date: string
  status: "Completed" | "Pending"
}

const holdings: Holding[] = [
  { id: 1, name: "Tech Growth Fund", investedAmount: "$5,000", currentAmount: "$5,925", rateOfReturn: "+18.5%" },
  { id: 2, name: "Dividend Income", investedAmount: "$3,000", currentAmount: "$3,246", rateOfReturn: "+8.2%" },
  { id: 3, name: "Crypto Emerging", investedAmount: "$2,500", currentAmount: "$3,632", rateOfReturn: "+45.3%" },
  { id: 4, name: "Small Cap Value", investedAmount: "$4,000", currentAmount: "$4,892", rateOfReturn: "+22.3%" },
]

const allOrders: Order[] = [
  { id: 1, fund: "Tech Growth Fund", type: "Buy", amount: "$5,000", price: "$1.25", date: "2024-01-15", status: "Completed" },
  { id: 2, fund: "Dividend Income", type: "Buy", amount: "$3,000", price: "$0.95", date: "2024-01-20", status: "Completed" },
  { id: 3, fund: "Crypto Emerging", type: "Buy", amount: "$2,500", price: "$2.10", date: "2024-02-01", status: "Completed" },
  { id: 4, fund: "Tech Growth Fund", type: "Sell", amount: "$1,000", price: "$1.35", date: "2024-02-10", status: "Completed" },
  { id: 5, fund: "Small Cap Value", type: "Buy", amount: "$4,000", price: "$1.15", date: "2024-02-15", status: "Pending" },
]

const redeemedOrders: Order[] = [
  { id: 4, fund: "Tech Growth Fund", type: "Sell", amount: "$1,000", price: "$1.35", date: "2024-02-10", status: "Completed" },
]

export default function Portfolio() {
  const [activeTab, setActiveTab] = useState("holdings")
  const portfolioValue = "$12,46,226"
  const totalReturns = "+37,588 (3.11%)"
  const invested = "$12,08,638"
  const xirr = "5.91%"

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Portfolio</h1>
        <p className="text-muted-foreground">View your portfolio performance and trading history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Current Value</p>
          <p className="text-2xl font-bold text-foreground">{portfolioValue}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Total Returns</p>
          <p className="text-2xl font-bold text-green-500">{totalReturns}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">Invested</p>
          <p className="text-2xl font-bold text-foreground">{invested}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-2">XIRR</p>
          <p className="text-2xl font-bold text-foreground">{xirr}</p>
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
                  <TableRow key={holding.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-base py-4">{holding.name}</TableCell>
                    <TableCell className="text-base py-4">{holding.investedAmount}</TableCell>
                    <TableCell className="text-base py-4">{holding.currentAmount}</TableCell>
                    <TableCell className="text-primary font-semibold text-base py-4">{holding.rateOfReturn}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {activeTab === "all-orders" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-base py-4">Fund</TableHead>
                  <TableHead className="font-semibold text-base py-4">Type</TableHead>
                  <TableHead className="font-semibold text-base py-4">Amount</TableHead>
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
                    <TableCell className="text-base py-4">{order.amount}</TableCell>
                    <TableCell className="text-base py-4">{order.price}</TableCell>
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

          {activeTab === "redeemed" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-base py-4">Fund</TableHead>
                  <TableHead className="font-semibold text-base py-4">Type</TableHead>
                  <TableHead className="font-semibold text-base py-4">Amount</TableHead>
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
                    <TableCell className="text-base py-4">{order.amount}</TableCell>
                    <TableCell className="text-base py-4">{order.price}</TableCell>
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
        </div>
      </Card>
    </div>
  )
}

