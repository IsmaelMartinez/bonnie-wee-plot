# Supabase to Neon Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Supabase with Neon Serverless Postgres for cloud sync, routing all database access through Next.js API routes.

**Architecture:** The sync hook (`useSyncedStorage`) switches from calling Supabase directly via its JS client to calling `/api/sync` API routes via `fetch`. The API routes authenticate via Clerk and query Neon server-side. The `@supabase/supabase-js` dependency is removed entirely.

**Tech Stack:** `@neondatabase/serverless`, Next.js API routes, Clerk `auth()`, Vitest

**Spec:** `docs/superpowers/specs/2026-04-07-supabase-to-neon-migration-design.md`

---

### Task 1: Neon Client Module

**Files:**
- Create: `src/lib/neon/client.ts`
- Test: `src/__tests__/lib/neon-client.test.ts`

- [ ] **Step 1: Write failing tests for the Neon client**

Create `src/__tests__/lib/neon-client.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AllotmentData } from '@/types/unified-allotment'

// Mock @neondatabase/serverless
const mockQuery = vi.fn()
vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => mockQuery),
}))

const mockData: AllotmentData = {
  version: 18,
  meta: { name: 'Test', updatedAt: '2026-04-07T12:00:00Z' },
  layout: { areas: [] },
  seasons: [],
  currentYear: 2026,
  varieties: [],
} as unknown as AllotmentData

describe('Neon client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('DATABASE_URL', 'postgresql://test:test@test-pooler.neon.tech/neondb')
  })

  it('fetchAllotment returns data when row exists', async () => {
    mockQuery.mockResolvedValue([{
      data: mockData,
      updated_at: '2026-04-07T12:00:00Z',
    }])

    const { fetchAllotment } = await import('@/lib/neon/client')
    const result = await fetchAllotment('user-123')
    expect(result).toEqual({ data: mockData, updatedAt: '2026-04-07T12:00:00Z' })
    expect(mockQuery).toHaveBeenCalledWith('user-123')
  })

  it('fetchAllotment returns null when no row exists', async () => {
    mockQuery.mockResolvedValue([])

    const { fetchAllotment } = await import('@/lib/neon/client')
    const result = await fetchAllotment('user-123')
    expect(result).toBeNull()
  })

  it('upsertAllotment calls SQL with correct params', async () => {
    mockQuery.mockResolvedValue([])

    const { upsertAllotment } = await import('@/lib/neon/client')
    await upsertAllotment('user-123', mockData)
    expect(mockQuery).toHaveBeenCalledWith('user-123', mockData)
  })

  it('deleteAllotment calls SQL with correct params', async () => {
    mockQuery.mockResolvedValue([])

    const { deleteAllotment } = await import('@/lib/neon/client')
    await deleteAllotment('user-123')
    expect(mockQuery).toHaveBeenCalledWith('user-123')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/lib/neon-client.test.ts`
Expected: FAIL — module `@/lib/neon/client` does not exist.

- [ ] **Step 3: Install dependency and implement the Neon client**

Run: `npm install @neondatabase/serverless`

Create `src/lib/neon/client.ts`:

```typescript
import { neon } from '@neondatabase/serverless'
import type { AllotmentData } from '@/types/unified-allotment'

export interface RemoteAllotment {
  data: AllotmentData
  updatedAt: string
}

function getSQL() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL not configured')
  return neon(url)
}

export async function fetchAllotment(userId: string): Promise<RemoteAllotment | null> {
  const sql = getSQL()
  const rows = await sql`SELECT data, updated_at FROM allotments WHERE user_id = ${userId}`
  if (rows.length === 0) return null
  return {
    data: rows[0].data as AllotmentData,
    updatedAt: rows[0].updated_at as string,
  }
}

export async function upsertAllotment(userId: string, data: AllotmentData): Promise<void> {
  const sql = getSQL()
  await sql`
    INSERT INTO allotments (user_id, data, updated_at)
    VALUES (${userId}, ${JSON.stringify(data)}::jsonb, now())
    ON CONFLICT (user_id) DO UPDATE SET data = ${JSON.stringify(data)}::jsonb, updated_at = now()
  `
}

export async function deleteAllotment(userId: string): Promise<void> {
  const sql = getSQL()
  await sql`DELETE FROM allotments WHERE user_id = ${userId}`
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/lib/neon-client.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/neon/client.ts src/__tests__/lib/neon-client.test.ts package.json package-lock.json
git commit -m "feat: add Neon client module for cloud sync"
```

---

### Task 2: Sync API Route

**Files:**
- Create: `src/app/api/sync/route.ts`
- Test: `src/__tests__/api/sync.test.ts`

- [ ] **Step 1: Write failing tests for the sync API route**

Create `src/__tests__/api/sync.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AllotmentData } from '@/types/unified-allotment'

// Mock Clerk server auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

// Mock Neon client
vi.mock('@/lib/neon/client', () => ({
  fetchAllotment: vi.fn(),
  upsertAllotment: vi.fn(),
  deleteAllotment: vi.fn(),
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AuthReturn = any

const mockData: AllotmentData = {
  version: 18,
  meta: { name: 'Test', updatedAt: '2026-04-07T12:00:00Z' },
  layout: { areas: [] },
  seasons: [],
  currentYear: 2026,
  varieties: [],
} as unknown as AllotmentData

describe('GET /api/sync', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    vi.resetModules()
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValue({ userId: null } as AuthReturn)

    const { GET } = await import('@/app/api/sync/route')
    const response = await GET()
    expect(response.status).toBe(401)
  })

  it('returns 404 when no data exists', async () => {
    vi.resetModules()
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as AuthReturn)

    const { fetchAllotment } = await import('@/lib/neon/client')
    vi.mocked(fetchAllotment).mockResolvedValue(null)

    const { GET } = await import('@/app/api/sync/route')
    const response = await GET()
    expect(response.status).toBe(404)
  })

  it('returns allotment data when it exists', async () => {
    vi.resetModules()
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as AuthReturn)

    const { fetchAllotment } = await import('@/lib/neon/client')
    vi.mocked(fetchAllotment).mockResolvedValue({
      data: mockData,
      updatedAt: '2026-04-07T12:00:00Z',
    })

    const { GET } = await import('@/app/api/sync/route')
    const response = await GET()
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.meta.name).toBe('Test')
    expect(body.updatedAt).toBe('2026-04-07T12:00:00Z')
  })
})

describe('PUT /api/sync', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    vi.resetModules()
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValue({ userId: null } as AuthReturn)

    const { PUT } = await import('@/app/api/sync/route')
    const request = new Request('http://localhost/api/sync', {
      method: 'PUT',
      body: JSON.stringify({ data: mockData }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PUT(request)
    expect(response.status).toBe(401)
  })

  it('upserts data and returns 200', async () => {
    vi.resetModules()
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as AuthReturn)

    const { upsertAllotment } = await import('@/lib/neon/client')
    vi.mocked(upsertAllotment).mockResolvedValue(undefined)

    const { PUT } = await import('@/app/api/sync/route')
    const request = new Request('http://localhost/api/sync', {
      method: 'PUT',
      body: JSON.stringify({ data: mockData }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PUT(request)
    expect(response.status).toBe(200)
    expect(upsertAllotment).toHaveBeenCalledWith('user-123', mockData)
  })
})

describe('DELETE /api/sync', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    vi.resetModules()
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValue({ userId: null } as AuthReturn)

    const { DELETE } = await import('@/app/api/sync/route')
    const response = await DELETE()
    expect(response.status).toBe(401)
  })

  it('deletes data and returns 200', async () => {
    vi.resetModules()
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as AuthReturn)

    const { deleteAllotment } = await import('@/lib/neon/client')
    vi.mocked(deleteAllotment).mockResolvedValue(undefined)

    const { DELETE } = await import('@/app/api/sync/route')
    const response = await DELETE()
    expect(response.status).toBe(200)
    expect(deleteAllotment).toHaveBeenCalledWith('user-123')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/api/sync.test.ts`
Expected: FAIL — module `@/app/api/sync/route` does not exist.

- [ ] **Step 3: Implement the sync API route**

Create `src/app/api/sync/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { fetchAllotment, upsertAllotment, deleteAllotment } from '@/lib/neon/client'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await fetchAllotment(userId)
    if (!result) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 })
    }
    return NextResponse.json({ data: result.data, updatedAt: result.updatedAt })
  } catch (err) {
    console.error('[/api/sync] Fetch failed:', err)
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data } = await request.json()
    await upsertAllotment(userId, data)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/sync] Upsert failed:', err)
    return NextResponse.json({ error: 'Upsert failed' }, { status: 500 })
  }
}

export async function DELETE() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await deleteAllotment(userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/sync] Delete failed:', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/api/sync.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/sync/route.ts src/__tests__/api/sync.test.ts
git commit -m "feat: add /api/sync route for Neon cloud sync"
```

---

### Task 3: Sync Client Module

**Files:**
- Create: `src/lib/sync-client.ts`
- Test: `src/__tests__/lib/sync-client.test.ts`

- [ ] **Step 1: Write failing tests for the sync client**

Create `src/__tests__/lib/sync-client.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AllotmentData } from '@/types/unified-allotment'

const mockData: AllotmentData = {
  version: 18,
  meta: { name: 'Test', updatedAt: '2026-04-07T12:00:00Z' },
  layout: { areas: [] },
  seasons: [],
  currentYear: 2026,
  varieties: [],
} as unknown as AllotmentData

describe('sync-client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetchRemote returns data on 200', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockData, updatedAt: '2026-04-07T12:00:00Z' }),
    })

    const { fetchRemote } = await import('@/lib/sync-client')
    const result = await fetchRemote()
    expect(result).toEqual({ data: mockData, updatedAt: '2026-04-07T12:00:00Z' })
    expect(fetch).toHaveBeenCalledWith('/api/sync')
  })

  it('fetchRemote returns null on 404', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    })

    const { fetchRemote } = await import('@/lib/sync-client')
    const result = await fetchRemote()
    expect(result).toBeNull()
  })

  it('fetchRemote throws on other errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    })

    const { fetchRemote } = await import('@/lib/sync-client')
    await expect(fetchRemote()).rejects.toThrow('Sync fetch failed (500)')
  })

  it('pushToRemote sends PUT with data', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true })

    const { pushToRemote } = await import('@/lib/sync-client')
    await pushToRemote(mockData)
    expect(fetch).toHaveBeenCalledWith('/api/sync', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: mockData }),
    })
  })

  it('pushToRemote throws on failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })

    const { pushToRemote } = await import('@/lib/sync-client')
    await expect(pushToRemote(mockData)).rejects.toThrow('Sync push failed (500)')
  })

  it('deleteRemote sends DELETE', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true })

    const { deleteRemote } = await import('@/lib/sync-client')
    await deleteRemote()
    expect(fetch).toHaveBeenCalledWith('/api/sync', { method: 'DELETE' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/lib/sync-client.test.ts`
Expected: FAIL — module `@/lib/sync-client` does not exist.

- [ ] **Step 3: Implement the sync client**

Create `src/lib/sync-client.ts`:

```typescript
import type { AllotmentData } from '@/types/unified-allotment'

export interface RemoteData {
  data: AllotmentData
  updatedAt: string
}

export async function fetchRemote(): Promise<RemoteData | null> {
  const res = await fetch('/api/sync')
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Sync fetch failed (${res.status})`)
  return res.json()
}

export async function pushToRemote(data: AllotmentData): Promise<void> {
  const res = await fetch('/api/sync', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  })
  if (!res.ok) throw new Error(`Sync push failed (${res.status})`)
}

export async function deleteRemote(): Promise<void> {
  const res = await fetch('/api/sync', { method: 'DELETE' })
  if (!res.ok) throw new Error(`Sync delete failed (${res.status})`)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/lib/sync-client.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/sync-client.ts src/__tests__/lib/sync-client.test.ts
git commit -m "feat: add sync-client fetch wrappers for /api/sync"
```

---

### Task 4: Rewire useSyncedStorage Hook

**Files:**
- Modify: `src/hooks/useSyncedStorage.ts`
- Modify: `src/__tests__/hooks/useSyncedStorage.test.ts`

- [ ] **Step 1: Update the test mocks**

In `src/__tests__/hooks/useSyncedStorage.test.ts`, replace the Supabase mocks (lines 19-31) with:

```typescript
// Mock sync client
const mockFetchRemote = vi.fn()
const mockPushToRemote = vi.fn()
vi.mock('@/lib/sync-client', () => ({
  fetchRemote: (...args: unknown[]) => mockFetchRemote(...args),
  pushToRemote: (...args: unknown[]) => mockPushToRemote(...args),
}))
```

Remove the mock for `@/lib/supabase/client` entirely (lines 28-30 in original):

```typescript
// DELETE THIS BLOCK:
// vi.mock('@/lib/supabase/client', () => ({
//   isSupabaseConfigured: vi.fn(() => true),
// }))
```

- [ ] **Step 2: Update test assertions that reference `token` parameter**

The new `pushToRemote` and `fetchRemote` no longer take `token` and `userId` parameters. Update these assertions:

Line 147: `expect(mockPushToRemote).toHaveBeenCalledWith('test-token', 'user-123', localData)` becomes `expect(mockPushToRemote).toHaveBeenCalledWith(localData)`

Line 237: `expect(mockPushToRemote).toHaveBeenCalledWith('test-token', 'user-123', localData)` becomes `expect(mockPushToRemote).toHaveBeenCalledWith(localData)`

Line 329: `expect(mockPushToRemote).toHaveBeenCalledWith('test-token', 'user-123', localData)` becomes `expect(mockPushToRemote).toHaveBeenCalledWith(localData)`

Line 379-380:
```
expect(mockPushToRemote).not.toHaveBeenCalledWith('test-token', 'user-123', localData)
expect(mockPushToRemote).toHaveBeenCalledWith('test-token', 'user-456', localData)
```
becomes:
```
expect(mockPushToRemote).toHaveBeenCalledWith(localData)
```

Remove `mockGetToken` from `beforeEach` (line 102): delete `mockGetToken.mockResolvedValue('test-token')`

The `mockGetToken` variable (line 9) and `getToken` in the `useOptionalAuth` mock can remain since `useOptionalAuth` still returns `getToken` in its interface — it's just no longer called by the sync hook.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/hooks/useSyncedStorage.test.ts`
Expected: FAIL — tests still import `@/lib/supabase/sync` from the hook source.

- [ ] **Step 4: Update the useSyncedStorage hook**

In `src/hooks/useSyncedStorage.ts`:

Replace imports (lines 14-21):

```typescript
import { useState, useEffect, useRef, useCallback } from 'react'
import { useOptionalAuth } from './useOptionalAuth'
import { usePersistedStorage, UsePersistedStorageOptions, UsePersistedStorageReturn } from './usePersistedStorage'
import { useNetworkStatus } from './useNetworkStatus'
import { fetchRemote, pushToRemote } from '@/lib/sync-client'
import type { AllotmentData } from '@/types/unified-allotment'
import type { SyncStatus } from '@/types/storage'
```

Replace line 72 — remove `getToken` from destructuring:

```typescript
  const { userId, isSignedIn } = useOptionalAuth()
```

Replace line 85:

```typescript
  const canSync = isSignedIn && isOnline
```

Remove the `getSupabaseToken` function entirely (lines 101-109).

Update the `resolveConflict` callback (lines 112-138) — remove `token` usage:

```typescript
  const resolveConflict = useCallback(async (choice: 'cloud' | 'local') => {
    const conflict = syncConflict
    if (!conflict || !userId) return

    const syncUserId = userId

    if (choice === 'cloud') {
      applyRemoteSnapshot(conflict.remote)
    } else {
      try {
        if (!isStaleSyncUser(syncUserId)) {
          await pushToRemote(conflict.local)
          lastPushedRef.current = JSON.stringify(conflict.local)
        }
      } catch (err) {
        console.error('[useSyncedStorage] Failed to push after conflict resolution:', err)
      }
    }

    markSynced(syncUserId)
    setSyncConflict(null)
    setSyncStatus('synced')
    setSyncError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncConflict, userId])
```

Update `doInitialSync` (lines 156-243) — remove token logic:

```typescript
    const doInitialSync = async () => {
      try {
        setSyncStatus('syncing')
        if (isStaleSyncUser(syncUserId)) return

        const remote = await fetchRemote()
        if (isStaleSyncUser(syncUserId)) return

        if (!remote) {
          await pushToRemote(local.data!)
          if (isStaleSyncUser(syncUserId)) return
          lastPushedRef.current = JSON.stringify(local.data)
          markSynced(syncUserId)
          setSyncStatus('synced')
          setSyncError(null)
          return
        }

        const localData = local.data!
        const flag = getSyncFlag(syncUserId)
        const isFirstSync = !flag

        if (isFirstSync) {
          applyRemoteSnapshot(remote.data)
          markSynced(syncUserId)
          setSyncStatus('synced')
          setSyncError(null)
          return
        }

        const localTime = toTimestamp(localData.meta?.updatedAt)
        const remoteTime = toTimestamp(remote.updatedAt)
        const lastSyncTime = toTimestamp(flag.lastSyncedAt)

        const localChanged = localTime > lastSyncTime
        const remoteChanged = remoteTime > lastSyncTime

        if (localChanged && remoteChanged) {
          setSyncConflict({
            local: localData,
            remote: remote.data,
            remoteUpdatedAt: remote.updatedAt,
          })
          setSyncStatus('conflict')
          return
        }

        if (remoteChanged || remoteTime > localTime) {
          applyRemoteSnapshot(remote.data)
        } else if (localChanged || localTime > remoteTime) {
          await pushToRemote(local.data!)
          if (isStaleSyncUser(syncUserId)) return
          lastPushedRef.current = JSON.stringify(local.data)
        } else {
          lastPushedRef.current = JSON.stringify(local.data)
        }

        markSynced(syncUserId)
        setSyncStatus('synced')
        setSyncError(null)
      } catch (err) {
        if (isStaleSyncUser(syncUserId)) return
        console.error('[useSyncedStorage] Initial sync failed:', err)
        setSyncStatus('error')
        setSyncError(err instanceof Error ? err.message : 'Sync failed')
      } finally {
        if (syncInProgressUserRef.current === syncUserId) {
          syncInProgressRef.current = false
          syncInProgressUserRef.current = null
        }
        if (!isStaleSyncUser(syncUserId)) {
          initialSyncDoneRef.current = true
        }
      }
    }
```

Update `pushAsync` (lines 267-287) — remove token logic:

```typescript
    const pushAsync = async () => {
      const syncUserId = userId
      try {
        setSyncStatus('syncing')
        if (isStaleSyncUser(syncUserId)) return

        await pushToRemote(local.data!)
        if (isStaleSyncUser(syncUserId)) return
        lastPushedRef.current = serialized
        markSynced(syncUserId)
        setSyncStatus('synced')
        setSyncError(null)
      } catch (err) {
        if (isStaleSyncUser(syncUserId)) return
        console.error('[useSyncedStorage] Push failed:', err)
        setSyncStatus('error')
        setSyncError(err instanceof Error ? err.message : 'Sync failed')
      }
    }
```

Update `resync` (lines 298-347) — remove token logic:

```typescript
    const resync = async () => {
      try {
        setSyncStatus('syncing')
        if (isStaleSyncUser(syncUserId)) return

        const remote = await fetchRemote()
        if (isStaleSyncUser(syncUserId)) return
        if (!remote) {
          await pushToRemote(local.data!)
          if (isStaleSyncUser(syncUserId)) return
          lastPushedRef.current = JSON.stringify(local.data)
        } else {
          const localData = local.data!
          const localTime = toTimestamp(localData.meta?.updatedAt)
          const remoteTime = toTimestamp(remote.updatedAt)
          const flag = getSyncFlag(syncUserId)
          const lastSyncTime = flag ? toTimestamp(flag.lastSyncedAt) : 0

          const localChanged = localTime > lastSyncTime
          const remoteChanged = remoteTime > lastSyncTime

          if (localChanged && remoteChanged) {
            setSyncConflict({
              local: localData,
              remote: remote.data,
              remoteUpdatedAt: remote.updatedAt,
            })
            setSyncStatus('conflict')
            return
          }

          if (remoteChanged || remoteTime > localTime) {
            applyRemoteSnapshot(remote.data)
          } else {
            await pushToRemote(local.data!)
            if (isStaleSyncUser(syncUserId)) return
            lastPushedRef.current = JSON.stringify(local.data)
          }
        }
        markSynced(syncUserId)
        setSyncStatus('synced')
        setSyncError(null)
      } catch (err) {
        if (isStaleSyncUser(syncUserId)) return
        setSyncStatus('error')
        setSyncError(err instanceof Error ? err.message : 'Sync failed')
      }
    }
```

Update the status effect (lines 354-363):

```typescript
  useEffect(() => {
    if (!isSignedIn) {
      setSyncStatus('disabled')
      syncInProgressRef.current = false
      initialSyncDoneRef.current = false
    } else if (!isOnline) {
      setSyncStatus('offline')
      syncInProgressRef.current = false
    }
  }, [isSignedIn, isOnline])
```

Update the JSDoc comment at the top (lines 3-12) to reference Neon instead of Supabase:

```typescript
/**
 * useSyncedStorage Hook
 *
 * Wraps usePersistedStorage with cloud sync via /api/sync when authenticated.
 * localStorage always stays active as the offline cache.
 * When signed in, changes are pushed to the cloud asynchronously.
 * On load, cloud data is fetched and reconciled:
 *  - First sync for a device/user: cloud always wins
 *  - Subsequent syncs: LWW (last-write-wins) with conflict detection
 */
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/hooks/useSyncedStorage.test.ts`
Expected: PASS (13 tests)

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useSyncedStorage.ts src/__tests__/hooks/useSyncedStorage.test.ts
git commit -m "refactor: rewire useSyncedStorage from Supabase to /api/sync"
```

---

### Task 5: Migrate Account API Route

**Files:**
- Modify: `src/app/api/account/route.ts`
- Modify: `src/__tests__/api/account.test.ts`

- [ ] **Step 1: Update the account test mocks**

In `src/__tests__/api/account.test.ts`, replace the Supabase mocks (lines 8-17) with:

```typescript
// Mock Neon client
vi.mock('@/lib/neon/client', () => ({
  fetchAllotment: vi.fn(),
  deleteAllotment: vi.fn(),
}))
```

Update the GET test (lines 43-44):
```typescript
    const { fetchAllotment } = await import('@/lib/neon/client')
    vi.mocked(fetchAllotment).mockResolvedValue({
      data: { version: 18, meta: { name: 'Test' } } as unknown as import('@/types/unified-allotment').AllotmentData,
      updatedAt: '2026-04-07T12:00:00Z',
    })
```

Update the DELETE test (lines 78-79):
```typescript
    const { deleteAllotment } = await import('@/lib/neon/client')
    vi.mocked(deleteAllotment).mockResolvedValue(undefined)
```

Update the DELETE assertion (line 86):
```typescript
    expect(deleteAllotment).toHaveBeenCalledWith('user-123')
```

Remove `getToken` from the auth mock returns in the GET and DELETE success tests — they no longer need it. Change:
```typescript
vi.mocked(auth).mockResolvedValue({
  userId: 'user-123',
  getToken: vi.fn().mockResolvedValue('test-token'),
} as AuthReturn)
```
to:
```typescript
vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as AuthReturn)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/api/account.test.ts`
Expected: FAIL — route still imports from `@/lib/supabase/sync`.

- [ ] **Step 3: Update the account API route**

Replace `src/app/api/account/route.ts` entirely:

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { fetchAllotment, deleteAllotment } from '@/lib/neon/client'

/**
 * GET /api/account — Export user data (GDPR)
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await fetchAllotment(userId)
    if (!result) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 })
    }

    return NextResponse.json(result.data, {
      headers: {
        'Content-Disposition': 'attachment; filename="bonnie-wee-plot-export.json"',
      },
    })
  } catch (err) {
    console.error('[/api/account] Export failed:', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

/**
 * DELETE /api/account — Delete user data (GDPR)
 */
export async function DELETE() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await deleteAllotment(userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/account] Deletion failed:', err)
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/api/account.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/account/route.ts src/__tests__/api/account.test.ts
git commit -m "refactor: migrate account API route from Supabase to Neon"
```

---

### Task 6: Remove Supabase, Update CSP, Add SQL Schema

**Files:**
- Delete: `src/lib/supabase/client.ts`
- Delete: `src/lib/supabase/sync.ts`
- Delete: `src/__tests__/lib/supabase-sync.test.ts`
- Delete: `src/__tests__/lib/supabase-client.test.ts`
- Modify: `src/middleware.ts:25` (remove `https://*.supabase.co` from CSP)
- Modify: `package.json` (remove `@supabase/supabase-js`)
- Create: `sql/002-neon-allotments.sql`

- [ ] **Step 1: Delete Supabase files and tests**

```bash
rm src/lib/supabase/client.ts src/lib/supabase/sync.ts
rm src/__tests__/lib/supabase-sync.test.ts src/__tests__/lib/supabase-client.test.ts
rmdir src/lib/supabase
```

- [ ] **Step 2: Remove @supabase/supabase-js dependency**

```bash
npm uninstall @supabase/supabase-js
```

- [ ] **Step 3: Remove Supabase from CSP**

In `src/middleware.ts`, remove `'https://*.supabase.co',` from the `connect-src` array (line 25).

- [ ] **Step 4: Create the Neon SQL schema file**

Create `sql/002-neon-allotments.sql`:

```sql
-- Bonnie Wee Plot: Allotment cloud storage (Neon)
-- Run this in the Neon SQL Editor after creating the database.
-- Auth is enforced at the API route level via Clerk — no RLS needed.

CREATE TABLE allotments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_allotments_user_id ON allotments (user_id);
```

- [ ] **Step 5: Run full test suite**

Run: `npm run type-check && npm run lint && npm run test:unit`
Expected: All pass. No remaining references to `@supabase/supabase-js` or `@/lib/supabase/`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove Supabase dependency, add Neon SQL schema, clean CSP"
```

---

### Task 7: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update the Cloud Persistence section**

Replace the entire "Cloud Persistence (Supabase)" section in `CLAUDE.md` with:

```markdown
### Cloud Persistence (Neon)

Neon Serverless Postgres stores AllotmentData as a JSONB document per user in the `allotments` table (schema in `sql/002-neon-allotments.sql`). Auth is enforced at the API route level via Clerk — no database-level RLS.

The sync API route (`src/app/api/sync/route.ts`) provides GET (fetch), PUT (upsert), and DELETE operations, all authenticated via Clerk's `auth()`. The Neon client module (`src/lib/neon/client.ts`) uses `@neondatabase/serverless` with a server-only `DATABASE_URL` env var.

The sync architecture layers: `useAllotment` -> `useAllotmentData` -> `useSyncedStorage` -> `usePersistedStorage` (localStorage). The `useSyncedStorage` hook (`src/hooks/useSyncedStorage.ts`) adds cloud sync when authenticated: it calls `/api/sync` via fetch, reconciles with LWW on `meta.updatedAt`, and pushes changes asynchronously. Reconnection triggers a re-sync via `useNetworkStatus.justReconnected`.

The client-side sync transport (`src/lib/sync-client.ts`) provides `fetchRemote()`, `pushToRemote()`, and `deleteRemote()` as thin wrappers around the API routes.

Environment: `DATABASE_URL` (server-only, Neon pooled connection string).
```

- [ ] **Step 2: Update the Authentication section**

Remove the sentence about Supabase domains in the CSP and the Clerk JWT template. The CSP line mentioning `https://*.supabase.co` should be removed from the documentation. Remove the entire paragraph about the Clerk JWT template named "supabase" and the Supabase JWT Secret configuration.

- [ ] **Step 3: Update the GDPR Compliance section**

Replace:
> `GET /api/account` exports user data as JSON download. `DELETE /api/account` deletes the Supabase row. Both require Clerk authentication.

With:
> `GET /api/account` exports user data as JSON download. `DELETE /api/account` deletes the Neon database row. Both require Clerk authentication.

- [ ] **Step 4: Run type-check and lint**

Run: `npm run type-check && npm run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for Neon migration"
```

---

### Task 8: Final Verification

- [ ] **Step 1: Run the complete test suite**

```bash
npm run type-check && npm run lint && npm run test:unit
```

Expected: All 830+ tests pass, zero lint warnings, zero type errors.

- [ ] **Step 2: Verify no Supabase references remain in source**

```bash
grep -r "supabase" src/ --include="*.ts" --include="*.tsx" -l
```

Expected: No files found.

- [ ] **Step 3: Verify build succeeds**

```bash
npm run build
```

Expected: Build completes successfully.

- [ ] **Step 4: Verify the Supabase dependency is gone**

```bash
grep "supabase" package.json
```

Expected: No matches.
