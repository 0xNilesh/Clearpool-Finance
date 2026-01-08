"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface StepItem {
  title: string
  subTitle?: string
  status?: "finish" | "process" | "wait" | "error"
  content?: React.ReactNode
  disabled?: boolean
}

interface StepsProps {
  items: StepItem[]
  current?: number
  onChange?: (value: number) => void
  type?: "default" | "navigation"
  size?: "default" | "small"
  className?: string
}

export function Steps({
  items,
  current = 0,
  onChange,
  type = "default",
  size = "default",
  className,
}: StepsProps) {
  const getStatus = (index: number): StepItem["status"] => {
    if (items[index].status) return items[index].status
    if (index < current) return "finish"
    if (index === current) return "process"
    return "wait"
  }

  if (type === "navigation") {
    return (
      <div className={cn("flex flex-col gap-8", className)}>
        {/* Horizontal Steps Navigation */}
        <div className="relative flex items-start pb-8">
          {/* Background connection line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted-foreground/20" />
          
          {/* Progress line */}
          <div
            className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
            style={{
              width: `${(current / (items.length - 1)) * 100}%`,
            }}
          />

          {items.map((item, index) => {
            const status = getStatus(index)
            const isClickable = onChange && !item.disabled

            return (
              <div
                key={index}
                className={cn(
                  "relative flex flex-col items-center flex-1 z-10",
                  isClickable && "cursor-pointer",
                  item.disabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => isClickable && onChange?.(index)}
              >
                {/* Step Icon/Number */}
                <div
                  className={cn(
                    "flex-shrink-0 flex items-center justify-center rounded-full border-2 transition-all duration-300",
                    size === "small" ? "w-8 h-8 text-xs" : "w-12 h-12 text-base font-semibold",
                    "bg-background",
                    status === "finish" &&
                      "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20",
                    status === "process" &&
                      "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110",
                    status === "wait" &&
                      "border-muted-foreground/30 text-muted-foreground",
                    status === "error" &&
                      "bg-destructive border-destructive text-destructive-foreground"
                  )}
                >
                  {status === "finish" ? (
                    <Check className={size === "small" ? "w-4 h-4" : "w-6 h-6"} />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Step Title */}
                <div className="mt-4 text-center px-2">
                  <h3
                    className={cn(
                      "font-semibold transition-colors",
                      size === "small" ? "text-xs" : "text-base",
                      status === "finish" && "text-foreground",
                      status === "process" && "text-primary",
                      status === "wait" && "text-muted-foreground",
                      status === "error" && "text-destructive"
                    )}
                  >
                    {item.title}
                  </h3>
                  {item.subTitle && (
                    <span className="text-xs text-muted-foreground block mt-1.5">
                      {item.subTitle}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Content Area */}
        {items[current]?.content && (
          <div className="mt-8 p-8 rounded-xl border border-border bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-base text-foreground leading-relaxed">
              {items[current].content}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Vertical default layout
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {items.map((item, index) => {
        const status = getStatus(index)
        const isClickable = onChange && !item.disabled

        return (
          <div
            key={index}
            className={cn(
              "relative flex items-start gap-4",
              isClickable && "cursor-pointer",
              item.disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => isClickable && onChange?.(index)}
          >
            {/* Step Icon/Number */}
            <div className="relative flex flex-col items-center">
              <div
                className={cn(
                  "flex-shrink-0 flex items-center justify-center rounded-full border-2 transition-colors z-10",
                  size === "small" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm font-semibold",
                  status === "finish" &&
                    "bg-primary border-primary text-primary-foreground",
                  status === "process" &&
                    "bg-primary/10 border-primary text-primary",
                  status === "wait" &&
                    "bg-background border-muted-foreground/30 text-muted-foreground",
                  status === "error" &&
                    "bg-destructive border-destructive text-destructive-foreground"
                )}
              >
                {status === "finish" ? (
                  <Check className={size === "small" ? "w-4 h-4" : "w-5 h-5"} />
                ) : (
                  index + 1
                )}
              </div>

              {/* Connection Line */}
              {index < items.length - 1 && (
                <div
                  className={cn(
                    "absolute top-10 w-0.5 transition-colors",
                    size === "small" ? "h-12" : "h-16",
                    status === "finish"
                      ? "bg-primary"
                      : "bg-muted-foreground/20"
                  )}
                />
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 min-w-0 pb-6">
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className={cn(
                    "font-semibold",
                    size === "small" ? "text-sm" : "text-base",
                    status === "finish" && "text-foreground",
                    status === "process" && "text-primary",
                    status === "wait" && "text-muted-foreground",
                    status === "error" && "text-destructive"
                  )}
                >
                  {item.title}
                </h3>
                {item.subTitle && (
                  <span className="text-xs text-muted-foreground">
                    {item.subTitle}
                  </span>
                )}
              </div>
              {item.content && (
                <div className="text-sm text-muted-foreground">{item.content}</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

