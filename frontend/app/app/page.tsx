"use client"

import AppNavbar from "@/components/app-navbar"
import AppBanner from "@/components/app-banner"
import VaultsTable from "@/components/vaults-table"

export default function AppDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AppBanner />
        <VaultsTable />
      </main>
    </div>
  )
}
