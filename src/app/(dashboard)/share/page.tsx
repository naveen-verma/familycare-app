import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMember } from '@/lib/members'
import { ShareLinkForm } from '@/components/share/ShareLinkForm'
import { ChevronLeftIcon } from 'lucide-react'

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{ memberId?: string }>
}) {
  const { memberId } = await searchParams

  if (!memberId) notFound()

  const member = await getMember(memberId)
  if (!member) notFound()

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto">
      <Link
        href={`/members/${memberId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeftIcon className="size-4" />
        {member.full_name}
      </Link>

      <div className="mb-5">
        <h1 className="font-heading text-xl font-semibold">Share with Doctor</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Generate a secure link to share {member.full_name}&apos;s health summary with a doctor
        </p>
      </div>

      <ShareLinkForm memberId={memberId} memberName={member.full_name} />
    </div>
  )
}
