import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye } from "lucide-react"

export default function VaultManagement() {
  const vaults = [
    { id: 1, name: "Tech Growth Fund", aum: "$4.2M", users: 234, status: "Active", perf: "+18.5%" },
    { id: 2, name: "Dividend Income", aum: "$3.8M", users: 189, status: "Active", perf: "+8.2%" },
    { id: 3, name: "Crypto Emerging", aum: "$2.1M", users: 156, status: "Active", perf: "+45.3%" },
    { id: 4, name: "Bond Portfolio", aum: "$1.9M", users: 98, status: "Paused", perf: "+2.1%" },
  ]

  return (
    <section>
      <h2 className="text-2xl font-bold text-foreground mb-6">Active Vaults</h2>
      <div className="space-y-4">
        {vaults.map((vault) => (
          <Card key={vault.id} className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">{vault.name}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">AUM</p>
                    <p className="font-semibold text-foreground">{vault.aum}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Users</p>
                    <p className="font-semibold text-foreground">{vault.users}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className={`font-semibold ${vault.status === "Active" ? "text-green-500" : "text-yellow-500"}`}>
                      {vault.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Performance</p>
                    <p className="font-semibold text-green-500">{vault.perf}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
