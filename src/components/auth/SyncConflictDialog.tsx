'use client'

import { Cloud, Smartphone } from 'lucide-react'
import Dialog from '@/components/ui/Dialog'
import type { SyncConflict } from '@/hooks/useSyncedStorage'

interface SyncConflictDialogProps {
  conflict: SyncConflict
  onResolve: (choice: 'local' | 'cloud') => void
}

function summarise(data: { meta?: { name?: string }; layout?: { areas?: unknown[] }; varieties?: unknown[] }) {
  const name = data.meta?.name || 'Unnamed'
  const areas = data.layout?.areas?.length ?? 0
  const varieties = data.varieties?.length ?? 0
  return { name, areas, varieties }
}

function formatDate(iso: string | undefined) {
  if (!iso) return 'Unknown'
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

export default function SyncConflictDialog({ conflict, onResolve }: SyncConflictDialogProps) {
  const localSummary = summarise(conflict.local)
  const cloudSummary = summarise(conflict.cloud)

  return (
    <Dialog
      isOpen={true}
      onClose={() => onResolve('cloud')}
      title="Data Conflict"
      description="Your data has been changed on both this device and another. Which version would you like to keep?"
      maxWidth="md"
      showCloseButton={false}
      closeOnOutsideClick={false}
    >
      <div className="space-y-4 mt-2">
        <button
          onClick={() => onResolve('cloud')}
          className="w-full p-4 rounded-xl border-2 border-zen-stone-200 hover:border-zen-water-400 hover:bg-zen-water-50 transition-all text-left group"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-zen-water-100 group-hover:bg-zen-water-200 transition-colors">
              <Cloud className="w-5 h-5 text-zen-water-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-zen-ink-800">Use Cloud Data</h3>
              <p className="text-sm text-zen-stone-500 mt-1">
                {cloudSummary.name} &middot; {cloudSummary.areas} area{cloudSummary.areas !== 1 ? 's' : ''} &middot; {cloudSummary.varieties} variet{cloudSummary.varieties !== 1 ? 'ies' : 'y'}
              </p>
              <p className="text-xs text-zen-stone-400 mt-1">
                Last updated: {formatDate(conflict.cloudUpdatedAt)}
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onResolve('local')}
          className="w-full p-4 rounded-xl border-2 border-zen-stone-200 hover:border-zen-moss-400 hover:bg-zen-moss-50 transition-all text-left group"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-zen-moss-100 group-hover:bg-zen-moss-200 transition-colors">
              <Smartphone className="w-5 h-5 text-zen-moss-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-zen-ink-800">Use This Device&apos;s Data</h3>
              <p className="text-sm text-zen-stone-500 mt-1">
                {localSummary.name} &middot; {localSummary.areas} area{localSummary.areas !== 1 ? 's' : ''} &middot; {localSummary.varieties} variet{localSummary.varieties !== 1 ? 'ies' : 'y'}
              </p>
              <p className="text-xs text-zen-stone-400 mt-1">
                Last updated: {formatDate(conflict.local.meta?.updatedAt)}
              </p>
            </div>
          </div>
        </button>

        <p className="text-xs text-zen-stone-400 text-center">
          The version you don&apos;t choose will be discarded.
        </p>
      </div>
    </Dialog>
  )
}
