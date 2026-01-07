"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Search, Bell, User } from "lucide-react"

interface AppNavbarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function AppNavbar({ activeTab, setActiveTab }: AppNavbarProps) {
  const tabs = [
    { id: "explore", label: "Explore" },
    { id: "dashboard", label: "Dashboard" },
    { id: "sips", label: "SIPs" },
    { id: "watchlist", label: "Watchlist" },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4 gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <Image
              src="/logo.png"
              alt="Clearpool Finance"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
          </Link>

          <div className="hidden md:flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-sm font-medium pb-2 border-b-2 transition ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <div className="hidden sm:flex relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 rounded-lg bg-card text-foreground placeholder-muted-foreground border border-border text-sm"
              />
            </div>
            <Button size="icon" variant="ghost">
              <Bell className="w-5 h-5" />
            </Button>
            <Button size="icon" variant="ghost">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
