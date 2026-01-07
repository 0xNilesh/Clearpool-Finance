"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface AnimatedListProps {
  children: React.ReactNode
  className?: string
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className="animate-in fade-in slide-in-from-right-5 duration-300"
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

