import Link from 'next/link'
import { ChevronLeftIcon } from 'lucide-react'
import { ShareLinkHistory } from '@/components/share/ShareLinkHistory'

export default function ShareHistoryPage() {
  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <Link
        href="/members"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeftIcon className="size-4" />
        Family Members
      </Link>

      <div className="mb-5">
        <h1 className="font-heading text-xl font-semibold">Share Link History</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          All secure links you have generated for doctor visits
        </p>
      </div>

      <ShareLinkHistory />
    </div>
  )
}
