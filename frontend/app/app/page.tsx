"use client"

import { useState } from "react"
import AppNavbar from "@/components/app-navbar"
import PopularFunds from "@/components/popular-funds"
import YourInvestments from "@/components/your-investments"
import Collections from "@/components/collections"
import ProductsTools from "@/components/products-tools"

export default function AppDashboard() {
  const [activeTab, setActiveTab] = useState("explore")

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PopularFunds />
            <Collections />
          </div>
          <aside>
            <YourInvestments />
          </aside>
        </div>
        <ProductsTools />
      </main>
    </div>
  )
}
