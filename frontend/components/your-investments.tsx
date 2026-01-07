import { Card } from "@/components/ui/card"

export default function YourInvestments() {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold text-foreground mb-4">Your Investments</h3>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Current</p>
          <p className="text-2xl font-bold text-foreground">₹12,46,226</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">1D returns</p>
          <p className="text-lg font-semibold text-red-500">-1,659.38 (0.13%)</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Total returns</p>
          <p className="text-lg font-semibold text-green-500">+37,588 (3.11%)</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Invested</p>
          <p className="text-lg font-semibold text-foreground">₹12,08,638</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">XIRR</p>
          <p className="text-lg font-semibold text-foreground">5.91%</p>
        </div>
      </div>
    </Card>
  )
}
