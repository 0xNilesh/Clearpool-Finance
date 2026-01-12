"use client"

import Image from "next/image"
import { TrendingUp, Users, BarChart3, Shield, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function AppBanner() {
  const stats = [
    { icon: TrendingUp, label: "Total AUM", value: "$950K" },
    { icon: Users, label: "Active Funds", value: "15+" },
    { icon: BarChart3, label: "Avg Returns", value: "+18.5%" },
    { icon: Shield, label: "Secure Platform", value: "100%" },
  ]

  return (
    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-primary/20 via-primary/10 to-transparent mb-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative p-8 md:p-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left Section - Logo and Title */}
          <div className="flex items-center gap-4 flex-1">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
              <div className="relative bg-background/80 backdrop-blur-sm p-3 rounded-2xl border border-primary/20 shadow-lg">
                <Image
                  src="/logo.png"
                  alt="Clearpool Finance"
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Explore Investment
                <span className="block text-primary mt-1">Opportunities</span>
              </h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-md">
                Discover top-performing funds managed by verified experts with transparent, real-time performance tracking.
              </p>
            </div>
          </div>

          {/* Right Section - Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div
                  key={index}
                  className="bg-background/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <Icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-2xl font-bold text-primary transition-colors">
                        {stat.value}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        {stat.label}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>
    </Card>
  )
}
