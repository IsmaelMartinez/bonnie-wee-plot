import { describe, it, expect } from 'vitest'
import * as Y from 'yjs'

describe('Sync Integration', () => {
  it('syncs data between two Y.Docs via mock transport', async () => {
    const { allotmentToYDoc, yDocToAllotment } = await import('@/services/ydoc-converter')
    const { YjsSyncProvider } = await import('@/services/yjs-sync-provider')

    const doc1 = new Y.Doc()
    const doc2 = new Y.Doc()

    // Create a message queue to handle async message delivery
    const queue1: Uint8Array[] = []
    const queue2: Uint8Array[] = []

    let handler1: ((data: Uint8Array) => void) | null = null
    let handler2: ((data: Uint8Array) => void) | null = null

    const provider1 = new YjsSyncProvider(doc1, {
      send: (data) => {
        if (handler2) {
          handler2(data)
        } else {
          queue2.push(data)
        }
      },
      onReceive: (h) => {
        handler1 = h
        // Process queued messages
        while (queue1.length > 0) {
          const msg = queue1.shift()
          if (msg) h(msg)
        }
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const provider2 = new YjsSyncProvider(doc2, {
      send: (data) => {
        if (handler1) {
          handler1(data)
        } else {
          queue1.push(data)
        }
      },
      onReceive: (h) => {
        handler2 = h
        // Process queued messages
        while (queue2.length > 0) {
          const msg = queue2.shift()
          if (msg) h(msg)
        }
      }
    })

    const testData = {
      version: 16,
      currentYear: 2026,
      meta: { name: 'Test', createdAt: '2026-01-01', updatedAt: '2026-01-29' },
      layout: { areas: [{ id: 'a', name: 'Area A', kind: 'rotation-bed', canHavePlantings: true }] },
      seasons: [],
      varieties: []
    }
    allotmentToYDoc(testData, doc1)

    provider1.startSync()
    await new Promise(resolve => setTimeout(resolve, 100))

    const result = yDocToAllotment(doc2)
    expect(result.meta.name).toBe('Test')
    expect(result.layout.areas).toHaveLength(1)
  })
})
