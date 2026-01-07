import { Card } from "@/components/ui/card"

export default function RecentActivity() {
  const activities = [
    { type: "deposit", user: "User #2847", amount: "+$5,000", time: "2m ago" },
    { type: "withdrawal", user: "User #2846", amount: "-$2,500", time: "15m ago" },
    { type: "deposit", user: "User #2845", amount: "+$12,000", time: "1h ago" },
    { type: "vault_created", desc: "New vault created", time: "3h ago" },
    { type: "deposit", user: "User #2844", amount: "+$8,500", time: "5h ago" },
  ]

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold text-foreground mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.map((activity, i) => (
          <div key={i} className="flex items-center justify-between text-sm pb-3 border-b border-border last:border-0">
            <div>
              <p className="text-foreground font-medium">
                {activity.type === "deposit" && `${activity.user} deposited`}
                {activity.type === "withdrawal" && `${activity.user} withdrew`}
                {activity.type === "vault_created" && activity.desc}
              </p>
            </div>
            <div className="text-right">
              {activity.amount && (
                <p className={`font-semibold ${activity.type === "deposit" ? "text-green-500" : "text-red-500"}`}>
                  {activity.amount}
                </p>
              )}
              <p className="text-muted-foreground text-xs">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
