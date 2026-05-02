import { FileText, Activity } from 'lucide-react'

export type ActivityItem = {
  key: string
  type: 'document' | 'condition'
  description: string
  memberName: string
  createdAt: string
}

function shortTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yday'
  return `${days}d`
}

interface RecentActivityFeedProps {
  items: ActivityItem[]
}

export function RecentActivityFeed({ items }: RecentActivityFeedProps) {
  if (items.length === 0) return null

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Recent Activity
      </h2>
      <div className="rounded-xl border bg-white divide-y">
        {items.map((item) => {
          const Icon = item.type === 'document' ? FileText : Activity
          return (
            <div key={item.key} className="flex items-center gap-2.5 px-3.5 py-2.5">
              <div className="size-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Icon className="size-3 text-muted-foreground" />
              </div>
              <p className="flex-1 min-w-0 text-xs truncate">
                <span className="font-medium">{item.memberName}</span>
                <span className="text-muted-foreground"> · {item.description}</span>
              </p>
              <span className="text-xs text-muted-foreground shrink-0">
                {shortTimeAgo(item.createdAt)}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
