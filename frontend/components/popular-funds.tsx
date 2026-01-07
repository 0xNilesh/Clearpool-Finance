import { Card } from "@/components/ui/card"
import Link from "next/link"

export default function PopularFunds() {
  const funds = [
    { id: 1, name: "SBI Gold Fund", icon: "🏦", return: "+33.7%", period: "3Y" },
    { id: 2, name: "Parag Parikh Flexi Cap", icon: "🐢", return: "+23.6%", period: "3Y" },
    { id: 3, name: "Bandhan Small Cap Fund", icon: "🔥", return: "+32.5%", period: "3Y" },
    { id: 4, name: "Nippon India Silver ETF", icon: "⭐", return: "+50.7%", period: "3Y" },
  ]

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Popular Vaults</h2>
        <Link href="#" className="text-primary text-sm font-medium hover:underline">
          View all →
        </Link>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {funds.map((fund) => (
          <Card key={fund.id} className="p-6 hover:border-primary/50 transition cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="text-3xl">{fund.icon}</div>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{fund.period}</span>
            </div>
            <h3 className="font-semibold text-foreground mb-3">{fund.name}</h3>
            <p className="text-primary font-bold text-lg">{fund.return}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}
