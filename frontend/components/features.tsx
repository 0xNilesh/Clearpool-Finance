"use client"

import { Shield, TrendingUp, Lock, Zap, BarChart3 } from "lucide-react"
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid"
import { cn } from "@/lib/utils"
import AnimatedListDemo from "@/components/ui/animated-list-demo"
import SecurityMarquee from "@/components/ui/security-marquee"

export default function Features() {
  const features = [
    {
      Icon: Shield,
      name: "Safe & Secure",
      description: "Bank-grade security with smart contract audits and insurance coverage for your peace of mind.",
      cta: "Learn more",
      background: (
        <SecurityMarquee className={cn(
          "absolute top-10 right-0 w-full h-[1000px] [mask-image:linear-gradient(to_top,transparent_0%,transparent_60%,#000_80%,#000_100%)] [--duration:20s]"
        )} />
      ),
      className: "lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3",
    },
    {
      Icon: TrendingUp,
      name: "Expert Management",
      description: "Professional strategies managed by verified market experts with proven track records.",
      cta: "Learn more",
      background: <img className="absolute -top-20 -right-20 opacity-60" />,
      className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-2",
    },
    {
      Icon: Lock,
      name: "Transparent",
      description: "Full on-chain transparency with real-time reporting and complete audit trails.",
      cta: "Learn more",
      background: <img className="absolute -top-20 -right-20 opacity-60" />,
      className: "lg:col-start-1 lg:col-end-2 lg:row-start-2 lg:row-end-4",
    },
    {
      Icon: Zap,
      name: "Instant Withdrawal",
      description: "Withdraw your funds instantly with no lock-in periods or waiting times.",
      cta: "Learn more",
      background: (
        <AnimatedListDemo className={cn(
          "absolute top-4 right-2 h-[300px] w-full scale-75 border-none",
          "[mask-image:linear-gradient(to_top,transparent_10%,#000_100%)]",
          "transition-all duration-300 ease-out group-hover:scale-90"
        )} />
      ),
      className: "lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-3",
    },
    {
      Icon: BarChart3,
      name: "Advanced Analytics",
      description: "Comprehensive portfolio insights and performance tracking with detailed analytics dashboard.",
      cta: "Learn more",
      background: <img className="absolute -top-20 -right-20 opacity-60" />,
      className: "lg:col-start-3 lg:col-end-3 lg:row-start-3 lg:row-end-4",
    },
  ]

  return (
    <section id="features" className="py-24 bg-primary/3 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">Why Choose Clearpool</h2>
          <p className="text-lg text-muted-foreground">Cutting-edge features for modern investors</p>
        </div>

        <BentoGrid className="lg:grid-rows-3">
          {features.map((feature) => (
            <BentoCard key={feature.name} {...feature} />
          ))}
        </BentoGrid>
      </div>
    </section>
  )
}
