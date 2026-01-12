"use client"

import { useState, useEffect, useRef } from "react"
import { Steps } from "@/components/ui/steps"

const stepItems = [
    {
      title: "Browse Vaults",
    subTitle: "Explore options",
    content: "Explore curated investment vaults managed by verified professionals. Browse through our selection of professionally managed investment strategies and find the one that matches your goals.",
    },
    {
      title: "Deposit Funds",
    subTitle: "Secure deposit",
    content: "Securely deposit your assets with transparent fee structures. Our multi-signature wallet system ensures your funds are protected with bank-grade security.",
    },
    {
      title: "Earn Returns",
    subTitle: "Watch growth",
    content: "Watch your investments grow with professional management and strategies. Our expert managers use proven strategies to maximize your returns while managing risk.",
    },
    {
      title: "Withdraw Anytime",
    subTitle: "Instant access",
    content: "Maintain full control with instant withdrawal capabilities. No lock-in periods, no waiting times - withdraw your funds whenever you need them.",
    },
  ]

export default function HowItWorks() {
  const [current, setCurrent] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const onChange = (value: number) => {
    setCurrent(value)
    // Reset the auto-advance timer when user clicks
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    // Restart auto-advance from the clicked step
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => {
        const next = prev + 1
        // Reset to 0 after the last step (step 4, index 3)
        return next >= stepItems.length ? 0 : next
      })
    }, 3000)
  }

  useEffect(() => {
    // Start auto-advance on mount
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => {
        const next = prev + 1
        // Reset to 0 after the last step (step 4, index 3)
        return next >= stepItems.length ? 0 : next
      })
    }, 3000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <section id="how-it-works" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">How It Works</h2>
          <p className="text-lg text-muted-foreground">Simple steps to start investing</p>
        </div>

        <div className="max-w-5xl mx-auto">
          <Steps
            items={stepItems}
            current={current}
            onChange={onChange}
            type="navigation"
            size="default"
          />
        </div>
      </div>
    </section>
  )
}
