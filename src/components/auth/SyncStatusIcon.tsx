'use client'

import { Cloud, CloudOff, Loader2, AlertCircle } from 'lucide-react'
import type { SyncStatus } from '@/types/storage'

interface SyncStatusIconProps {
  syncStatus: SyncStatus
  syncError: string | null
}

export default function SyncStatusIcon({ syncStatus, syncError }: SyncStatusIconProps) {
  if (syncStatus === 'disabled') return null

  const config = {
    synced: { icon: Cloud, className: 'text-zen-moss-500', title: 'Synced to cloud' },
    syncing: { icon: Loader2, className: 'text-zen-water-500 animate-spin', title: 'Syncing...' },
    error: { icon: AlertCircle, className: 'text-zen-kitsune-500', title: syncError || 'Sync error' },
    offline: { icon: CloudOff, className: 'text-zen-stone-400', title: 'Offline — changes saved locally' },
  }

  const { icon: Icon, className, title } = config[syncStatus]

  return (
    <span title={title} aria-label={title}>
      <Icon className={`w-4 h-4 ${className}`} />
    </span>
  )
}
