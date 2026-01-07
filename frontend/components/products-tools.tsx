import { Card } from "@/components/ui/card"
import { TrendingUp, Download, BarChart3, Filter } from "lucide-react"

export default function ProductsTools() {
  const tools = [
    { icon: TrendingUp, name: "NFO Live", count: "4 open" },
    { icon: Download, name: "Import funds" },
    { icon: BarChart3, name: "Compare funds" },
    { icon: Filter, name: "SIP Calculator" },
    { icon: TrendingUp, name: "Mutual funds screener" },
  ]

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-foreground mb-6">Products and Tools</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon
          return (
            <Card
              key={tool.name}
              className="p-6 hover:border-primary/50 transition cursor-pointer flex flex-col items-center text-center gap-3"
            >
              <Icon className="w-6 h-6 text-primary" />
              <p className="font-medium text-foreground text-sm">{tool.name}</p>
              {tool.count && <p className="text-xs text-primary font-semibold">{tool.count}</p>}
            </Card>
          )
        })}
      </div>
    </section>
  )
}
