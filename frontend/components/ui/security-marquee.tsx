"use client"

import { Shield, Lock, CheckCircle2, FileCheck, BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import Marquee from "@/components/ui/marquee"

interface SecurityBadge {
  icon: React.ElementType
  title: string
  description: string
}

const securityBadges: SecurityBadge[] = [
  {
    icon: Shield,
    title: "Smart Contract Audit",
    description: "Verified by leading security firms",
  },
  {
    icon: Lock,
    title: "Multi-Sig Wallets",
    description: "Enterprise-grade security",
  },
  {
    icon: CheckCircle2,
    title: "Insurance Coverage",
    description: "Protected up to $100M",
  },
  {
    icon: FileCheck,
    title: "SOC 2 Certified",
    description: "Compliance verified",
  },
  {
    icon: BadgeCheck,
    title: "Penetration Tested",
    description: "Regular security assessments",
  },
]

const SecurityCard = ({ icon: Icon, title, description }: SecurityBadge) => {
  return (
    <figure
      className={cn(
        "relative h-fit w-full cursor-pointer overflow-hidden rounded-xl border p-3 mb-2",
        // light styles
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        // dark styles
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
        "transform-gpu blur-[1px] transition-all duration-300 ease-out hover:blur-none"
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <Icon className="h-6 w-6 text-primary flex-shrink-0" />
        <div className="flex flex-col">
          <figcaption className="text-xs font-medium dark:text-white">
            {title}
          </figcaption>
          <p className="text-[10px] font-medium dark:text-white/40">{description}</p>
        </div>
      </div>
    </figure>
  )
}

const firstColumn = securityBadges.slice(0, Math.ceil(securityBadges.length / 2))
const secondColumn = securityBadges.slice(Math.ceil(securityBadges.length / 2))

interface SecurityMarqueeProps {
  className?: string
}

export default function SecurityMarquee({ className }: SecurityMarqueeProps) {
  return (
    <div className={cn("relative flex h-[300px] w-full flex-row items-center justify-center gap-4 overflow-hidden", className)}>
      <div className="flex-1 h-full overflow-hidden">
        <Marquee pauseOnHover vertical className="[--duration:20s] h-full">
          {firstColumn.map((badge) => (
            <SecurityCard key={badge.title} {...badge} />
          ))}
        </Marquee>
      </div>
      <div className="flex-1 h-full overflow-hidden">
        <Marquee reverse pauseOnHover vertical className="[--duration:20s] h-full">
          {secondColumn.map((badge) => (
            <SecurityCard key={badge.title} {...badge} />
          ))}
        </Marquee>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-background"></div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background"></div>
    </div>
  )
}

