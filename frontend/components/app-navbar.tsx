"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Search, User, LogOut, Briefcase } from "lucide-react"
import { useAccount, useDisconnect } from "wagmi"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter, usePathname } from "next/navigation"

interface AppNavbarProps {
  activeTab?: string
  setActiveTab?: (tab: string) => void
}

export default function AppNavbar({ activeTab, setActiveTab }: AppNavbarProps) {
  const pathname = usePathname()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { openConnectModal } = useConnectModal()
  const router = useRouter()

  const formatAddress = (addr: string | undefined) => {
    if (!addr) return ""
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const handleSignOut = () => {
    disconnect()
  }
  const tabs = [
    { id: "explore", label: "Explore" },
    { id: "portfolio", label: "Portfolio" },
    { id: "documentation", label: "Documentation" },
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
            {tabs.map((tab) => {
              const isActive = pathname === "/app/portfolio" 
                ? tab.id === "portfolio"
                : pathname?.startsWith("/docs")
                ? tab.id === "documentation"
                : pathname === "/app" && tab.id === "explore"
              const href = tab.id === "portfolio" 
                ? "/app/portfolio" 
                : tab.id === "documentation"
                ? "/docs/intro"
                : "/app"
              return (
                <Link
                key={tab.id}
                  href={href}
                className={`text-sm font-medium pb-2 border-b-2 transition ${
                    isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <Link
              href="/app/claim"
              className="hidden sm:flex text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Claim Testnet funds
            </Link>
            <div className="hidden sm:flex relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 rounded-lg bg-card text-foreground placeholder-muted-foreground border border-border text-sm"
              />
            </div>
            {isConnected && address ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 border-border hover:bg-primary/10">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline-block font-mono text-sm">
                      {formatAddress(address)}
                    </span>
            </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => router.push("/app/portfolio")}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/manager")}>
                    <Briefcase className="w-4 h-4 mr-2" />
                    Manage Funds
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => openConnectModal?.()}
                className="border-border hover:bg-primary/10 bg-transparent"
              >
                Sign In
            </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
