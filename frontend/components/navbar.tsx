"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import { useAccount, useDisconnect } from "wagmi"
import { useRouter } from "next/navigation"
import { User, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Navbar() {
  const { openConnectModal } = useConnectModal()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const router = useRouter()

  const formatAddress = (addr: string | undefined) => {
    if (!addr) return ""
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const handleGetStarted = () => {
    router.push("/app")
  }

  const handleSignIn = () => {
    openConnectModal?.()
  }

  const handleSignOut = () => {
    disconnect()
  }
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold hover:opacity-80 transition"
            >
              <Image
                src="/logo.png"
                alt="Clearpool Finance"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span style={{ color: '#5E9871' }}>Clearpool</span>
            </Link>
            <div className="hidden md:flex gap-8 text-sm font-medium">
              <Link href="#how-it-works" className="text-foreground hover:text-primary transition duration-200">
                How It Works
              </Link>
              <Link href="#features" className="text-foreground hover:text-primary transition duration-200">
                Features
              </Link>
              <Link href="#faq" className="text-foreground hover:text-primary transition duration-200">
                FAQ
              </Link>
            </div>
          </div>
          <div className="flex gap-4">
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
                  <DropdownMenuItem onClick={() => router.push("/app/profile")}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleSignIn}
                  className="border-border hover:bg-primary/10 bg-transparent"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={handleGetStarted}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
