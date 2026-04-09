import { cn } from '@/lib/utils'

type ConditionStatus = 'active' | 'chronic' | 'monitoring' | 'resolved'

const statusStyles: Record<ConditionStatus, string> = {
  active: 'bg-red-100 text-red-700 border-red-200',
  chronic: 'bg-orange-100 text-orange-700 border-orange-200',
  monitoring: 'bg-blue-100 text-blue-700 border-blue-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
}

export function ConditionTag({ status, name }: { status: string; name: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium capitalize',
        statusStyles[status as ConditionStatus] ?? statusStyles.monitoring
      )}
    >
      {name}
    </span>
  )
}
