import { describe, it, expect } from 'vitest'
import type { SyncConnectionState, SyncStatus, SyncEvent } from '@/types/sync'

describe('Sync Types', () => {
  it('SyncConnectionState accepts valid states', () => {
    const states: SyncConnectionState[] = [
      'disconnected',
      'discovering',
      'connecting',
      'connected',
      'syncing'
    ]
    expect(states).toHaveLength(5)
  })

  it('SyncStatus has required fields', () => {
    const status: SyncStatus = {
      state: 'connected',
      connectedPeers: [],
      pendingChanges: 0
    }
    expect(status.state).toBe('connected')
  })

  it('SyncEvent has required fields', () => {
    const event: SyncEvent = {
      type: 'sync-complete',
      changeCount: 3,
      timestamp: new Date().toISOString()
    }
    expect(event.type).toBe('sync-complete')
  })
})
