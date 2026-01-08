"use client"

import { cn } from "@/lib/utils"
import Marquee from "@/components/ui/marquee"
import { DollarSign, Users, Building2, UserCheck } from "lucide-react"

interface Metric {
  label: string
  value: string
  icon: React.ElementType
}

const metrics: Metric[] = [
  { label: "AUM", value: "$950", icon: DollarSign },
  { label: "Users", value: "32", icon: Users },
  { label: "Funds", value: "8", icon: Building2 },
  { label: "Fund Managers", value: "5", icon: UserCheck },
]

const MetricCard = ({ label, value, icon: Icon }: Metric) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-primary/30 bg-background/80 backdrop-blur-sm px-6 py-4 min-w-[140px] mx-2 hover:border-primary/60 transition-colors">
      <Icon className="w-6 h-6 text-primary mb-2" />
      <div className="text-2xl font-bold text-primary mb-1">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</div>
    </div>
  )
}

export default function MetricsMarquee({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      <Marquee pauseOnHover className="[--duration:30s]">
        {metrics.map((metric, index) => (
          <MetricCard key={`${metric.label}-${index}`} {...metric} />
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent"></div>
    </div>
  )
}

