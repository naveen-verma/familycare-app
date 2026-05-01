'use client'

import { HeartIcon, WifiOffIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="size-14 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
        <HeartIcon className="size-7 text-indigo-600" />
      </div>

      <WifiOffIcon className="size-8 text-gray-400 mb-4" />

      <h1 className="text-lg font-semibold text-gray-800 mb-2">You are offline</h1>
      <p className="text-sm text-gray-500 max-w-xs mb-6">
        Please check your internet connection and try again.
      </p>

      <Button
        onClick={() => window.location.reload()}
        className="bg-indigo-600 hover:bg-indigo-700"
      >
        Retry
      </Button>

      <p className="text-xs text-gray-400 mt-8">Powered by FamilyCare</p>
    </div>
  )
}
