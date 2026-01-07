import { Card } from "@/components/ui/card"

export default function Collections() {
  const collections = [
    { name: "High Return", icon: "📈" },
    { name: "Gold & Silver", icon: "💎" },
    { name: "5 Star Funds", icon: "⭐" },
    { name: "Large Cap", icon: "🏢" },
    { name: "Mid Cap", icon: "📊" },
    { name: "Small Cap", icon: "🚀" },
  ]

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-foreground mb-6">Collections</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {collections.map((col) => (
          <Card key={col.name} className="p-6 text-center hover:border-primary/50 transition cursor-pointer">
            <div className="text-3xl mb-2">{col.icon}</div>
            <p className="text-sm font-medium text-foreground">{col.name}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}
