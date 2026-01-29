import { describe, it, expect } from 'vitest'
import * as Y from 'yjs'

describe('Yjs Sync Provider', () => {
  it('syncs updates between two Y.Docs', async () => {
    const { YjsSyncProvider } = await import('@/services/yjs-sync-provider')

    const doc1 = new Y.Doc()
    const doc2 = new Y.Doc()

    // Simulate two providers connected via mock transport
    let handler1: ((data: Uint8Array) => void) | null = null
    let handler2: ((data: Uint8Array) => void) | null = null

    // Set up providers with bidirectional transport
    const provider1 = new YjsSyncProvider(doc1, {
      send: (data) => {
        // Delay to ensure handler is set
        setTimeout(() => handler2?.(data), 0)
      },
      onReceive: (h) => { handler1 = h }
    })

    const provider2 = new YjsSyncProvider(doc2, {
      send: (data) => {
        // Delay to ensure handler is set
        setTimeout(() => handler1?.(data), 0)
      },
      onReceive: (h) => { handler2 = h }
    })

    // Make change on doc1 before sync
    doc1.getMap('test').set('key', 'value')

    // Start sync
    provider1.startSync()

    // Wait for sync to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify doc2 has the data
    expect(doc2.getMap('test').get('key')).toBe('value')

    // Clean up
    provider1.destroy()
    provider2.destroy()
  })
})
