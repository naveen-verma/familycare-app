import Link from 'next/link'
import { HeartIcon } from 'lucide-react'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b sticky top-0 z-10 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-indigo-600 flex items-center justify-center">
              <HeartIcon className="size-4 text-white" />
            </div>
            <span className="font-semibold text-sm">FamilyCare</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to App
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        {children}
      </main>

      <footer className="border-t bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500">© 2026 FamilyCare. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <Link href="/terms" className="hover:text-indigo-600">Terms</Link>
            <Link href="/privacy" className="hover:text-indigo-600">Privacy</Link>
            <Link href="/disclaimer" className="hover:text-indigo-600">Disclaimer</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
