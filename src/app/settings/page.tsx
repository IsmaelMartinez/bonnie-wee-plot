'use client'

import { DeviceSettings } from '@/components/sync/DeviceSettings'
import { SyncToast } from '@/components/sync/SyncToast'
import { useState } from 'react'
import type { SyncEvent } from '@/types/sync'

export default function SettingsPage() {
  const [currentEvent, setCurrentEvent] = useState<SyncEvent | null>(null)

  const dismissEvent = () => {
    setCurrentEvent(null)
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-display text-zen-ink-800 mb-6">Settings</h1>

      <section className="mb-8">
        <h2 className="text-lg font-medium text-zen-ink-700 mb-4">Device Sync</h2>
        <DeviceSettings />
      </section>

      <SyncToast event={currentEvent} onDismiss={dismissEvent} />
    </main>
  )
}
