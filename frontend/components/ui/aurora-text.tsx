"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface AuroraTextProps {
  children: React.ReactNode
  className?: string
  colors?: string[]
  speed?: number
}

export function AuroraText({
  children,
  className = "",
  colors = ["#5E9871", "#4A7C5F", "#6BA87D", "#7BC28F", "#5E9871"],
  speed = 1,
}: AuroraTextProps) {
  const animationDuration = `${3 / speed}s`
  
  return (
    <span
      className={cn("relative inline-block", className)}
      style={{
        backgroundImage: `linear-gradient(90deg, ${colors.join(", ")})`,
        backgroundSize: "200% 100%",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        animation: `aurora-text ${animationDuration} linear infinite`,
      }}
    >
      {children}
    </span>
  )
}

