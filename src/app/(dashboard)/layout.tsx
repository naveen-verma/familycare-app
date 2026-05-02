import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { SessionGuard } from '@/components/layout/SessionGuard'
import { Toaster } from '@/components/ui/sonner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <MobileHeader />
        <main className="flex-1 pt-14 md:pt-0 pb-16 md:pb-0 overflow-auto">
          {children}
        </main>
        <BottomNav />
      </div>
      <Toaster />
    </SessionGuard>
  )
}
