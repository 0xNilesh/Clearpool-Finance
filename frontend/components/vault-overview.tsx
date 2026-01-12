import { Card } from "@/components/ui/card"

export default function VaultOverview() {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold text-foreground mb-6">Overview</h3>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Total AUM</p>
          <p className="text-3xl font-bold text-primary">$24.5M</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Active Vaults</p>
          <p className="text-2xl font-bold text-foreground">12</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Avg Performance</p>
          <p className="text-2xl font-bold text-green-500">+12.3%</p>
        </div>
      </div>
    </Card>
  )
}
