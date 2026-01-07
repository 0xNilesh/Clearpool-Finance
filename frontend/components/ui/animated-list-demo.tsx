"use client"

import * as React from "react"
import { CheckCircle2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface AnimatedListDemoProps {
  className?: string
}

interface Notification {
  id: number
  amount: string
  status: "Processing" | "Completed"
  time: string
}

const allNotifications: Notification[] = [
  { id: 1, amount: "$1,250", status: "Processing", time: "2s ago" },
  { id: 2, amount: "$500", status: "Completed", time: "5s ago" },
  { id: 3, amount: "$2,000", status: "Processing", time: "8s ago" },
  { id: 4, amount: "$750", status: "Completed", time: "12s ago" },
  { id: 5, amount: "$1,500", status: "Processing", time: "15s ago" },
]

export default function AnimatedListDemo({ className }: AnimatedListDemoProps) {
  const [items, setItems] = React.useState<Notification[]>([])

  React.useEffect(() => {
    let currentIndex = 0
    let timeoutId: NodeJS.Timeout
    
    const addNextItem = () => {
      if (currentIndex < allNotifications.length) {
        setItems((prev) => [...prev, allNotifications[currentIndex]])
        currentIndex++
        timeoutId = setTimeout(addNextItem, 800)
      } else {
        // Reset after showing all items
        setTimeout(() => {
          setItems([])
          currentIndex = 0
          timeoutId = setTimeout(addNextItem, 800)
        }, 2000)
      }
    }

    timeoutId = setTimeout(addNextItem, 800)

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {items.map((notification) => {
        if (!notification) return null
        return (
          <div
            key={notification.id}
            className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/80 backdrop-blur-sm p-3 text-sm animate-in fade-in slide-in-from-right-5 duration-500"
          >
            {notification.status === "Completed" ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : (
              <Clock className="h-4 w-4 text-yellow-500 animate-pulse flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground">
                {notification.amount}
              </div>
              <div className="text-xs text-muted-foreground">
                {notification.status} • {notification.time}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

