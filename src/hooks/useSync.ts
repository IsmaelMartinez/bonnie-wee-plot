'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import type { SyncStatus, SyncEvent } from '@/types/sync'
import { createYDoc, initializeYDoc, createPersistence, waitForSync } from '@/services/ydoc-manager'
import { yDocToAllotment, allotmentToYDoc } from '@/services/ydoc-converter'
import { migrateToYDoc } from '@/services/ydoc-migration'
import type { AllotmentData } from '@/types/unified-allotment'
import { logger } from '@/lib/logger'

interface UseSyncOptions {
  enabled?: boolean
}

interface UseSyncReturn {
  status: SyncStatus
  events: SyncEvent[]
  ydoc: Y.Doc | null
  getData: () => AllotmentData | null
  updateData: (updater: (data: AllotmentData) => AllotmentData) => void
  clearEvents: () => void
}

export function useSync(options: UseSyncOptions = {}): UseSyncReturn {
  const { enabled = true } = options

  const [status] = useState<SyncStatus>({
    state: 'disconnected',
    connectedPeers: [],
    pendingChanges: 0
  })
  const [events, setEvents] = useState<SyncEvent[]>([])
  const [ydoc, setYDoc] = useState<Y.Doc | null>(null)
  const persistenceRef = useRef<IndexeddbPersistence | null>(null)

  useEffect(() => {
    if (!enabled) return

    const doc = createYDoc()
    const persistence = createPersistence(doc)
    persistenceRef.current = persistence

    waitForSync(persistence).then(async () => {
      const migrated = await migrateToYDoc(doc)
      if (!migrated && doc.getMap('allotment').size === 0) {
        initializeYDoc(doc)
      }
      setYDoc(doc)
      logger.info('Y.Doc initialized')
    })

    return () => {
      persistence.destroy()
      doc.destroy()
    }
  }, [enabled])

  const getData = useCallback((): AllotmentData | null => {
    if (!ydoc) return null
    return yDocToAllotment(ydoc)
  }, [ydoc])

  const updateData = useCallback((updater: (data: AllotmentData) => AllotmentData) => {
    if (!ydoc) return
    const current = yDocToAllotment(ydoc)
    const updated = updater(current)
    const root = ydoc.getMap('allotment')
    ydoc.transact(() => {
      root.clear()
      allotmentToYDoc(updated, ydoc)
    })
  }, [ydoc])

  const clearEvents = useCallback(() => {
    setEvents([])
  }, [])

  return { status, events, ydoc, getData, updateData, clearEvents }
}
