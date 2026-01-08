"use client"

import { Terminal, TypingAnimation, AnimatedSpan } from "@/components/ui/terminal"
import { cn } from "@/lib/utils"

interface TransparencyTerminalProps {
  className?: string
}

export default function TransparencyTerminal({ className }: TransparencyTerminalProps) {
  return (
    <Terminal className={cn("absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-[280px] scale-75 border border-border bg-background/90 backdrop-blur-sm [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] transition-all duration-300 ease-out group-hover:scale-90", className)}>
      <TypingAnimation delay={0}>$ clearpool audit</TypingAnimation>
      <AnimatedSpan delay={800} className="text-green-500">
        ✓ Smart contracts verified
      </AnimatedSpan>
      <TypingAnimation delay={1600}>$ clearpool status</TypingAnimation>
      <AnimatedSpan delay={2400} className="text-blue-500">
        ✓ On-chain transparency: Active
      </AnimatedSpan>
      <TypingAnimation delay={3200}>$ clearpool report</TypingAnimation>
      <AnimatedSpan delay={4000} className="text-green-500">
        ✓ Real-time reporting enabled
      </AnimatedSpan>
      <TypingAnimation delay={4800}>$ clearpool verify</TypingAnimation>
      <AnimatedSpan delay={5600} className="text-blue-500">
        ✓ Audit trail: Complete
      </AnimatedSpan>
    </Terminal>
  )
}

