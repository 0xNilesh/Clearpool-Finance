"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface AnimatedGradientTextProps {
  children: React.ReactNode
  className?: string
}

export function AnimatedGradientText({
  children,
  className,
}: AnimatedGradientTextProps) {
  return (
    <span
      className={cn(
        "relative inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary animate-gradient",
        className
      )}
      style={{
        backgroundImage: "linear-gradient(90deg, #5E9871, #4A7C5F, #6BA87D, #5E9871)",
        backgroundSize: "200% 100%",
      }}
    >
      {children}
    </span>
  )
}

