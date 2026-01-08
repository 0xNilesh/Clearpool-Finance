"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronRight } from "lucide-react"
import MetricsMarquee from "@/components/ui/metrics-marquee"
import { AuroraText } from "@/components/ui/aurora-text"
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text"
import { cn } from "@/lib/utils"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import { useAccount } from "wagmi"
import { useRouter } from "next/navigation"

export default function Hero() {
  const { openConnectModal } = useConnectModal()
  const { isConnected } = useAccount()
  const router = useRouter()

  const handleGetStarted = () => {
    router.push("/app")
  }

  return (
    <section className="relative overflow-hidden pt-32 pb-40">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/3">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,200,83,0.03)_25%,rgba(0,200,83,0.03)_50%,transparent_50%,transparent_75%,rgba(0,200,83,0.03)_75%)] bg-[length:40px_40px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center gap-8 max-w-3xl mx-auto">
          <div className="group relative mx-auto flex items-center justify-center rounded-full px-4 py-1.5 shadow-[inset_0_-8px_10px_rgba(94,152,113,0.1)] transition-shadow duration-500 ease-out hover:shadow-[inset_0_-5px_10px_rgba(94,152,113,0.2)]">
            <span
              className={cn(
                "animate-gradient absolute inset-0 block h-full w-full rounded-[inherit] bg-gradient-to-r from-primary/50 via-primary/30 to-primary/50 bg-[length:300%_100%] p-[1px]"
              )}
              style={{
                WebkitMask:
                  "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "destination-out",
                mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                maskComposite: "subtract",
                WebkitClipPath: "padding-box",
              }}
            />
            🎉 <hr className="mx-2 h-4 w-px shrink-0 bg-primary/50" />
            <AnimatedGradientText className="text-sm font-medium">
              Clearpool now live on Mantle Testnet
            </AnimatedGradientText>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-[1.1] text-balance">
            Investing, <AuroraText>Reinvented</AuroraText>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed text-balance">
            Access professional investment vaults, managed by experts, on a fully transparent decentralized platform.
            Start your wealth-building journey today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-base font-semibold group"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-base font-semibold border-border bg-transparent"
              onClick={() => router.push("/docs")}
            >
              Learn More
            </Button>
          </div>

          <div className="w-full pt-8">
            <MetricsMarquee />
          </div>
        </div>
      </div>
    </section>
  )
}

