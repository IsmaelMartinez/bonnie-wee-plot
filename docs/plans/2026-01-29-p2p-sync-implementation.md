# P2P Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable peer-to-peer synchronization of allotment data between devices on the same local network.

**Architecture:** Replace localStorage writes with Yjs Y.Doc operations. Yjs persists to IndexedDB and syncs via WebRTC DataChannel. Devices discover each other via mDNS on local network. Ed25519 keypairs provide device identity with QR code pairing.

**Tech Stack:** Yjs, y-indexeddb, tweetnacl, qrcode.react, WebRTC, mDNS

---

## Parallelization Strategy

Tasks are organized into parallel tracks where possible. Within each phase, independent tasks can run concurrently.

```
Phase 1: Foundation (Week 1)
├── Track A: Yjs Core (Tasks 1-3)
├── Track B: Conversion Utils (Tasks 4-5) [parallel after Task 1]
└── Track C: Migration (Task 6) [depends on A+B]

Phase 2: Device Identity (Week 2)
├── Track A: Crypto Core (Tasks 7-8)
├── Track B: Pairing UI (Tasks 9-10) [parallel]
└── Track C: Integration (Task 11) [depends on A+B]

Phase 3: P2P Connection (Week 3)
├── Track A: mDNS Discovery (Tasks 12-13)
├── Track B: WebRTC Manager (Tasks 14-15) [parallel]
└── Track C: Yjs Sync (Task 16) [depends on A+B]

Phase 4: Polish (Week 4)
├── Track A: Status UI (Tasks 17-18) [parallel]
├── Track B: Error Handling (Task 19) [parallel]
└── Track C: E2E Tests (Task 20) [depends on all]
```

---

## Phase 1: CRDT Foundation

### Task 1: Add Yjs Dependencies

**Model:** haiku (simple task)

**Files:**
- Modify: `package.json`

**Step 1: Install Yjs packages**

Run:
```bash
npm install yjs y-indexeddb
```

**Step 2: Verify installation**

Run:
```bash
npm ls yjs y-indexeddb
```
Expected: Both packages listed with versions

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add yjs and y-indexeddb dependencies"
```

---

### Task 2: Create Y.Doc Schema Types

**Model:** sonnet (type design)

**Files:**
- Create: `src/types/sync.ts`
- Test: `src/__tests__/types/sync.test.ts`

**Step 1: Write the type definitions**

```typescript
// src/types/sync.ts
import * as Y from 'yjs'

/**
 * Yjs document structure for AllotmentData
 * Maps to the existing AllotmentData interface
 */
export interface YjsAllotmentSchema {
  meta: Y.Map<unknown>
  layout: Y.Map<unknown>
  seasons: Y.Array<Y.Map<unknown>>
  varieties: Y.Array<Y.Map<unknown>>
  currentYear: number
  maintenanceTasks: Y.Array<Y.Map<unknown>>
  gardenEvents: Y.Array<Y.Map<unknown>>
}

/**
 * Sync connection state
 */
export type SyncConnectionState =
  | 'disconnected'
  | 'discovering'
  | 'connecting'
  | 'connected'
  | 'syncing'

/**
 * Information about a sync peer
 */
export interface SyncPeer {
  publicKey: string
  deviceName: string
  connectionState: SyncConnectionState
  lastSeen?: string
}

/**
 * Sync status for UI display
 */
export interface SyncStatus {
  state: SyncConnectionState
  connectedPeers: SyncPeer[]
  lastSyncTime?: string
  pendingChanges: number
}

/**
 * Sync event for toast notifications
 */
export interface SyncEvent {
  type: 'sync-complete' | 'peer-connected' | 'peer-disconnected' | 'error'
  peerName?: string
  changeCount?: number
  error?: string
  timestamp: string
}
```

**Step 2: Write basic type test**

```typescript
// src/__tests__/types/sync.test.ts
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
```

**Step 3: Run test**

Run: `npm run test:unit -- src/__tests__/types/sync.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add src/types/sync.ts src/__tests__/types/sync.test.ts
git commit -m "feat(sync): add Yjs and sync type definitions"
```

---

### Task 3: Create Y.Doc Manager Service

**Model:** sonnet (core logic)

**Files:**
- Create: `src/services/ydoc-manager.ts`
- Test: `src/__tests__/services/ydoc-manager.test.ts`

**Step 1: Write failing test for Y.Doc initialization**

```typescript
// src/__tests__/services/ydoc-manager.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock IndexedDB for tests
vi.mock('y-indexeddb', () => ({
  IndexeddbPersistence: vi.fn().mockImplementation(() => ({
    once: vi.fn((event, cb) => {
      if (event === 'synced') setTimeout(cb, 0)
    }),
    destroy: vi.fn()
  }))
}))

describe('YDocManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a Y.Doc with correct structure', async () => {
    const { createYDoc } = await import('@/services/ydoc-manager')
    const ydoc = createYDoc()

    expect(ydoc.getMap('allotment')).toBeDefined()
  })

  it('initializes root map with required keys', async () => {
    const { createYDoc, initializeYDoc } = await import('@/services/ydoc-manager')
    const ydoc = createYDoc()
    initializeYDoc(ydoc)

    const root = ydoc.getMap('allotment')
    expect(root.get('meta')).toBeDefined()
    expect(root.get('layout')).toBeDefined()
    expect(root.get('seasons')).toBeDefined()
    expect(root.get('varieties')).toBeDefined()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/__tests__/services/ydoc-manager.test.ts`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
// src/services/ydoc-manager.ts
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'

const YDOC_NAME = 'bonnieplot-allotment'

/**
 * Create a new Y.Doc instance
 */
export function createYDoc(): Y.Doc {
  return new Y.Doc()
}

/**
 * Initialize Y.Doc with the allotment schema structure
 */
export function initializeYDoc(ydoc: Y.Doc): void {
  const root = ydoc.getMap('allotment')

  // Initialize nested structures if not present
  if (!root.has('meta')) {
    root.set('meta', new Y.Map())
  }
  if (!root.has('layout')) {
    const layout = new Y.Map()
    layout.set('areas', new Y.Array())
    root.set('layout', layout)
  }
  if (!root.has('seasons')) {
    root.set('seasons', new Y.Array())
  }
  if (!root.has('varieties')) {
    root.set('varieties', new Y.Array())
  }
  if (!root.has('maintenanceTasks')) {
    root.set('maintenanceTasks', new Y.Array())
  }
  if (!root.has('gardenEvents')) {
    root.set('gardenEvents', new Y.Array())
  }
  if (!root.has('currentYear')) {
    root.set('currentYear', new Date().getFullYear())
  }
  if (!root.has('version')) {
    root.set('version', 16) // Current schema version
  }
}

/**
 * Create IndexedDB persistence for Y.Doc
 */
export function createPersistence(ydoc: Y.Doc): IndexeddbPersistence {
  return new IndexeddbPersistence(YDOC_NAME, ydoc)
}

/**
 * Wait for persistence to sync
 */
export function waitForSync(persistence: IndexeddbPersistence): Promise<void> {
  return new Promise((resolve) => {
    persistence.once('synced', () => resolve())
  })
}
```

**Step 4: Run test**

Run: `npm run test:unit -- src/__tests__/services/ydoc-manager.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/ydoc-manager.ts src/__tests__/services/ydoc-manager.test.ts
git commit -m "feat(sync): add Y.Doc manager service"
```

---

### Task 4: Create AllotmentData to Y.Doc Converter

**Model:** sonnet (data transformation)
**Parallel with:** Task 3 (after Task 1 complete)

**Files:**
- Create: `src/services/ydoc-converter.ts`
- Test: `src/__tests__/services/ydoc-converter.test.ts`

**Step 1: Write failing test**

```typescript
// src/__tests__/services/ydoc-converter.test.ts
import { describe, it, expect } from 'vitest'
import * as Y from 'yjs'
import type { AllotmentData } from '@/types/unified-allotment'

describe('YDoc Converter', () => {
  const sampleData: AllotmentData = {
    version: 16,
    currentYear: 2026,
    meta: {
      name: 'Test Allotment',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-29'
    },
    layout: {
      areas: [{
        id: 'bed-a',
        name: 'Bed A',
        kind: 'rotation-bed',
        canHavePlantings: true
      }]
    },
    seasons: [{
      year: 2026,
      status: 'current',
      areas: [],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-29'
    }],
    varieties: []
  }

  it('converts AllotmentData to Y.Doc', async () => {
    const { allotmentToYDoc } = await import('@/services/ydoc-converter')
    const ydoc = new Y.Doc()

    allotmentToYDoc(sampleData, ydoc)

    const root = ydoc.getMap('allotment')
    expect(root.get('currentYear')).toBe(2026)
    expect(root.get('version')).toBe(16)
  })

  it('converts Y.Doc back to AllotmentData', async () => {
    const { allotmentToYDoc, yDocToAllotment } = await import('@/services/ydoc-converter')
    const ydoc = new Y.Doc()

    allotmentToYDoc(sampleData, ydoc)
    const result = yDocToAllotment(ydoc)

    expect(result.currentYear).toBe(2026)
    expect(result.meta.name).toBe('Test Allotment')
    expect(result.layout.areas).toHaveLength(1)
  })

  it('round-trips data without loss', async () => {
    const { allotmentToYDoc, yDocToAllotment } = await import('@/services/ydoc-converter')
    const ydoc = new Y.Doc()

    allotmentToYDoc(sampleData, ydoc)
    const result = yDocToAllotment(ydoc)

    expect(result).toEqual(sampleData)
  })
})
```

**Step 2: Run test to verify failure**

Run: `npm run test:unit -- src/__tests__/services/ydoc-converter.test.ts`
Expected: FAIL

**Step 3: Implement converter**

```typescript
// src/services/ydoc-converter.ts
import * as Y from 'yjs'
import type { AllotmentData, SeasonRecord, Area, StoredVariety } from '@/types/unified-allotment'

/**
 * Convert plain object to Y.Map recursively
 */
function objectToYMap(obj: Record<string, unknown>, ymap: Y.Map<unknown>): void {
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      continue
    }
    if (Array.isArray(value)) {
      const yarray = new Y.Array()
      value.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          const itemMap = new Y.Map()
          objectToYMap(item as Record<string, unknown>, itemMap)
          yarray.push([itemMap])
        } else {
          yarray.push([item])
        }
      })
      ymap.set(key, yarray)
    } else if (typeof value === 'object') {
      const nestedMap = new Y.Map()
      objectToYMap(value as Record<string, unknown>, nestedMap)
      ymap.set(key, nestedMap)
    } else {
      ymap.set(key, value)
    }
  }
}

/**
 * Convert Y.Map to plain object recursively
 */
function yMapToObject(ymap: Y.Map<unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  ymap.forEach((value, key) => {
    if (value instanceof Y.Map) {
      result[key] = yMapToObject(value)
    } else if (value instanceof Y.Array) {
      result[key] = yArrayToArray(value)
    } else {
      result[key] = value
    }
  })
  return result
}

/**
 * Convert Y.Array to plain array recursively
 */
function yArrayToArray(yarray: Y.Array<unknown>): unknown[] {
  return yarray.toArray().map(item => {
    if (item instanceof Y.Map) {
      return yMapToObject(item)
    } else if (item instanceof Y.Array) {
      return yArrayToArray(item)
    }
    return item
  })
}

/**
 * Convert AllotmentData to Y.Doc structure
 */
export function allotmentToYDoc(data: AllotmentData, ydoc: Y.Doc): void {
  const root = ydoc.getMap('allotment')

  ydoc.transact(() => {
    // Set primitive values
    root.set('version', data.version)
    root.set('currentYear', data.currentYear)

    // Convert meta
    const meta = new Y.Map()
    objectToYMap(data.meta as Record<string, unknown>, meta)
    root.set('meta', meta)

    // Convert layout
    const layout = new Y.Map()
    const areas = new Y.Array()
    data.layout.areas.forEach(area => {
      const areaMap = new Y.Map()
      objectToYMap(area as unknown as Record<string, unknown>, areaMap)
      areas.push([areaMap])
    })
    layout.set('areas', areas)
    root.set('layout', layout)

    // Convert seasons
    const seasons = new Y.Array()
    data.seasons.forEach(season => {
      const seasonMap = new Y.Map()
      objectToYMap(season as unknown as Record<string, unknown>, seasonMap)
      seasons.push([seasonMap])
    })
    root.set('seasons', seasons)

    // Convert varieties
    const varieties = new Y.Array()
    data.varieties.forEach(variety => {
      const varietyMap = new Y.Map()
      objectToYMap(variety as unknown as Record<string, unknown>, varietyMap)
      varieties.push([varietyMap])
    })
    root.set('varieties', varieties)

    // Convert optional arrays
    if (data.maintenanceTasks) {
      const tasks = new Y.Array()
      data.maintenanceTasks.forEach(task => {
        const taskMap = new Y.Map()
        objectToYMap(task as unknown as Record<string, unknown>, taskMap)
        tasks.push([taskMap])
      })
      root.set('maintenanceTasks', tasks)
    }

    if (data.gardenEvents) {
      const events = new Y.Array()
      data.gardenEvents.forEach(event => {
        const eventMap = new Y.Map()
        objectToYMap(event as unknown as Record<string, unknown>, eventMap)
        events.push([eventMap])
      })
      root.set('gardenEvents', events)
    }
  })
}

/**
 * Convert Y.Doc back to AllotmentData
 */
export function yDocToAllotment(ydoc: Y.Doc): AllotmentData {
  const root = ydoc.getMap('allotment')

  const meta = root.get('meta') as Y.Map<unknown>
  const layout = root.get('layout') as Y.Map<unknown>
  const seasons = root.get('seasons') as Y.Array<Y.Map<unknown>>
  const varieties = root.get('varieties') as Y.Array<Y.Map<unknown>>
  const maintenanceTasks = root.get('maintenanceTasks') as Y.Array<Y.Map<unknown>> | undefined
  const gardenEvents = root.get('gardenEvents') as Y.Array<Y.Map<unknown>> | undefined

  const result: AllotmentData = {
    version: root.get('version') as number,
    currentYear: root.get('currentYear') as number,
    meta: yMapToObject(meta) as AllotmentData['meta'],
    layout: {
      areas: yArrayToArray(layout.get('areas') as Y.Array<unknown>) as Area[]
    },
    seasons: yArrayToArray(seasons) as SeasonRecord[],
    varieties: yArrayToArray(varieties) as StoredVariety[]
  }

  if (maintenanceTasks) {
    result.maintenanceTasks = yArrayToArray(maintenanceTasks) as AllotmentData['maintenanceTasks']
  }

  if (gardenEvents) {
    result.gardenEvents = yArrayToArray(gardenEvents) as AllotmentData['gardenEvents']
  }

  return result
}
```

**Step 4: Run test**

Run: `npm run test:unit -- src/__tests__/services/ydoc-converter.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/ydoc-converter.ts src/__tests__/services/ydoc-converter.test.ts
git commit -m "feat(sync): add AllotmentData <-> Y.Doc converter"
```

---

### Task 5: Add Y.Doc Change Tracking

**Model:** sonnet (event handling)
**Parallel with:** Task 4

**Files:**
- Modify: `src/services/ydoc-manager.ts`
- Modify: `src/__tests__/services/ydoc-manager.test.ts`

**Step 1: Add failing test for change tracking**

Add to `src/__tests__/services/ydoc-manager.test.ts`:

```typescript
  it('tracks changes for sync notifications', async () => {
    const { createYDoc, initializeYDoc, trackChanges } = await import('@/services/ydoc-manager')
    const ydoc = createYDoc()
    initializeYDoc(ydoc)

    const changes: number[] = []
    const unsubscribe = trackChanges(ydoc, (count) => changes.push(count))

    // Make a change
    const root = ydoc.getMap('allotment')
    root.set('currentYear', 2027)

    expect(changes.length).toBeGreaterThan(0)
    unsubscribe()
  })
```

**Step 2: Run test**

Run: `npm run test:unit -- src/__tests__/services/ydoc-manager.test.ts`
Expected: FAIL

**Step 3: Implement change tracking**

Add to `src/services/ydoc-manager.ts`:

```typescript
/**
 * Track changes to Y.Doc for sync notifications
 * Returns unsubscribe function
 */
export function trackChanges(
  ydoc: Y.Doc,
  onChangeCount: (count: number) => void
): () => void {
  let changeCount = 0

  const handler = (update: Uint8Array, origin: unknown) => {
    // Only count local changes (not from sync)
    if (origin !== 'sync') {
      changeCount++
      onChangeCount(changeCount)
    }
  }

  ydoc.on('update', handler)

  return () => {
    ydoc.off('update', handler)
  }
}

/**
 * Reset change counter (call after sync completes)
 */
export function createChangeCounter() {
  let count = 0
  return {
    increment: () => ++count,
    reset: () => { count = 0 },
    getCount: () => count
  }
}
```

**Step 4: Run test**

Run: `npm run test:unit -- src/__tests__/services/ydoc-manager.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/ydoc-manager.ts src/__tests__/services/ydoc-manager.test.ts
git commit -m "feat(sync): add Y.Doc change tracking for notifications"
```

---

### Task 6: Migrate localStorage to Y.Doc

**Model:** sonnet (migration logic)
**Depends on:** Tasks 3, 4, 5

**Files:**
- Modify: `src/services/allotment-storage.ts`
- Create: `src/services/ydoc-migration.ts`
- Test: `src/__tests__/services/ydoc-migration.test.ts`

**Step 1: Write failing migration test**

```typescript
// src/__tests__/services/ydoc-migration.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as Y from 'yjs'

// Mock localStorage
const mockStorage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => { mockStorage[key] = value },
  removeItem: (key: string) => { delete mockStorage[key] }
})

describe('Y.Doc Migration', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
  })

  it('migrates existing localStorage data to Y.Doc', async () => {
    const { migrateToYDoc } = await import('@/services/ydoc-migration')

    // Set up existing localStorage data
    const existingData = {
      version: 16,
      currentYear: 2026,
      meta: { name: 'My Allotment', createdAt: '2026-01-01', updatedAt: '2026-01-29' },
      layout: { areas: [] },
      seasons: [],
      varieties: []
    }
    mockStorage['allotment-unified-data'] = JSON.stringify(existingData)

    const ydoc = new Y.Doc()
    const migrated = await migrateToYDoc(ydoc)

    expect(migrated).toBe(true)
    const root = ydoc.getMap('allotment')
    expect(root.get('currentYear')).toBe(2026)
  })

  it('creates backup of localStorage after migration', async () => {
    const { migrateToYDoc } = await import('@/services/ydoc-migration')

    const existingData = {
      version: 16,
      currentYear: 2026,
      meta: { name: 'My Allotment', createdAt: '2026-01-01', updatedAt: '2026-01-29' },
      layout: { areas: [] },
      seasons: [],
      varieties: []
    }
    mockStorage['allotment-unified-data'] = JSON.stringify(existingData)

    const ydoc = new Y.Doc()
    await migrateToYDoc(ydoc)

    expect(mockStorage['allotment-unified-data-backup']).toBeDefined()
  })

  it('skips migration if no localStorage data', async () => {
    const { migrateToYDoc } = await import('@/services/ydoc-migration')

    const ydoc = new Y.Doc()
    const migrated = await migrateToYDoc(ydoc)

    expect(migrated).toBe(false)
  })

  it('skips migration if Y.Doc already has data', async () => {
    const { migrateToYDoc } = await import('@/services/ydoc-migration')

    mockStorage['allotment-unified-data'] = JSON.stringify({
      version: 16,
      currentYear: 2026,
      meta: { name: 'Test', createdAt: '2026-01-01', updatedAt: '2026-01-29' },
      layout: { areas: [] },
      seasons: [],
      varieties: []
    })

    const ydoc = new Y.Doc()
    const root = ydoc.getMap('allotment')
    root.set('currentYear', 2025) // Pre-existing data

    const migrated = await migrateToYDoc(ydoc)

    expect(migrated).toBe(false)
    expect(root.get('currentYear')).toBe(2025) // Unchanged
  })
})
```

**Step 2: Run test**

Run: `npm run test:unit -- src/__tests__/services/ydoc-migration.test.ts`
Expected: FAIL

**Step 3: Implement migration service**

```typescript
// src/services/ydoc-migration.ts
import * as Y from 'yjs'
import { STORAGE_KEY } from '@/types/unified-allotment'
import type { AllotmentData } from '@/types/unified-allotment'
import { allotmentToYDoc } from './ydoc-converter'
import { validateAllotmentData } from './allotment-storage'
import { logger } from '@/lib/logger'

const BACKUP_KEY = `${STORAGE_KEY}-backup`
const BACKUP_EXPIRY_DAYS = 30

/**
 * Migrate existing localStorage data to Y.Doc
 * Returns true if migration occurred, false if skipped
 */
export async function migrateToYDoc(ydoc: Y.Doc): Promise<boolean> {
  // Check if Y.Doc already has data
  const root = ydoc.getMap('allotment')
  if (root.size > 0) {
    logger.info('Y.Doc already has data, skipping migration')
    return false
  }

  // Check for existing localStorage data
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    logger.info('No localStorage data to migrate')
    return false
  }

  try {
    const data = JSON.parse(stored) as AllotmentData

    // Validate data before migration
    const validation = validateAllotmentData(data)
    if (!validation.valid) {
      logger.error('Invalid localStorage data, cannot migrate', { errors: validation.errors })
      return false
    }

    // Create backup before migration
    const backupData = {
      data: stored,
      migratedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + BACKUP_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()
    }
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backupData))

    // Migrate to Y.Doc
    allotmentToYDoc(data, ydoc)

    logger.info('Successfully migrated localStorage to Y.Doc', {
      areasCount: data.layout.areas.length,
      seasonsCount: data.seasons.length
    })

    return true
  } catch (error) {
    logger.error('Failed to migrate localStorage to Y.Doc', { error })
    return false
  }
}

/**
 * Clean up expired backups
 */
export function cleanupExpiredBackups(): void {
  const backupStr = localStorage.getItem(BACKUP_KEY)
  if (!backupStr) return

  try {
    const backup = JSON.parse(backupStr)
    if (new Date(backup.expiresAt) < new Date()) {
      localStorage.removeItem(BACKUP_KEY)
      logger.info('Cleaned up expired localStorage backup')
    }
  } catch {
    // Invalid backup, remove it
    localStorage.removeItem(BACKUP_KEY)
  }
}

/**
 * Restore from backup if Y.Doc is corrupted
 */
export async function restoreFromBackup(ydoc: Y.Doc): Promise<boolean> {
  const backupStr = localStorage.getItem(BACKUP_KEY)
  if (!backupStr) {
    logger.warn('No backup available for restore')
    return false
  }

  try {
    const backup = JSON.parse(backupStr)
    const data = JSON.parse(backup.data) as AllotmentData

    // Clear existing Y.Doc data
    const root = ydoc.getMap('allotment')
    root.clear()

    // Restore from backup
    allotmentToYDoc(data, ydoc)

    logger.info('Successfully restored from backup')
    return true
  } catch (error) {
    logger.error('Failed to restore from backup', { error })
    return false
  }
}
```

**Step 4: Run test**

Run: `npm run test:unit -- src/__tests__/services/ydoc-migration.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/ydoc-migration.ts src/__tests__/services/ydoc-migration.test.ts
git commit -m "feat(sync): add localStorage to Y.Doc migration"
```

---

## Phase 2: Device Identity

### Task 7: Add Crypto Dependencies and Types

**Model:** haiku (simple task)

**Files:**
- Modify: `package.json`
- Modify: `src/types/sync.ts`

**Step 1: Install tweetnacl**

Run:
```bash
npm install tweetnacl tweetnacl-util
npm install -D @types/tweetnacl
```

**Step 2: Add device identity types to sync.ts**

Add to `src/types/sync.ts`:

```typescript
/**
 * Device identity stored locally
 */
export interface DeviceIdentity {
  publicKey: string      // Base64-encoded Ed25519 public key
  privateKey: string     // Base64-encoded private key (never leaves device)
  deviceName: string     // User-editable name
  createdAt: string      // ISO timestamp
}

/**
 * Paired device info (stored for each paired peer)
 */
export interface PairedDevice {
  publicKey: string
  deviceName: string
  pairedAt: string
  lastSeen?: string
}

/**
 * QR code pairing payload
 */
export interface PairingPayload {
  v: 1                   // Protocol version
  pk: string             // Base64 public key
  code: string           // 6-digit confirmation code
  name: string           // Device name
  ts: number             // Unix timestamp
}
```

**Step 3: Commit**

```bash
git add package.json package-lock.json src/types/sync.ts
git commit -m "chore: add tweetnacl and device identity types"
```

---

### Task 8: Create Device Identity Service

**Model:** sonnet (crypto logic)

**Files:**
- Create: `src/services/device-identity.ts`
- Test: `src/__tests__/services/device-identity.test.ts`

**Step 1: Write failing test**

```typescript
// src/__tests__/services/device-identity.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockStorage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => { mockStorage[key] = value },
  removeItem: (key: string) => { delete mockStorage[key] }
})

describe('Device Identity Service', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
  })

  it('generates new device identity', async () => {
    const { generateDeviceIdentity } = await import('@/services/device-identity')

    const identity = generateDeviceIdentity('My iPhone')

    expect(identity.publicKey).toBeDefined()
    expect(identity.privateKey).toBeDefined()
    expect(identity.deviceName).toBe('My iPhone')
    expect(identity.publicKey).not.toBe(identity.privateKey)
  })

  it('stores and retrieves identity', async () => {
    const { generateDeviceIdentity, saveIdentity, loadIdentity } = await import('@/services/device-identity')

    const identity = generateDeviceIdentity('Test Device')
    saveIdentity(identity)

    const loaded = loadIdentity()
    expect(loaded).toEqual(identity)
  })

  it('creates pairing payload with confirmation code', async () => {
    const { generateDeviceIdentity, createPairingPayload } = await import('@/services/device-identity')

    const identity = generateDeviceIdentity('iPhone')
    const payload = createPairingPayload(identity)

    expect(payload.v).toBe(1)
    expect(payload.pk).toBe(identity.publicKey)
    expect(payload.code).toMatch(/^\d{6}$/)
    expect(payload.name).toBe('iPhone')
  })

  it('validates pairing code', async () => {
    const { generateDeviceIdentity, createPairingPayload, validatePairingCode } = await import('@/services/device-identity')

    const identity = generateDeviceIdentity('iPhone')
    const payload = createPairingPayload(identity)

    expect(validatePairingCode(payload.code, payload)).toBe(true)
    expect(validatePairingCode('000000', payload)).toBe(false)
  })

  it('signs and verifies challenges', async () => {
    const { generateDeviceIdentity, signChallenge, verifySignature } = await import('@/services/device-identity')

    const identity = generateDeviceIdentity('Device')
    const challenge = 'test-challenge-12345'

    const signature = signChallenge(challenge, identity.privateKey)
    const valid = verifySignature(challenge, signature, identity.publicKey)

    expect(valid).toBe(true)
  })
})
```

**Step 2: Run test**

Run: `npm run test:unit -- src/__tests__/services/device-identity.test.ts`
Expected: FAIL

**Step 3: Implement device identity service**

```typescript
// src/services/device-identity.ts
import nacl from 'tweetnacl'
import { encodeBase64, decodeBase64 } from 'tweetnacl-util'
import type { DeviceIdentity, PairedDevice, PairingPayload } from '@/types/sync'
import { logger } from '@/lib/logger'

const IDENTITY_KEY = 'bonnieplot-device-identity'
const PAIRED_DEVICES_KEY = 'bonnieplot-paired-devices'
const PAIRING_CODE_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Generate a new device identity with Ed25519 keypair
 */
export function generateDeviceIdentity(deviceName: string): DeviceIdentity {
  const keypair = nacl.sign.keyPair()

  return {
    publicKey: encodeBase64(keypair.publicKey),
    privateKey: encodeBase64(keypair.secretKey),
    deviceName,
    createdAt: new Date().toISOString()
  }
}

/**
 * Save device identity to localStorage
 */
export function saveIdentity(identity: DeviceIdentity): void {
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity))
  logger.info('Saved device identity', { deviceName: identity.deviceName })
}

/**
 * Load device identity from localStorage
 */
export function loadIdentity(): DeviceIdentity | null {
  const stored = localStorage.getItem(IDENTITY_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored) as DeviceIdentity
  } catch {
    logger.error('Failed to parse stored identity')
    return null
  }
}

/**
 * Get or create device identity
 */
export function getOrCreateIdentity(defaultName: string = 'My Device'): DeviceIdentity {
  const existing = loadIdentity()
  if (existing) return existing

  const identity = generateDeviceIdentity(defaultName)
  saveIdentity(identity)
  return identity
}

/**
 * Update device name
 */
export function updateDeviceName(newName: string): DeviceIdentity | null {
  const identity = loadIdentity()
  if (!identity) return null

  identity.deviceName = newName
  saveIdentity(identity)
  return identity
}

/**
 * Generate 6-digit confirmation code
 */
function generateConfirmationCode(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return String(array[0] % 1000000).padStart(6, '0')
}

/**
 * Create pairing payload for QR code
 */
export function createPairingPayload(identity: DeviceIdentity): PairingPayload {
  return {
    v: 1,
    pk: identity.publicKey,
    code: generateConfirmationCode(),
    name: identity.deviceName,
    ts: Date.now()
  }
}

/**
 * Validate pairing code against payload
 */
export function validatePairingCode(code: string, payload: PairingPayload): boolean {
  // Check code matches
  if (code !== payload.code) return false

  // Check not expired
  const age = Date.now() - payload.ts
  if (age > PAIRING_CODE_EXPIRY_MS) {
    logger.warn('Pairing code expired', { age })
    return false
  }

  return true
}

/**
 * Sign a challenge with private key
 */
export function signChallenge(challenge: string, privateKeyBase64: string): string {
  const privateKey = decodeBase64(privateKeyBase64)
  const message = new TextEncoder().encode(challenge)
  const signature = nacl.sign.detached(message, privateKey)
  return encodeBase64(signature)
}

/**
 * Verify a signature with public key
 */
export function verifySignature(challenge: string, signatureBase64: string, publicKeyBase64: string): boolean {
  try {
    const publicKey = decodeBase64(publicKeyBase64)
    const signature = decodeBase64(signatureBase64)
    const message = new TextEncoder().encode(challenge)
    return nacl.sign.detached.verify(message, signature, publicKey)
  } catch {
    return false
  }
}

// ============ Paired Devices Management ============

/**
 * Get all paired devices
 */
export function getPairedDevices(): PairedDevice[] {
  const stored = localStorage.getItem(PAIRED_DEVICES_KEY)
  if (!stored) return []

  try {
    return JSON.parse(stored) as PairedDevice[]
  } catch {
    return []
  }
}

/**
 * Add a paired device
 */
export function addPairedDevice(device: PairedDevice): void {
  const devices = getPairedDevices()

  // Check if already paired
  const existing = devices.find(d => d.publicKey === device.publicKey)
  if (existing) {
    // Update existing
    Object.assign(existing, device)
  } else {
    devices.push(device)
  }

  localStorage.setItem(PAIRED_DEVICES_KEY, JSON.stringify(devices))
  logger.info('Added paired device', { deviceName: device.deviceName })
}

/**
 * Remove a paired device
 */
export function removePairedDevice(publicKey: string): void {
  const devices = getPairedDevices().filter(d => d.publicKey !== publicKey)
  localStorage.setItem(PAIRED_DEVICES_KEY, JSON.stringify(devices))
  logger.info('Removed paired device')
}

/**
 * Update last seen time for a device
 */
export function updateDeviceLastSeen(publicKey: string): void {
  const devices = getPairedDevices()
  const device = devices.find(d => d.publicKey === publicKey)
  if (device) {
    device.lastSeen = new Date().toISOString()
    localStorage.setItem(PAIRED_DEVICES_KEY, JSON.stringify(devices))
  }
}

/**
 * Check if a public key is from a paired device
 */
export function isPairedDevice(publicKey: string): boolean {
  return getPairedDevices().some(d => d.publicKey === publicKey)
}

/**
 * Get truncated public key for mDNS (first 16 chars)
 */
export function getTruncatedPublicKey(publicKey: string): string {
  return publicKey.substring(0, 16)
}
```

**Step 4: Run test**

Run: `npm run test:unit -- src/__tests__/services/device-identity.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/device-identity.ts src/__tests__/services/device-identity.test.ts
git commit -m "feat(sync): add device identity service with Ed25519"
```

---

### Task 9: Add QR Code Dependencies

**Model:** haiku (simple task)

**Files:**
- Modify: `package.json`

**Step 1: Install QR packages**

Run:
```bash
npm install qrcode.react @yudiel/react-qr-scanner
```

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add QR code generation and scanning packages"
```

---

### Task 10: Create Pairing UI Components

**Model:** sonnet (React components)
**Parallel with:** Tasks 8, 9

**Files:**
- Create: `src/components/sync/PairingModal.tsx`
- Create: `src/components/sync/QRCodeDisplay.tsx`
- Create: `src/components/sync/QRCodeScanner.tsx`
- Test: `src/__tests__/components/sync/PairingModal.test.tsx`

**Step 1: Create QR display component**

```typescript
// src/components/sync/QRCodeDisplay.tsx
'use client'

import { QRCodeSVG } from 'qrcode.react'
import type { PairingPayload } from '@/types/sync'

interface QRCodeDisplayProps {
  payload: PairingPayload
}

export function QRCodeDisplay({ payload }: QRCodeDisplayProps) {
  const qrValue = JSON.stringify(payload)

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-lg">
        <QRCodeSVG value={qrValue} size={200} />
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-2">Confirmation code:</p>
        <p className="text-3xl font-mono font-bold tracking-wider">
          {payload.code.slice(0, 3)} {payload.code.slice(3)}
        </p>
      </div>
      <p className="text-xs text-gray-400">
        Code expires in 5 minutes
      </p>
    </div>
  )
}
```

**Step 2: Create QR scanner component**

```typescript
// src/components/sync/QRCodeScanner.tsx
'use client'

import { useState } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import type { PairingPayload } from '@/types/sync'

interface QRCodeScannerProps {
  onScan: (payload: PairingPayload) => void
  onError: (error: string) => void
}

export function QRCodeScanner({ onScan, onError }: QRCodeScannerProps) {
  const [hasPermission, setHasPermission] = useState(true)

  const handleScan = (result: { rawValue: string }[]) => {
    if (result.length === 0) return

    try {
      const payload = JSON.parse(result[0].rawValue) as PairingPayload

      // Validate payload structure
      if (payload.v !== 1 || !payload.pk || !payload.code || !payload.name) {
        onError('Invalid QR code format')
        return
      }

      onScan(payload)
    } catch {
      onError('Could not read QR code')
    }
  }

  const handleError = (error: unknown) => {
    if (error instanceof Error && error.name === 'NotAllowedError') {
      setHasPermission(false)
    }
    onError('Camera error')
  }

  if (!hasPermission) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-2">Camera access denied</p>
        <p className="text-sm text-gray-500">
          Please enable camera access in your browser settings to scan QR codes.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <Scanner
        onScan={handleScan}
        onError={handleError}
        constraints={{ facingMode: 'environment' }}
        styles={{
          container: { borderRadius: '8px', overflow: 'hidden' }
        }}
      />
      <p className="text-sm text-gray-500 text-center mt-4">
        Point your camera at the QR code on the other device
      </p>
    </div>
  )
}
```

**Step 3: Create pairing modal**

```typescript
// src/components/sync/PairingModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { QRCodeDisplay } from './QRCodeDisplay'
import { QRCodeScanner } from './QRCodeScanner'
import {
  getOrCreateIdentity,
  createPairingPayload,
  validatePairingCode,
  addPairedDevice
} from '@/services/device-identity'
import type { PairingPayload, PairedDevice } from '@/types/sync'

interface PairingModalProps {
  open: boolean
  onClose: () => void
  onPaired: (device: PairedDevice) => void
}

type PairingStep = 'choose' | 'show-qr' | 'scan-qr' | 'confirm' | 'success'

export function PairingModal({ open, onClose, onPaired }: PairingModalProps) {
  const [step, setStep] = useState<PairingStep>('choose')
  const [payload, setPayload] = useState<PairingPayload | null>(null)
  const [scannedPayload, setScannedPayload] = useState<PairingPayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Generate new payload when showing QR
  useEffect(() => {
    if (step === 'show-qr') {
      const identity = getOrCreateIdentity()
      setPayload(createPairingPayload(identity))
    }
  }, [step])

  // Refresh payload every 4 minutes (before 5-minute expiry)
  useEffect(() => {
    if (step !== 'show-qr') return

    const interval = setInterval(() => {
      const identity = getOrCreateIdentity()
      setPayload(createPairingPayload(identity))
    }, 4 * 60 * 1000)

    return () => clearInterval(interval)
  }, [step])

  const handleScan = (scanned: PairingPayload) => {
    setScannedPayload(scanned)
    setStep('confirm')
  }

  const handleConfirm = () => {
    if (!scannedPayload) return

    // In real implementation, we'd complete pairing over WebRTC here
    // For now, just add as paired device
    const device: PairedDevice = {
      publicKey: scannedPayload.pk,
      deviceName: scannedPayload.name,
      pairedAt: new Date().toISOString()
    }

    addPairedDevice(device)
    onPaired(device)
    setStep('success')
  }

  const handleClose = () => {
    setStep('choose')
    setPayload(null)
    setScannedPayload(null)
    setError(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'choose' && 'Add Device'}
            {step === 'show-qr' && 'Show QR Code'}
            {step === 'scan-qr' && 'Scan QR Code'}
            {step === 'confirm' && 'Confirm Pairing'}
            {step === 'success' && 'Device Paired!'}
          </DialogTitle>
        </DialogHeader>

        {step === 'choose' && (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setStep('show-qr')}
              className="p-4 border rounded-lg text-left hover:bg-gray-50"
            >
              <p className="font-medium">Show QR Code</p>
              <p className="text-sm text-gray-500">Let another device scan this one</p>
            </button>
            <button
              onClick={() => setStep('scan-qr')}
              className="p-4 border rounded-lg text-left hover:bg-gray-50"
            >
              <p className="font-medium">Scan QR Code</p>
              <p className="text-sm text-gray-500">Scan a code from another device</p>
            </button>
          </div>
        )}

        {step === 'show-qr' && payload && (
          <QRCodeDisplay payload={payload} />
        )}

        {step === 'scan-qr' && (
          <QRCodeScanner
            onScan={handleScan}
            onError={setError}
          />
        )}

        {step === 'confirm' && scannedPayload && (
          <div className="text-center">
            <p className="mb-4">
              Pair with <strong>{scannedPayload.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Verify this code matches the other device:
            </p>
            <p className="text-3xl font-mono font-bold tracking-wider mb-6">
              {scannedPayload.code.slice(0, 3)} {scannedPayload.code.slice(3)}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setStep('scan-qr')}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✓</div>
            <p className="text-lg font-medium mb-2">Successfully paired!</p>
            <p className="text-sm text-gray-500 mb-4">
              Your devices will now sync automatically when on the same network.
            </p>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Done
            </button>
          </div>
        )}

        {error && (
          <p className="text-red-600 text-sm text-center">{error}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

**Step 4: Write component test**

```typescript
// src/__tests__/components/sync/PairingModal.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PairingModal } from '@/components/sync/PairingModal'

// Mock device identity service
vi.mock('@/services/device-identity', () => ({
  getOrCreateIdentity: () => ({
    publicKey: 'test-public-key',
    privateKey: 'test-private-key',
    deviceName: 'Test Device',
    createdAt: new Date().toISOString()
  }),
  createPairingPayload: () => ({
    v: 1,
    pk: 'test-public-key',
    code: '123456',
    name: 'Test Device',
    ts: Date.now()
  }),
  addPairedDevice: vi.fn()
}))

describe('PairingModal', () => {
  it('renders choice screen when open', () => {
    render(
      <PairingModal
        open={true}
        onClose={() => {}}
        onPaired={() => {}}
      />
    )

    expect(screen.getByText('Add Device')).toBeInTheDocument()
    expect(screen.getByText('Show QR Code')).toBeInTheDocument()
    expect(screen.getByText('Scan QR Code')).toBeInTheDocument()
  })

  it('shows QR code when option selected', () => {
    render(
      <PairingModal
        open={true}
        onClose={() => {}}
        onPaired={() => {}}
      />
    )

    fireEvent.click(screen.getByText('Show QR Code'))

    expect(screen.getByText('Confirmation code:')).toBeInTheDocument()
    expect(screen.getByText('123 456')).toBeInTheDocument()
  })
})
```

**Step 5: Run test**

Run: `npm run test:unit -- src/__tests__/components/sync/PairingModal.test.tsx`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/sync/*.tsx src/__tests__/components/sync/*.tsx
git commit -m "feat(sync): add QR pairing UI components"
```

---

### Task 11: Create Device Settings UI

**Model:** sonnet (React components)
**Depends on:** Tasks 8, 10

**Files:**
- Create: `src/components/sync/DeviceSettings.tsx`
- Create: `src/components/sync/PairedDevicesList.tsx`

**Step 1: Create paired devices list**

```typescript
// src/components/sync/PairedDevicesList.tsx
'use client'

import { getPairedDevices, removePairedDevice } from '@/services/device-identity'
import type { PairedDevice } from '@/types/sync'

interface PairedDevicesListProps {
  devices: PairedDevice[]
  onRemove: (publicKey: string) => void
}

export function PairedDevicesList({ devices, onRemove }: PairedDevicesListProps) {
  if (devices.length === 0) {
    return (
      <p className="text-gray-500 text-sm py-4 text-center">
        No paired devices yet
      </p>
    )
  }

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Never'
    const date = new Date(lastSeen)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <ul className="divide-y">
      {devices.map((device) => (
        <li key={device.publicKey} className="py-3 flex items-center justify-between">
          <div>
            <p className="font-medium">{device.deviceName}</p>
            <p className="text-xs text-gray-500">
              Last seen: {formatLastSeen(device.lastSeen)}
            </p>
          </div>
          <button
            onClick={() => onRemove(device.publicKey)}
            className="text-red-600 text-sm hover:underline"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  )
}
```

**Step 2: Create device settings component**

```typescript
// src/components/sync/DeviceSettings.tsx
'use client'

import { useState, useEffect } from 'react'
import { PairingModal } from './PairingModal'
import { PairedDevicesList } from './PairedDevicesList'
import {
  getOrCreateIdentity,
  updateDeviceName,
  getPairedDevices,
  removePairedDevice
} from '@/services/device-identity'
import type { DeviceIdentity, PairedDevice } from '@/types/sync'

export function DeviceSettings() {
  const [identity, setIdentity] = useState<DeviceIdentity | null>(null)
  const [devices, setDevices] = useState<PairedDevice[]>([])
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [showPairing, setShowPairing] = useState(false)

  useEffect(() => {
    setIdentity(getOrCreateIdentity())
    setDevices(getPairedDevices())
  }, [])

  const handleSaveName = () => {
    if (newName.trim()) {
      const updated = updateDeviceName(newName.trim())
      if (updated) setIdentity(updated)
    }
    setEditingName(false)
  }

  const handleRemoveDevice = (publicKey: string) => {
    removePairedDevice(publicKey)
    setDevices(getPairedDevices())
  }

  const handlePaired = (device: PairedDevice) => {
    setDevices(getPairedDevices())
    setShowPairing(false)
  }

  if (!identity) return null

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-medium mb-2">This Device</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          {editingName ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 px-3 py-1 border rounded"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Save
              </button>
              <button
                onClick={() => setEditingName(false)}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="font-medium">{identity.deviceName}</span>
              <button
                onClick={() => {
                  setNewName(identity.deviceName)
                  setEditingName(true)
                }}
                className="text-blue-600 text-sm hover:underline"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium">Paired Devices</h3>
          <button
            onClick={() => setShowPairing(true)}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded"
          >
            Add Device
          </button>
        </div>
        <PairedDevicesList
          devices={devices}
          onRemove={handleRemoveDevice}
        />
      </section>

      <PairingModal
        open={showPairing}
        onClose={() => setShowPairing(false)}
        onPaired={handlePaired}
      />
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/sync/DeviceSettings.tsx src/components/sync/PairedDevicesList.tsx
git commit -m "feat(sync): add device settings UI"
```

---

## Phase 3: P2P Connection

### Task 12: Research mDNS Browser Support

**Model:** sonnet (research)

**Files:**
- Create: `docs/research/mdns-browser-support.md`

**Step 1: Research and document findings**

This task requires web research on mDNS/Bonjour support in browsers. Key findings to document:
- Browser native support (none currently)
- Workarounds: WebRTC local candidates leak local IPs
- Alternative: Use service worker with Background Sync
- PWA limitations on iOS

**Step 2: Commit research doc**

```bash
git add docs/research/mdns-browser-support.md
git commit -m "docs: research mDNS browser support options"
```

---

### Task 13: Implement Local Discovery Service

**Model:** sonnet (networking)

**Files:**
- Create: `src/services/local-discovery.ts`
- Test: `src/__tests__/services/local-discovery.test.ts`

Note: Since browsers don't support mDNS directly, we'll use a WebRTC-based discovery mechanism where devices broadcast on a local "discovery channel" using their truncated public key.

**Step 1: Write failing test**

```typescript
// src/__tests__/services/local-discovery.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Local Discovery Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('announces device presence', async () => {
    const { LocalDiscovery } = await import('@/services/local-discovery')

    const discovery = new LocalDiscovery('test-public-key', 'Test Device')

    expect(discovery.isAnnouncing()).toBe(false)
    discovery.startAnnouncing()
    expect(discovery.isAnnouncing()).toBe(true)
    discovery.stopAnnouncing()
    expect(discovery.isAnnouncing()).toBe(false)
  })

  it('emits event when peer discovered', async () => {
    const { LocalDiscovery } = await import('@/services/local-discovery')

    const discovery = new LocalDiscovery('my-key', 'My Device')
    const onDiscover = vi.fn()

    discovery.on('peer-discovered', onDiscover)

    // Simulate peer discovery
    discovery.simulatePeerDiscovery({
      truncatedKey: 'peer-key-truncat',
      deviceName: 'Peer Device'
    })

    expect(onDiscover).toHaveBeenCalledWith(expect.objectContaining({
      truncatedKey: 'peer-key-truncat',
      deviceName: 'Peer Device'
    }))
  })
})
```

**Step 2: Run test**

Run: `npm run test:unit -- src/__tests__/services/local-discovery.test.ts`
Expected: FAIL

**Step 3: Implement local discovery**

```typescript
// src/services/local-discovery.ts
import { EventEmitter } from 'events'
import { getTruncatedPublicKey } from './device-identity'
import { logger } from '@/lib/logger'

export interface DiscoveredPeer {
  truncatedKey: string
  deviceName: string
  timestamp: number
}

/**
 * Local network discovery service
 *
 * Since browsers don't support mDNS directly, this uses BroadcastChannel
 * for same-origin discovery (multi-tab) and will integrate with WebRTC
 * for cross-device discovery on the same network.
 */
export class LocalDiscovery extends EventEmitter {
  private publicKey: string
  private deviceName: string
  private truncatedKey: string
  private announcing = false
  private broadcastChannel: BroadcastChannel | null = null
  private announceInterval: NodeJS.Timeout | null = null
  private discoveredPeers = new Map<string, DiscoveredPeer>()

  private static readonly CHANNEL_NAME = 'bonnieplot-discovery'
  private static readonly ANNOUNCE_INTERVAL_MS = 5000
  private static readonly PEER_TIMEOUT_MS = 15000

  constructor(publicKey: string, deviceName: string) {
    super()
    this.publicKey = publicKey
    this.deviceName = deviceName
    this.truncatedKey = getTruncatedPublicKey(publicKey)
  }

  isAnnouncing(): boolean {
    return this.announcing
  }

  startAnnouncing(): void {
    if (this.announcing) return

    this.announcing = true

    // Set up BroadcastChannel for same-origin tabs
    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel(LocalDiscovery.CHANNEL_NAME)
      this.broadcastChannel.onmessage = (event) => this.handleMessage(event.data)
    }

    // Start periodic announcements
    this.announce()
    this.announceInterval = setInterval(
      () => this.announce(),
      LocalDiscovery.ANNOUNCE_INTERVAL_MS
    )

    // Start cleanup of stale peers
    setInterval(() => this.cleanupStalePeers(), LocalDiscovery.PEER_TIMEOUT_MS)

    logger.info('Started local discovery')
  }

  stopAnnouncing(): void {
    this.announcing = false

    if (this.announceInterval) {
      clearInterval(this.announceInterval)
      this.announceInterval = null
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.close()
      this.broadcastChannel = null
    }

    logger.info('Stopped local discovery')
  }

  private announce(): void {
    const message = {
      type: 'announce',
      truncatedKey: this.truncatedKey,
      deviceName: this.deviceName,
      timestamp: Date.now()
    }

    this.broadcastChannel?.postMessage(message)
  }

  private handleMessage(data: unknown): void {
    if (!data || typeof data !== 'object') return

    const message = data as { type: string; truncatedKey: string; deviceName: string; timestamp: number }

    if (message.type !== 'announce') return
    if (message.truncatedKey === this.truncatedKey) return // Ignore self

    const peer: DiscoveredPeer = {
      truncatedKey: message.truncatedKey,
      deviceName: message.deviceName,
      timestamp: message.timestamp
    }

    const isNew = !this.discoveredPeers.has(peer.truncatedKey)
    this.discoveredPeers.set(peer.truncatedKey, peer)

    if (isNew) {
      this.emit('peer-discovered', peer)
      logger.info('Discovered peer', { deviceName: peer.deviceName })
    }
  }

  private cleanupStalePeers(): void {
    const now = Date.now()
    for (const [key, peer] of this.discoveredPeers) {
      if (now - peer.timestamp > LocalDiscovery.PEER_TIMEOUT_MS) {
        this.discoveredPeers.delete(key)
        this.emit('peer-lost', peer)
        logger.info('Lost peer', { deviceName: peer.deviceName })
      }
    }
  }

  getDiscoveredPeers(): DiscoveredPeer[] {
    return Array.from(this.discoveredPeers.values())
  }

  // For testing
  simulatePeerDiscovery(peer: Omit<DiscoveredPeer, 'timestamp'>): void {
    this.handleMessage({
      type: 'announce',
      ...peer,
      timestamp: Date.now()
    })
  }
}
```

**Step 4: Run test**

Run: `npm run test:unit -- src/__tests__/services/local-discovery.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/local-discovery.ts src/__tests__/services/local-discovery.test.ts
git commit -m "feat(sync): add local discovery service with BroadcastChannel"
```

---

### Task 14: Create WebRTC Connection Manager

**Model:** sonnet (networking)
**Parallel with:** Task 13

**Files:**
- Create: `src/services/webrtc-manager.ts`
- Test: `src/__tests__/services/webrtc-manager.test.ts`

**Step 1: Write failing test**

```typescript
// src/__tests__/services/webrtc-manager.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock RTCPeerConnection
class MockRTCPeerConnection {
  localDescription: RTCSessionDescription | null = null
  onicecandidate: ((event: { candidate: RTCIceCandidate | null }) => void) | null = null
  ondatachannel: ((event: { channel: RTCDataChannel }) => void) | null = null

  createDataChannel = vi.fn().mockReturnValue({
    onopen: null,
    onmessage: null,
    send: vi.fn(),
    close: vi.fn()
  })

  createOffer = vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-offer' })
  createAnswer = vi.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-answer' })
  setLocalDescription = vi.fn().mockResolvedValue(undefined)
  setRemoteDescription = vi.fn().mockResolvedValue(undefined)
  addIceCandidate = vi.fn().mockResolvedValue(undefined)
  close = vi.fn()
}

vi.stubGlobal('RTCPeerConnection', MockRTCPeerConnection)

describe('WebRTC Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates offer for initiating connection', async () => {
    const { WebRTCManager } = await import('@/services/webrtc-manager')

    const manager = new WebRTCManager()
    const offer = await manager.createOffer()

    expect(offer.type).toBe('offer')
    expect(offer.sdp).toBeDefined()
  })

  it('creates answer in response to offer', async () => {
    const { WebRTCManager } = await import('@/services/webrtc-manager')

    const manager = new WebRTCManager()
    const answer = await manager.createAnswer({ type: 'offer', sdp: 'remote-offer' })

    expect(answer.type).toBe('answer')
  })

  it('establishes data channel', async () => {
    const { WebRTCManager } = await import('@/services/webrtc-manager')

    const manager = new WebRTCManager()
    await manager.createOffer()

    expect(manager.hasDataChannel()).toBe(true)
  })
})
```

**Step 2: Run test**

Run: `npm run test:unit -- src/__tests__/services/webrtc-manager.test.ts`
Expected: FAIL

**Step 3: Implement WebRTC manager**

```typescript
// src/services/webrtc-manager.ts
import { EventEmitter } from 'events'
import { logger } from '@/lib/logger'

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
]

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate'
  sdp?: string
  candidate?: RTCIceCandidateInit
  fromPublicKey: string
}

/**
 * WebRTC connection manager for P2P data transfer
 */
export class WebRTCManager extends EventEmitter {
  private peerConnection: RTCPeerConnection | null = null
  private dataChannel: RTCDataChannel | null = null
  private pendingCandidates: RTCIceCandidateInit[] = []

  constructor() {
    super()
  }

  hasDataChannel(): boolean {
    return this.dataChannel !== null
  }

  isConnected(): boolean {
    return this.dataChannel?.readyState === 'open'
  }

  private createPeerConnection(): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit('ice-candidate', event.candidate.toJSON())
      }
    }

    pc.ondatachannel = (event) => {
      this.setupDataChannel(event.channel)
    }

    pc.onconnectionstatechange = () => {
      logger.info('WebRTC connection state', { state: pc.connectionState })
      this.emit('connection-state', pc.connectionState)
    }

    return pc
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    this.dataChannel = channel

    channel.onopen = () => {
      logger.info('Data channel opened')
      this.emit('channel-open')
    }

    channel.onmessage = (event) => {
      this.emit('message', event.data)
    }

    channel.onclose = () => {
      logger.info('Data channel closed')
      this.emit('channel-close')
    }

    channel.onerror = (error) => {
      logger.error('Data channel error', { error })
      this.emit('error', error)
    }
  }

  /**
   * Create offer to initiate connection (caller side)
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    this.peerConnection = this.createPeerConnection()

    // Create data channel before offer
    const channel = this.peerConnection.createDataChannel('sync', {
      ordered: true
    })
    this.setupDataChannel(channel)

    const offer = await this.peerConnection.createOffer()
    await this.peerConnection.setLocalDescription(offer)

    return offer
  }

  /**
   * Create answer in response to offer (callee side)
   */
  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    this.peerConnection = this.createPeerConnection()

    await this.peerConnection.setRemoteDescription(offer)

    // Apply any pending candidates
    for (const candidate of this.pendingCandidates) {
      await this.peerConnection.addIceCandidate(candidate)
    }
    this.pendingCandidates = []

    const answer = await this.peerConnection.createAnswer()
    await this.peerConnection.setLocalDescription(answer)

    return answer
  }

  /**
   * Set remote answer (caller side, after receiving answer)
   */
  async setRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('No peer connection')
    }

    await this.peerConnection.setRemoteDescription(answer)

    // Apply any pending candidates
    for (const candidate of this.pendingCandidates) {
      await this.peerConnection.addIceCandidate(candidate)
    }
    this.pendingCandidates = []
  }

  /**
   * Add ICE candidate from remote peer
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) {
      // Queue candidate until remote description is set
      this.pendingCandidates.push(candidate)
      return
    }

    await this.peerConnection.addIceCandidate(candidate)
  }

  /**
   * Send data over the channel
   */
  send(data: string | ArrayBuffer): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel not open')
    }

    this.dataChannel.send(data as string)
  }

  /**
   * Close the connection
   */
  close(): void {
    this.dataChannel?.close()
    this.peerConnection?.close()
    this.dataChannel = null
    this.peerConnection = null
  }
}
```

**Step 4: Run test**

Run: `npm run test:unit -- src/__tests__/services/webrtc-manager.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/webrtc-manager.ts src/__tests__/services/webrtc-manager.test.ts
git commit -m "feat(sync): add WebRTC connection manager"
```

---

### Task 15: Create Signaling Coordinator

**Model:** sonnet (integration)

**Files:**
- Create: `src/services/signaling-coordinator.ts`
- Test: `src/__tests__/services/signaling-coordinator.test.ts`

This coordinates discovery + WebRTC + identity verification.

**Step 1: Write failing test**

```typescript
// src/__tests__/services/signaling-coordinator.test.ts
import { describe, it, expect, vi } from 'vitest'

describe('Signaling Coordinator', () => {
  it('initiates connection when paired peer discovered', async () => {
    const { SignalingCoordinator } = await import('@/services/signaling-coordinator')

    const coordinator = new SignalingCoordinator({
      publicKey: 'my-public-key',
      deviceName: 'My Device',
      pairedDevices: [{
        publicKey: 'peer-public-key-full',
        deviceName: 'Peer',
        pairedAt: new Date().toISOString()
      }]
    })

    const onConnect = vi.fn()
    coordinator.on('peer-connecting', onConnect)

    // Simulate discovering a paired peer
    coordinator.handlePeerDiscovered({
      truncatedKey: 'peer-public-key',  // First 16 chars match
      deviceName: 'Peer',
      timestamp: Date.now()
    })

    expect(onConnect).toHaveBeenCalled()
  })

  it('ignores unpaired peers', async () => {
    const { SignalingCoordinator } = await import('@/services/signaling-coordinator')

    const coordinator = new SignalingCoordinator({
      publicKey: 'my-public-key',
      deviceName: 'My Device',
      pairedDevices: []
    })

    const onConnect = vi.fn()
    coordinator.on('peer-connecting', onConnect)

    coordinator.handlePeerDiscovered({
      truncatedKey: 'unknown-peer',
      deviceName: 'Unknown',
      timestamp: Date.now()
    })

    expect(onConnect).not.toHaveBeenCalled()
  })
})
```

**Step 2: Run test**

Run: `npm run test:unit -- src/__tests__/services/signaling-coordinator.test.ts`
Expected: FAIL

**Step 3: Implement coordinator**

```typescript
// src/services/signaling-coordinator.ts
import { EventEmitter } from 'events'
import { LocalDiscovery, DiscoveredPeer } from './local-discovery'
import { WebRTCManager } from './webrtc-manager'
import {
  signChallenge,
  verifySignature,
  getTruncatedPublicKey,
  updateDeviceLastSeen
} from './device-identity'
import type { PairedDevice } from '@/types/sync'
import { logger } from '@/lib/logger'

interface CoordinatorConfig {
  publicKey: string
  privateKey?: string
  deviceName: string
  pairedDevices: PairedDevice[]
}

/**
 * Coordinates discovery, WebRTC signaling, and identity verification
 */
export class SignalingCoordinator extends EventEmitter {
  private config: CoordinatorConfig
  private discovery: LocalDiscovery | null = null
  private connections = new Map<string, WebRTCManager>()

  constructor(config: CoordinatorConfig) {
    super()
    this.config = config
  }

  start(): void {
    this.discovery = new LocalDiscovery(this.config.publicKey, this.config.deviceName)

    this.discovery.on('peer-discovered', (peer: DiscoveredPeer) => {
      this.handlePeerDiscovered(peer)
    })

    this.discovery.on('peer-lost', (peer: DiscoveredPeer) => {
      this.handlePeerLost(peer)
    })

    this.discovery.startAnnouncing()
    logger.info('Signaling coordinator started')
  }

  stop(): void {
    this.discovery?.stopAnnouncing()
    this.connections.forEach(conn => conn.close())
    this.connections.clear()
    logger.info('Signaling coordinator stopped')
  }

  handlePeerDiscovered(peer: DiscoveredPeer): void {
    // Check if this is a paired device
    const pairedDevice = this.config.pairedDevices.find(
      d => getTruncatedPublicKey(d.publicKey) === peer.truncatedKey
    )

    if (!pairedDevice) {
      logger.debug('Ignoring unpaired peer', { truncatedKey: peer.truncatedKey })
      return
    }

    // Already connected?
    if (this.connections.has(pairedDevice.publicKey)) {
      return
    }

    this.emit('peer-connecting', pairedDevice)
    this.initiateConnection(pairedDevice)
  }

  private handlePeerLost(peer: DiscoveredPeer): void {
    const pairedDevice = this.config.pairedDevices.find(
      d => getTruncatedPublicKey(d.publicKey) === peer.truncatedKey
    )

    if (pairedDevice) {
      const connection = this.connections.get(pairedDevice.publicKey)
      if (connection) {
        connection.close()
        this.connections.delete(pairedDevice.publicKey)
        this.emit('peer-disconnected', pairedDevice)
      }
    }
  }

  private async initiateConnection(peer: PairedDevice): Promise<void> {
    const manager = new WebRTCManager()
    this.connections.set(peer.publicKey, manager)

    manager.on('channel-open', () => {
      this.authenticatePeer(peer, manager)
    })

    manager.on('message', (data: string) => {
      this.handleMessage(peer, data)
    })

    manager.on('channel-close', () => {
      this.connections.delete(peer.publicKey)
      this.emit('peer-disconnected', peer)
    })

    try {
      const offer = await manager.createOffer()

      // In a real implementation, we'd exchange this via the discovery channel
      // For now, emit for the signaling layer to handle
      this.emit('signaling-offer', {
        toPeer: peer,
        offer
      })
    } catch (error) {
      logger.error('Failed to create offer', { error })
      this.connections.delete(peer.publicKey)
    }
  }

  private async authenticatePeer(peer: PairedDevice, manager: WebRTCManager): Promise<void> {
    // Generate random challenge
    const challenge = crypto.randomUUID()

    manager.send(JSON.stringify({
      type: 'auth-challenge',
      challenge
    }))

    // Wait for response (handled in handleMessage)
  }

  private handleMessage(peer: PairedDevice, data: string): void {
    try {
      const message = JSON.parse(data)

      switch (message.type) {
        case 'auth-challenge':
          this.handleAuthChallenge(peer, message.challenge)
          break
        case 'auth-response':
          this.handleAuthResponse(peer, message)
          break
        case 'sync':
          // Forward to Yjs sync layer
          this.emit('sync-message', { peer, data: message.data })
          break
        default:
          logger.warn('Unknown message type', { type: message.type })
      }
    } catch (error) {
      logger.error('Failed to handle message', { error })
    }
  }

  private handleAuthChallenge(peer: PairedDevice, challenge: string): void {
    if (!this.config.privateKey) {
      logger.error('No private key for signing')
      return
    }

    const signature = signChallenge(challenge, this.config.privateKey)
    const manager = this.connections.get(peer.publicKey)

    manager?.send(JSON.stringify({
      type: 'auth-response',
      challenge,
      signature,
      publicKey: this.config.publicKey
    }))
  }

  private handleAuthResponse(peer: PairedDevice, message: { challenge: string; signature: string; publicKey: string }): void {
    const valid = verifySignature(message.challenge, message.signature, peer.publicKey)

    if (valid) {
      updateDeviceLastSeen(peer.publicKey)
      this.emit('peer-authenticated', peer)
      logger.info('Peer authenticated', { deviceName: peer.deviceName })
    } else {
      logger.warn('Peer authentication failed', { deviceName: peer.deviceName })
      const manager = this.connections.get(peer.publicKey)
      manager?.close()
      this.connections.delete(peer.publicKey)
    }
  }

  /**
   * Send sync message to a peer
   */
  sendSyncMessage(peerPublicKey: string, data: Uint8Array): void {
    const manager = this.connections.get(peerPublicKey)
    if (!manager?.isConnected()) {
      logger.warn('Cannot send - peer not connected')
      return
    }

    manager.send(JSON.stringify({
      type: 'sync',
      data: Array.from(data)
    }))
  }

  getConnectedPeers(): PairedDevice[] {
    return this.config.pairedDevices.filter(
      d => this.connections.get(d.publicKey)?.isConnected()
    )
  }
}
```

**Step 4: Run test**

Run: `npm run test:unit -- src/__tests__/services/signaling-coordinator.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/signaling-coordinator.ts src/__tests__/services/signaling-coordinator.test.ts
git commit -m "feat(sync): add signaling coordinator for P2P connections"
```

---

### Task 16: Wire Yjs Sync Over WebRTC

**Model:** sonnet (integration)
**Depends on:** Tasks 3-5, 14-15

**Files:**
- Create: `src/services/yjs-sync-provider.ts`
- Test: `src/__tests__/services/yjs-sync-provider.test.ts`

**Step 1: Write failing test**

```typescript
// src/__tests__/services/yjs-sync-provider.test.ts
import { describe, it, expect, vi } from 'vitest'
import * as Y from 'yjs'

describe('Yjs Sync Provider', () => {
  it('syncs updates between two Y.Docs', async () => {
    const { YjsSyncProvider } = await import('@/services/yjs-sync-provider')

    const doc1 = new Y.Doc()
    const doc2 = new Y.Doc()

    // Simulate two providers connected via mock transport
    const messages1to2: Uint8Array[] = []
    const messages2to1: Uint8Array[] = []

    const provider1 = new YjsSyncProvider(doc1, {
      send: (data) => messages1to2.push(data),
      onReceive: (handler) => {
        // Will be called when messages2to1 has data
      }
    })

    const provider2 = new YjsSyncProvider(doc2, {
      send: (data) => messages2to1.push(data),
      onReceive: (handler) => {}
    })

    // Make change on doc1
    doc1.getMap('test').set('key', 'value')

    // Process sync
    provider1.startSync()

    // Forward messages
    while (messages1to2.length > 0) {
      const msg = messages1to2.shift()!
      provider2.receiveMessage(msg)
    }

    while (messages2to1.length > 0) {
      const msg = messages2to1.shift()!
      provider1.receiveMessage(msg)
    }

    // Verify sync
    expect(doc2.getMap('test').get('key')).toBe('value')
  })
})
```

**Step 2: Run test**

Run: `npm run test:unit -- src/__tests__/services/yjs-sync-provider.test.ts`
Expected: FAIL

**Step 3: Implement sync provider**

```typescript
// src/services/yjs-sync-provider.ts
import * as Y from 'yjs'
import * as syncProtocol from 'yjs/dist/src/protocols/sync'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import { logger } from '@/lib/logger'

interface Transport {
  send: (data: Uint8Array) => void
  onReceive: (handler: (data: Uint8Array) => void) => void
}

/**
 * Yjs sync provider for WebRTC transport
 */
export class YjsSyncProvider {
  private doc: Y.Doc
  private transport: Transport
  private synced = false

  constructor(doc: Y.Doc, transport: Transport) {
    this.doc = doc
    this.transport = transport

    // Listen for local updates
    doc.on('update', (update: Uint8Array, origin: unknown) => {
      if (origin !== 'remote') {
        this.broadcastUpdate(update)
      }
    })

    // Set up receive handler
    transport.onReceive((data) => this.receiveMessage(data))
  }

  /**
   * Start sync by sending state vector
   */
  startSync(): void {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, 0) // Message type: sync step 1
    syncProtocol.writeSyncStep1(encoder, this.doc)
    this.transport.send(encoding.toUint8Array(encoder))

    logger.info('Started Yjs sync')
  }

  /**
   * Receive and process sync message
   */
  receiveMessage(data: Uint8Array): void {
    const decoder = decoding.createDecoder(data)
    const messageType = decoding.readVarUint(decoder)

    switch (messageType) {
      case 0: // Sync step 1 (state vector)
        this.handleSyncStep1(decoder)
        break
      case 1: // Sync step 2 (diff)
        this.handleSyncStep2(decoder)
        break
      case 2: // Update
        this.handleUpdate(decoder)
        break
      default:
        logger.warn('Unknown sync message type', { messageType })
    }
  }

  private handleSyncStep1(decoder: decoding.Decoder): void {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, 1) // Message type: sync step 2
    syncProtocol.readSyncStep1(decoder, encoder, this.doc)
    this.transport.send(encoding.toUint8Array(encoder))

    // Also send our state vector
    const encoder2 = encoding.createEncoder()
    encoding.writeVarUint(encoder2, 0)
    syncProtocol.writeSyncStep1(encoder2, this.doc)
    this.transport.send(encoding.toUint8Array(encoder2))
  }

  private handleSyncStep2(decoder: decoding.Decoder): void {
    syncProtocol.readSyncStep2(decoder, this.doc, 'remote')

    if (!this.synced) {
      this.synced = true
      logger.info('Yjs sync complete')
    }
  }

  private handleUpdate(decoder: decoding.Decoder): void {
    const update = decoding.readVarUint8Array(decoder)
    Y.applyUpdate(this.doc, update, 'remote')
  }

  private broadcastUpdate(update: Uint8Array): void {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, 2) // Message type: update
    encoding.writeVarUint8Array(encoder, update)
    this.transport.send(encoding.toUint8Array(encoder))
  }

  isSynced(): boolean {
    return this.synced
  }
}
```

**Step 4: Run test**

Run: `npm run test:unit -- src/__tests__/services/yjs-sync-provider.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/yjs-sync-provider.ts src/__tests__/services/yjs-sync-provider.test.ts
git commit -m "feat(sync): add Yjs sync provider for WebRTC transport"
```

---

## Phase 4: Polish

### Task 17: Create Sync Status Hook

**Model:** sonnet (React)
**Parallel with:** Task 18

**Files:**
- Create: `src/hooks/useSync.ts`
- Test: `src/__tests__/hooks/useSync.test.ts`

**Step 1: Write the hook**

```typescript
// src/hooks/useSync.ts
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import type { SyncStatus, SyncEvent, PairedDevice } from '@/types/sync'
import { createYDoc, initializeYDoc, createPersistence, waitForSync } from '@/services/ydoc-manager'
import { yDocToAllotment, allotmentToYDoc } from '@/services/ydoc-converter'
import { migrateToYDoc } from '@/services/ydoc-migration'
import { SignalingCoordinator } from '@/services/signaling-coordinator'
import { YjsSyncProvider } from '@/services/yjs-sync-provider'
import { getOrCreateIdentity, loadIdentity, getPairedDevices } from '@/services/device-identity'
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

  const [status, setStatus] = useState<SyncStatus>({
    state: 'disconnected',
    connectedPeers: [],
    pendingChanges: 0
  })
  const [events, setEvents] = useState<SyncEvent[]>([])
  const [ydoc, setYDoc] = useState<Y.Doc | null>(null)

  const coordinatorRef = useRef<SignalingCoordinator | null>(null)
  const persistenceRef = useRef<IndexeddbPersistence | null>(null)

  // Initialize Y.Doc and persistence
  useEffect(() => {
    if (!enabled) return

    const doc = createYDoc()
    const persistence = createPersistence(doc)
    persistenceRef.current = persistence

    // Wait for IndexedDB sync, then migrate if needed
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

  // Initialize signaling coordinator
  useEffect(() => {
    if (!ydoc || !enabled) return

    const identity = loadIdentity()
    if (!identity) return

    const pairedDevices = getPairedDevices()
    if (pairedDevices.length === 0) return

    const coordinator = new SignalingCoordinator({
      publicKey: identity.publicKey,
      privateKey: identity.privateKey,
      deviceName: identity.deviceName,
      pairedDevices
    })

    coordinatorRef.current = coordinator

    coordinator.on('peer-connecting', (peer: PairedDevice) => {
      setStatus(s => ({ ...s, state: 'connecting' }))
    })

    coordinator.on('peer-authenticated', (peer: PairedDevice) => {
      setStatus(s => ({
        ...s,
        state: 'connected',
        connectedPeers: [...s.connectedPeers, {
          publicKey: peer.publicKey,
          deviceName: peer.deviceName,
          connectionState: 'connected'
        }]
      }))

      addEvent({
        type: 'peer-connected',
        peerName: peer.deviceName,
        timestamp: new Date().toISOString()
      })
    })

    coordinator.on('peer-disconnected', (peer: PairedDevice) => {
      setStatus(s => ({
        ...s,
        connectedPeers: s.connectedPeers.filter(p => p.publicKey !== peer.publicKey),
        state: s.connectedPeers.length <= 1 ? 'disconnected' : s.state
      }))

      addEvent({
        type: 'peer-disconnected',
        peerName: peer.deviceName,
        timestamp: new Date().toISOString()
      })
    })

    coordinator.start()
    setStatus(s => ({ ...s, state: 'discovering' }))

    return () => {
      coordinator.stop()
      coordinatorRef.current = null
    }
  }, [ydoc, enabled])

  const addEvent = useCallback((event: SyncEvent) => {
    setEvents(e => [event, ...e].slice(0, 10)) // Keep last 10 events
  }, [])

  const getData = useCallback((): AllotmentData | null => {
    if (!ydoc) return null
    return yDocToAllotment(ydoc)
  }, [ydoc])

  const updateData = useCallback((updater: (data: AllotmentData) => AllotmentData) => {
    if (!ydoc) return

    const current = yDocToAllotment(ydoc)
    const updated = updater(current)

    // Clear and rewrite (simpler than diffing)
    const root = ydoc.getMap('allotment')
    ydoc.transact(() => {
      root.clear()
      allotmentToYDoc(updated, ydoc)
    })
  }, [ydoc])

  const clearEvents = useCallback(() => {
    setEvents([])
  }, [])

  return {
    status,
    events,
    ydoc,
    getData,
    updateData,
    clearEvents
  }
}
```

**Step 2: Write test**

```typescript
// src/__tests__/hooks/useSync.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// Mock dependencies
vi.mock('y-indexeddb', () => ({
  IndexeddbPersistence: vi.fn().mockImplementation(() => ({
    once: vi.fn((event, cb) => setTimeout(cb, 0)),
    destroy: vi.fn()
  }))
}))

vi.mock('@/services/device-identity', () => ({
  loadIdentity: () => null,
  getPairedDevices: () => [],
  getOrCreateIdentity: () => ({
    publicKey: 'test',
    privateKey: 'test',
    deviceName: 'Test',
    createdAt: new Date().toISOString()
  })
}))

describe('useSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with disconnected state', async () => {
    const { useSync } = await import('@/hooks/useSync')
    const { result } = renderHook(() => useSync())

    expect(result.current.status.state).toBe('disconnected')
  })

  it('can be disabled', async () => {
    const { useSync } = await import('@/hooks/useSync')
    const { result } = renderHook(() => useSync({ enabled: false }))

    expect(result.current.ydoc).toBeNull()
  })
})
```

**Step 3: Run test**

Run: `npm run test:unit -- src/__tests__/hooks/useSync.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add src/hooks/useSync.ts src/__tests__/hooks/useSync.test.ts
git commit -m "feat(sync): add useSync hook for sync state management"
```

---

### Task 18: Create Sync Status Indicator Component

**Model:** haiku (simple component)
**Parallel with:** Task 17

**Files:**
- Create: `src/components/sync/SyncStatusIndicator.tsx`

**Step 1: Create component**

```typescript
// src/components/sync/SyncStatusIndicator.tsx
'use client'

import type { SyncStatus } from '@/types/sync'

interface SyncStatusIndicatorProps {
  status: SyncStatus
  onClick?: () => void
}

export function SyncStatusIndicator({ status, onClick }: SyncStatusIndicatorProps) {
  const getStatusColor = () => {
    switch (status.state) {
      case 'disconnected':
        return 'bg-gray-400'
      case 'discovering':
      case 'connecting':
        return 'bg-blue-400 animate-pulse'
      case 'connected':
      case 'syncing':
        return 'bg-green-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusText = () => {
    switch (status.state) {
      case 'disconnected':
        return 'Not syncing'
      case 'discovering':
        return 'Looking for devices...'
      case 'connecting':
        return 'Connecting...'
      case 'connected':
        return status.connectedPeers.length === 1
          ? `Connected to ${status.connectedPeers[0].deviceName}`
          : `Connected to ${status.connectedPeers.length} devices`
      case 'syncing':
        return 'Syncing...'
      default:
        return ''
    }
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
      title={getStatusText()}
    >
      <span className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-xs text-gray-600 hidden sm:inline">
        {status.state === 'connected' && status.connectedPeers.length > 0
          ? status.connectedPeers[0].deviceName
          : null}
      </span>
    </button>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/sync/SyncStatusIndicator.tsx
git commit -m "feat(sync): add sync status indicator component"
```

---

### Task 19: Create Sync Toast Component

**Model:** haiku (simple component)

**Files:**
- Create: `src/components/sync/SyncToast.tsx`

**Step 1: Create component**

```typescript
// src/components/sync/SyncToast.tsx
'use client'

import { useEffect, useState } from 'react'
import type { SyncEvent } from '@/types/sync'

interface SyncToastProps {
  event: SyncEvent | null
  onDismiss: () => void
}

export function SyncToast({ event, onDismiss }: SyncToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (event) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(onDismiss, 300) // Wait for fade out
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [event, onDismiss])

  if (!event) return null

  const getMessage = () => {
    switch (event.type) {
      case 'sync-complete':
        return `Synced with ${event.peerName} · ${event.changeCount} changes`
      case 'peer-connected':
        return `Connected to ${event.peerName}`
      case 'peer-disconnected':
        return `${event.peerName} disconnected`
      case 'error':
        return `Sync error: ${event.error}`
      default:
        return ''
    }
  }

  const getIcon = () => {
    switch (event.type) {
      case 'sync-complete':
        return '✓'
      case 'peer-connected':
        return '🔗'
      case 'peer-disconnected':
        return '🔌'
      case 'error':
        return '⚠️'
      default:
        return ''
    }
  }

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <span>{getIcon()}</span>
      <span className="text-sm">{getMessage()}</span>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/sync/SyncToast.tsx
git commit -m "feat(sync): add sync toast notification component"
```

---

### Task 20: Add Integration and E2E Tests

**Model:** sonnet (testing)
**Depends on:** All previous tasks

**Files:**
- Create: `tests/sync.spec.ts`
- Modify: `src/__tests__/integration/sync.test.ts`

**Step 1: Create E2E test**

```typescript
// tests/sync.spec.ts
import { test, expect } from '@playwright/test'

test.describe('P2P Sync', () => {
  test('shows device settings in settings page', async ({ page }) => {
    await page.goto('/settings')

    await expect(page.getByText('This Device')).toBeVisible()
    await expect(page.getByText('Paired Devices')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Device' })).toBeVisible()
  })

  test('opens pairing modal', async ({ page }) => {
    await page.goto('/settings')

    await page.getByRole('button', { name: 'Add Device' }).click()

    await expect(page.getByText('Show QR Code')).toBeVisible()
    await expect(page.getByText('Scan QR Code')).toBeVisible()
  })

  test('shows QR code with confirmation code', async ({ page }) => {
    await page.goto('/settings')

    await page.getByRole('button', { name: 'Add Device' }).click()
    await page.getByText('Show QR Code').click()

    await expect(page.getByText('Confirmation code:')).toBeVisible()
    // Should show 6-digit code formatted as "XXX XXX"
    await expect(page.locator('text=/\\d{3} \\d{3}/')).toBeVisible()
  })

  test('sync status indicator is visible', async ({ page }) => {
    await page.goto('/')

    // Should show sync status (gray dot when disconnected)
    await expect(page.locator('[title*="sync"], [title*="Sync"], [title="Not syncing"]')).toBeVisible()
  })
})
```

**Step 2: Create integration test**

```typescript
// src/__tests__/integration/sync.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as Y from 'yjs'

describe('Sync Integration', () => {
  it('syncs data between two Y.Docs via mock transport', async () => {
    const { allotmentToYDoc, yDocToAllotment } = await import('@/services/ydoc-converter')
    const { YjsSyncProvider } = await import('@/services/yjs-sync-provider')

    // Create two docs
    const doc1 = new Y.Doc()
    const doc2 = new Y.Doc()

    // Mock bidirectional transport
    let handler1: ((data: Uint8Array) => void) | null = null
    let handler2: ((data: Uint8Array) => void) | null = null

    const provider1 = new YjsSyncProvider(doc1, {
      send: (data) => handler2?.(data),
      onReceive: (h) => { handler1 = h }
    })

    const provider2 = new YjsSyncProvider(doc2, {
      send: (data) => handler1?.(data),
      onReceive: (h) => { handler2 = h }
    })

    // Add data to doc1
    const testData = {
      version: 16,
      currentYear: 2026,
      meta: { name: 'Test', createdAt: '2026-01-01', updatedAt: '2026-01-29' },
      layout: { areas: [{ id: 'a', name: 'Area A', kind: 'rotation-bed', canHavePlantings: true }] },
      seasons: [],
      varieties: []
    }
    allotmentToYDoc(testData, doc1)

    // Start sync
    provider1.startSync()

    // Give sync time to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify doc2 has the data
    const result = yDocToAllotment(doc2)
    expect(result.meta.name).toBe('Test')
    expect(result.layout.areas).toHaveLength(1)
  })
})
```

**Step 3: Run tests**

Run: `npm run test:unit -- src/__tests__/integration/sync.test.ts`
Run: `npx playwright test tests/sync.spec.ts`

**Step 4: Commit**

```bash
git add tests/sync.spec.ts src/__tests__/integration/sync.test.ts
git commit -m "test(sync): add integration and E2E tests"
```

---

## Final Checklist

- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] Types compile without errors
- [ ] No lint warnings
- [ ] Documentation updated (ADR exists)
- [ ] Manual testing on two devices completed
- [ ] PR created and reviewed
