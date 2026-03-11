'use client'

import { Cloud, Smartphone } from 'lucide-react'
import Dialog from '@/components/ui/Dialog'
import type { SyncConflict } from '@/hooks/useSyncedStorage'

interface SyncConflictDialogProps {
  conflict: SyncConflict
  onResolve: (choice: 'cloud' | 'local') => void
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Unknown'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'Unknown'
  return d.toLocaleString()
}

function DataSummary({ data, label }: { data: SyncConflict['local']; label: string }) {
  const areaCount = data.layout?.areas?.length ?? 0
  const varietyCount = data.varieties?.length ?? 0
  const name = data.meta?.name || 'Unnamed'
  const updatedAt = data.meta?.updatedAt

  return (
    <div className="text-sm text-zen-ink-600 space-y-1">
      <p className="font-medium text-zen-ink-800">{label}</p>
      <p>Name: {name}</p>
      <p>Areas: {areaCount}</p>
      <p>Varieties: {varietyCount}</p>
      <p>Last updated: {formatDate(updatedAt)}</p>
    </div>
  )
}

export default function SyncConflictDialog({ conflict, onResolve }: SyncConflictDialogProps) {
  return (
    <Dialog
      isOpen={true}
      onClose={() => {}}
      title="Sync Conflict"
      description="Both this device and the cloud have changes since your last sync. Choose which version to keep."
      closeOnOutsideClick={false}
      showCloseButton={false}
      maxWidth="md"
    >
      <div className="space-y-4 mt-2">
        {/* Cloud option */}
        <button
          type="button"
          onClick={() => onResolve('cloud')}
          className="w-full text-left p-4 rounded-xl border-2 border-zen-stone-200 hover:border-zen-water-400 hover:bg-zen-water-50 transition-colors focus:outline-none focus:ring-2 focus:ring-zen-water-500 focus:ring-offset-2"
        >
          <div className="flex items-start gap-3">
            <Cloud className="w-5 h-5 text-zen-water-500 mt-0.5 shrink-0" />
            <DataSummary data={conflict.remote} label="Cloud version" />
          </div>
        </button>

        {/* Local option */}
        <button
          type="button"
          onClick={() => onResolve('local')}
          className="w-full text-left p-4 rounded-xl border-2 border-zen-stone-200 hover:border-zen-moss-400 hover:bg-zen-moss-50 transition-colors focus:outline-none focus:ring-2 focus:ring-zen-moss-500 focus:ring-offset-2"
        >
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-zen-moss-500 mt-0.5 shrink-0" />
            <DataSummary data={conflict.local} label="This device" />
          </div>
        </button>
      </div>
    </Dialog>
  )
}
