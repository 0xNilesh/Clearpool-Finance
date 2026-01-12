"use client"

import AdminNavbar from "@/components/admin-navbar"
import VaultOverview from "@/components/vault-overview"
import VaultManagement from "@/components/vault-management"

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Vault Management</h1>
          <p className="text-muted-foreground mt-2">Monitor and manage all vaults</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <VaultManagement />
          </div>
          <aside>
            <VaultOverview />
          </aside>
        </div>
      </main>
    </div>
  )
}


