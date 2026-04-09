import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { SessionGuard } from '@/components/layout/SessionGuard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 pb-16 md:pb-0 overflow-auto">
          {children}
        </main>
        <BottomNav />
      </div>
    </SessionGuard>
  )
}
