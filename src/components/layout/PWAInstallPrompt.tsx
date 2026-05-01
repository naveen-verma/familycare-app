'use client'

import { useEffect, useState } from 'react'
import { HeartIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const DISMISSED_KEY = 'fc_pwa_prompt_dismissed'

// Typed wrapper for the non-standard beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Don't show if already running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // Don't show if previously dismissed
    if (localStorage.getItem(DISMISSED_KEY)) return

    function handleBeforeInstall(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
    }
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 pb-safe md:hidden">
      <div className="flex items-center gap-3 rounded-xl bg-white border shadow-lg px-4 py-3">
        <div className="size-9 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <HeartIcon className="size-5 text-white" />
        </div>
        <p className="flex-1 text-sm font-medium leading-snug">
          Install FamilyCare for quick access
        </p>
        <Button
          size="sm"
          className="h-8 shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={handleInstall}
        >
          Install
        </Button>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Dismiss"
        >
          <XIcon className="size-4" />
        </button>
      </div>
    </div>
  )
}
