"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TerminalProps {
  children: React.ReactNode
  className?: string
  sequence?: boolean
  startOnView?: boolean
}

const Terminal = React.forwardRef<HTMLDivElement, TerminalProps>(
  ({ children, className, sequence = true, startOnView = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-lg border bg-background p-4 font-mono text-sm",
          "border-gray-200 dark:border-gray-800",
          className
        )}
        {...props}
      >
        <div className="mb-2 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
        </div>
        <div className="space-y-1.5 min-h-[200px]">{children}</div>
      </div>
    )
  }
)
Terminal.displayName = "Terminal"

interface AnimatedSpanProps {
  children: React.ReactNode
  className?: string
  delay?: number
  startOnView?: boolean
}

const AnimatedSpan = React.forwardRef<HTMLSpanElement, AnimatedSpanProps>(
  ({ children, className, delay = 0, startOnView = false, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(!startOnView)
    const spanRef = React.useRef<HTMLSpanElement>(null)

    React.useEffect(() => {
      if (!startOnView) {
        setIsVisible(true)
        return
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        },
        { threshold: 0.1 }
      )

      if (spanRef.current) {
        observer.observe(spanRef.current)
      }

      return () => observer.disconnect()
    }, [startOnView])

    return (
      <span
        ref={ref || spanRef}
        className={cn(
          "block animate-in fade-in duration-500",
          isVisible ? "opacity-100" : "opacity-0",
          className
        )}
        style={{
          animationDelay: `${delay}ms`,
        }}
        {...props}
      >
        {children}
      </span>
    )
  }
)
AnimatedSpan.displayName = "AnimatedSpan"

interface TypingAnimationProps {
  children: string
  className?: string
  duration?: number
  delay?: number
  as?: React.ElementType
  startOnView?: boolean
}

const TypingAnimation = React.forwardRef<HTMLElement, TypingAnimationProps>(
  ({ children, className, duration = 60, delay = 0, as: Component = "span", startOnView = true, ...props }, ref) => {
    const [displayedText, setDisplayedText] = React.useState("")
    const [isVisible, setIsVisible] = React.useState(!startOnView)
    const elementRef = React.useRef<HTMLElement>(null)

    React.useEffect(() => {
      if (!startOnView) {
        setIsVisible(true)
        return
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        },
        { threshold: 0.1 }
      )

      if (elementRef.current) {
        observer.observe(elementRef.current)
      }

      return () => observer.disconnect()
    }, [startOnView])

    React.useEffect(() => {
      if (!isVisible) return

      const timeout = setTimeout(() => {
        let currentIndex = 0
        const interval = setInterval(() => {
          if (currentIndex < children.length) {
            setDisplayedText(children.slice(0, currentIndex + 1))
            currentIndex++
          } else {
            clearInterval(interval)
          }
        }, duration)

        return () => clearInterval(interval)
      }, delay)

      return () => clearTimeout(timeout)
    }, [children, duration, delay, isVisible])

    return (
      <Component
        ref={ref || elementRef}
        className={cn("block", className)}
        {...props}
      >
        {displayedText}
        {displayedText.length < children.length && (
          <span className="animate-pulse">|</span>
        )}
      </Component>
    )
  }
)
TypingAnimation.displayName = "TypingAnimation"

export { Terminal, AnimatedSpan, TypingAnimation }

