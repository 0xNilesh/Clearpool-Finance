import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-40">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/3">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,200,83,0.03)_25%,rgba(0,200,83,0.03)_50%,transparent_50%,transparent_75%,rgba(0,200,83,0.03)_75%)] bg-[length:40px_40px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center gap-8 max-w-3xl mx-auto">
          <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-sm">
            <span className="text-sm font-semibold text-primary flex items-center gap-2">
              ✨ Decentralized Investing Platform
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-[1.1] text-balance">
            Invest in Institutional-Grade Strategies
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed text-balance">
            Access professional investment vaults, managed by experts, on a fully transparent decentralized platform.
            Start your wealth-building journey today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-base font-semibold group"
            >
              Explore Vaults
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="text-base font-semibold border-border bg-transparent">
              Learn More
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>$500M+ AUM</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>50,000+ Users</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>Audited Smart Contracts</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
