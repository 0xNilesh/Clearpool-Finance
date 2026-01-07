"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold text-primary hover:opacity-80 transition"
            >
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-foreground font-bold text-sm">
                C
              </div>
              Clearpool
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
            <Button variant="outline" asChild className="border-border hover:bg-primary/10 bg-transparent">
              <Link href="/app">Sign In</Link>
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
