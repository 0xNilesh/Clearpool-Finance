"use client"

import AppNavbar from "@/components/app-navbar"
import Portfolio from "@/components/portfolio"

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Portfolio />
      </main>
    </div>
  )
}

