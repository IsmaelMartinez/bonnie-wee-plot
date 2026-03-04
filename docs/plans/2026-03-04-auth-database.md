# Auth + Database Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add opt-in Clerk authentication and Supabase cloud persistence with continuous localStorage sync to Bonnie Wee Plot.

**Architecture:** Storage Provider pattern — `useSyncedStorage` wraps the existing `usePersistedStorage` and adds Supabase sync when authenticated. localStorage stays as offline cache. LWW conflict resolution on `updated_at`. All existing pages remain public; auth is opt-in for cloud sync.

**Tech Stack:** @clerk/nextjs, @supabase/supabase-js, existing Vitest + React Testing Library

**Design doc:** `docs/plans/2026-03-04-auth-database-design.md`

**Reference:** `betis-escocia` project for Clerk + Supabase integration patterns.

---

### Task 1: Install Dependencies and Environment Setup

**Files:**
- Modify: `package.json`
- Modify: `.env.local.example`
- Create: `sql/001-allotments.sql`

**Step 1: Install Clerk and Supabase packages**

Run:
```bash
npm install @clerk/nextjs @supabase/supabase-js
```

**Step 2: Update .env.local.example with new variables**

Add to `.env.local.example`:
```
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Step 3: Create SQL schema file**

Create `sql/001-allotments.sql`:
```sql
-- Bonnie Wee Plot: Allotment cloud storage
-- Run this in Supabase SQL Editor after creating project

CREATE TABLE allotments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user lookups
CREATE INDEX idx_allotments_user_id ON allotments (user_id);

-- Row Level Security: users can only access their own row
ALTER TABLE allotments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own allotment"
  ON allotments FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own allotment"
  ON allotments FOR INSERT
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own allotment"
  ON allotments FOR UPDATE
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own allotment"
  ON allotments FOR DELETE
  USING (user_id = auth.jwt() ->> 'sub');
```

**Step 4: Verify installation**

Run:
```bash
npm run type-check
```
Expected: PASS (no code changes yet, just deps)

**Step 5: Commit**

```bash
git add package.json package-lock.json .env.local.example sql/
git commit -m "chore: add Clerk and Supabase dependencies"
```

---

### Task 2: Supabase Client Module

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/__tests__/lib/supabase-client.test.ts`

**Step 1: Write the failing test**

Create `src/__tests__/lib/supabase-client.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
}))

describe('Supabase client', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
  })

  it('createAnonClient returns a Supabase client', async () => {
    const { createAnonClient } = await import('@/lib/supabase/client')
    const client = createAnonClient()
    expect(client).toBeDefined()
    expect(client.from).toBeDefined()
  })

  it('createAuthClient returns a client with Authorization header', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    const { createAuthClient } = await import('@/lib/supabase/client')
    createAuthClient('test-token-123')
    expect(createClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        global: {
          headers: { Authorization: 'Bearer test-token-123' },
        },
      })
    )
  })

  it('isSupabaseConfigured returns false when env vars missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    // Re-import to pick up new env
    vi.resetModules()
    const { isSupabaseConfigured } = await import('@/lib/supabase/client')
    expect(isSupabaseConfigured()).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/lib/supabase-client.test.ts`
Expected: FAIL (module not found)

**Step 3: Write minimal implementation**

Create `src/lib/supabase/client.ts`:
```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/**
 * Check whether Supabase env vars are configured.
 * Returns false when running without cloud features.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

/**
 * Anonymous Supabase client — no auth context.
 */
export function createAnonClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Authenticated Supabase client — uses Clerk JWT for RLS.
 * The token should come from Clerk's getToken({ template: 'supabase' }).
 */
export function createAuthClient(token: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  })
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/lib/supabase-client.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/supabase/ src/__tests__/lib/supabase-client.test.ts
git commit -m "feat: add Supabase client module"
```

---

### Task 3: Supabase Sync Service

**Files:**
- Create: `src/lib/supabase/sync.ts`
- Create: `src/__tests__/lib/supabase-sync.test.ts`

**Step 1: Write the failing tests**

Create `src/__tests__/lib/supabase-sync.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchRemote, pushToRemote, deleteRemote } from '@/lib/supabase/sync'
import type { AllotmentData } from '@/types/unified-allotment'

// Mock the Supabase client module
const mockSelect = vi.fn()
const mockUpsert = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

const mockFrom = vi.fn(() => ({
  select: mockSelect.mockReturnValue({
    eq: mockEq.mockReturnValue({
      single: mockSingle,
    }),
  }),
  upsert: mockUpsert.mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn(),
    }),
  }),
  delete: mockDelete.mockReturnValue({
    eq: mockEq,
  }),
}))

vi.mock('@/lib/supabase/client', () => ({
  createAuthClient: vi.fn(() => ({ from: mockFrom })),
  isSupabaseConfigured: vi.fn(() => true),
}))

const mockData: AllotmentData = {
  version: 16,
  meta: { name: 'Test', lastModified: '2026-03-04T12:00:00Z' },
  layout: { areas: [] },
  seasons: [],
  currentYear: 2026,
  varieties: [],
} as unknown as AllotmentData

describe('fetchRemote', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns data and updated_at when row exists', async () => {
    mockSingle.mockResolvedValue({
      data: { data: mockData, updated_at: '2026-03-04T12:00:00Z' },
      error: null,
    })
    const result = await fetchRemote('token', 'user-123')
    expect(result).toEqual({
      data: mockData,
      updatedAt: '2026-03-04T12:00:00Z',
    })
  })

  it('returns null when no row exists', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    })
    const result = await fetchRemote('token', 'user-123')
    expect(result).toBeNull()
  })

  it('throws on unexpected errors', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'OTHER', message: 'Connection failed' },
    })
    await expect(fetchRemote('token', 'user-123')).rejects.toThrow('Connection failed')
  })
})

describe('pushToRemote', () => {
  beforeEach(() => vi.clearAllMocks())

  it('upserts data with user_id and updated_at', async () => {
    const mockUpsertChain = {
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ error: null }),
      }),
    }
    mockFrom.mockReturnValueOnce({
      upsert: vi.fn().mockReturnValue(mockUpsertChain),
    } as any)

    await pushToRemote('token', 'user-123', mockData)
    expect(mockFrom).toHaveBeenCalledWith('allotments')
  })
})

describe('deleteRemote', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes the row for the given user', async () => {
    mockEq.mockResolvedValue({ error: null })
    await deleteRemote('token', 'user-123')
    expect(mockFrom).toHaveBeenCalledWith('allotments')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/lib/supabase-sync.test.ts`
Expected: FAIL (module not found)

**Step 3: Write minimal implementation**

Create `src/lib/supabase/sync.ts`:
```typescript
import { createAuthClient } from './client'
import type { AllotmentData } from '@/types/unified-allotment'

export interface RemoteData {
  data: AllotmentData
  updatedAt: string
}

/**
 * Fetch the user's allotment from Supabase.
 * Returns null if no row exists (first-time user).
 */
export async function fetchRemote(
  token: string,
  userId: string
): Promise<RemoteData | null> {
  const client = createAuthClient(token)
  const { data, error } = await client
    .from('allotments')
    .select('data, updated_at')
    .eq('user_id', userId)
    .single()

  if (error) {
    // PGRST116 = "no rows returned" — user has no cloud data yet
    if (error.code === 'PGRST116') return null
    throw new Error(error.message)
  }

  return {
    data: data.data as AllotmentData,
    updatedAt: data.updated_at,
  }
}

/**
 * Upsert the user's allotment to Supabase.
 * Uses ON CONFLICT on user_id to update if exists, insert if not.
 */
export async function pushToRemote(
  token: string,
  userId: string,
  allotmentData: AllotmentData
): Promise<void> {
  const client = createAuthClient(token)
  const { error } = await client
    .from('allotments')
    .upsert(
      {
        user_id: userId,
        data: allotmentData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) throw new Error(error.message)
}

/**
 * Delete the user's allotment from Supabase (GDPR deletion).
 */
export async function deleteRemote(
  token: string,
  userId: string
): Promise<void> {
  const client = createAuthClient(token)
  const { error } = await client
    .from('allotments')
    .delete()
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/lib/supabase-sync.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/supabase/sync.ts src/__tests__/lib/supabase-sync.test.ts
git commit -m "feat: add Supabase sync service"
```

---

### Task 4: useSyncedStorage Hook

This is the core orchestrator that wraps `usePersistedStorage` with cloud sync.

**Files:**
- Create: `src/hooks/useSyncedStorage.ts`
- Create: `src/__tests__/hooks/useSyncedStorage.test.ts`

**Step 1: Write the failing tests**

Create `src/__tests__/hooks/useSyncedStorage.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSyncedStorage } from '@/hooks/useSyncedStorage'
import type { AllotmentData } from '@/types/unified-allotment'

// Mock Clerk auth
const mockGetToken = vi.fn()
const mockUserId: string | null = 'user-123'
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: mockGetToken,
    userId: mockUserId,
    isSignedIn: Boolean(mockUserId),
  }),
}))

// Mock Supabase sync
vi.mock('@/lib/supabase/sync', () => ({
  fetchRemote: vi.fn(),
  pushToRemote: vi.fn(),
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: vi.fn(() => true),
}))

// Mock network status
vi.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({ isOnline: true, justReconnected: false }),
}))

// Mock usePersistedStorage
const mockSetData = vi.fn()
const mockFlushSave = vi.fn().mockResolvedValue(true)
vi.mock('@/hooks/usePersistedStorage', () => ({
  usePersistedStorage: vi.fn(() => ({
    data: null,
    setData: mockSetData,
    isLoading: false,
    error: null,
    saveError: null,
    saveStatus: 'idle',
    lastSavedAt: null,
    isSyncedFromOtherTab: false,
    reload: vi.fn(),
    flushSave: mockFlushSave,
    clearSaveError: vi.fn(),
    cancelPendingSave: vi.fn(),
    retrySave: vi.fn(),
  })),
}))

describe('useSyncedStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetToken.mockResolvedValue('test-token')
  })

  it('exposes the same interface as usePersistedStorage', () => {
    const { result } = renderHook(() =>
      useSyncedStorage({
        storageKey: 'test',
        load: vi.fn(() => ({ success: true, data: null })),
        save: vi.fn(() => ({ success: true })),
      })
    )

    expect(result.current).toHaveProperty('data')
    expect(result.current).toHaveProperty('setData')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('saveStatus')
    expect(result.current).toHaveProperty('syncStatus')
  })

  it('syncStatus is "disabled" when not signed in', async () => {
    // Override the mock for this test
    const { useAuth } = await import('@clerk/nextjs')
    vi.mocked(useAuth).mockReturnValue({
      getToken: mockGetToken,
      userId: null,
      isSignedIn: false,
    } as any)

    const { result } = renderHook(() =>
      useSyncedStorage({
        storageKey: 'test',
        load: vi.fn(() => ({ success: true, data: null })),
        save: vi.fn(() => ({ success: true })),
      })
    )

    expect(result.current.syncStatus).toBe('disabled')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/hooks/useSyncedStorage.test.ts`
Expected: FAIL (module not found)

**Step 3: Write minimal implementation**

Create `src/hooks/useSyncedStorage.ts`:
```typescript
/**
 * useSyncedStorage Hook
 *
 * Wraps usePersistedStorage with Supabase cloud sync when authenticated.
 * localStorage always stays active as the offline cache.
 * When signed in, changes are pushed to Supabase asynchronously.
 * On load, cloud data is fetched and reconciled with LWW.
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { usePersistedStorage, UsePersistedStorageOptions, UsePersistedStorageReturn } from './usePersistedStorage'
import { useNetworkStatus } from './useNetworkStatus'
import { fetchRemote, pushToRemote } from '@/lib/supabase/sync'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import type { AllotmentData } from '@/types/unified-allotment'

export type SyncStatus = 'disabled' | 'syncing' | 'synced' | 'error' | 'offline'

export interface UseSyncedStorageReturn<T> extends UsePersistedStorageReturn<T> {
  syncStatus: SyncStatus
  syncError: string | null
}

export function useSyncedStorage(
  options: UsePersistedStorageOptions<AllotmentData>
): UseSyncedStorageReturn<AllotmentData> {
  const local = usePersistedStorage<AllotmentData>(options)
  const { getToken, userId, isSignedIn } = useAuth()
  const { isOnline, justReconnected } = useNetworkStatus()

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('disabled')
  const [syncError, setSyncError] = useState<string | null>(null)
  const syncInProgressRef = useRef(false)
  const lastPushedRef = useRef<string | null>(null)

  const canSync = isSignedIn && isSupabaseConfigured() && isOnline

  // Initial sync: fetch cloud data and reconcile with local
  useEffect(() => {
    if (!canSync || !userId || local.isLoading || !local.data) return
    if (syncInProgressRef.current) return
    syncInProgressRef.current = true

    const doInitialSync = async () => {
      try {
        setSyncStatus('syncing')
        const token = await getToken({ template: 'supabase' })
        if (!token) {
          setSyncStatus('error')
          setSyncError('Failed to get auth token')
          return
        }

        const remote = await fetchRemote(token, userId)

        if (!remote) {
          // First-time cloud user — push local data up
          await pushToRemote(token, userId, local.data!)
          lastPushedRef.current = JSON.stringify(local.data)
          setSyncStatus('synced')
          setSyncError(null)
          return
        }

        // Compare timestamps — LWW
        const localTime = new Date(local.data!.meta?.lastModified || 0).getTime()
        const remoteTime = new Date(remote.updatedAt).getTime()

        if (remoteTime > localTime) {
          // Cloud is newer — update local
          local.setData(remote.data)
          lastPushedRef.current = JSON.stringify(remote.data)
        } else if (localTime > remoteTime) {
          // Local is newer — push to cloud
          await pushToRemote(token, userId, local.data!)
          lastPushedRef.current = JSON.stringify(local.data)
        } else {
          // Same timestamp — already in sync
          lastPushedRef.current = JSON.stringify(local.data)
        }

        setSyncStatus('synced')
        setSyncError(null)
      } catch (err) {
        console.error('[useSyncedStorage] Initial sync failed:', err)
        setSyncStatus('error')
        setSyncError(err instanceof Error ? err.message : 'Sync failed')
      }
    }

    doInitialSync()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSync, userId, local.isLoading])

  // Push to cloud after local save completes
  useEffect(() => {
    if (!canSync || !userId || !local.data) return
    if (local.saveStatus !== 'saved') return

    const serialized = JSON.stringify(local.data)
    if (serialized === lastPushedRef.current) return

    const pushAsync = async () => {
      try {
        setSyncStatus('syncing')
        const token = await getToken({ template: 'supabase' })
        if (!token) return

        await pushToRemote(token, userId, local.data!)
        lastPushedRef.current = serialized
        setSyncStatus('synced')
        setSyncError(null)
      } catch (err) {
        console.error('[useSyncedStorage] Push failed:', err)
        setSyncStatus('error')
        setSyncError(err instanceof Error ? err.message : 'Sync failed')
      }
    }

    pushAsync()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local.saveStatus, canSync, userId])

  // Reconnect sync
  useEffect(() => {
    if (!justReconnected || !canSync || !userId || !local.data) return

    const resync = async () => {
      try {
        setSyncStatus('syncing')
        const token = await getToken({ template: 'supabase' })
        if (!token) return

        const remote = await fetchRemote(token, userId)
        if (!remote) {
          await pushToRemote(token, userId, local.data!)
          lastPushedRef.current = JSON.stringify(local.data)
        } else {
          const localTime = new Date(local.data!.meta?.lastModified || 0).getTime()
          const remoteTime = new Date(remote.updatedAt).getTime()

          if (remoteTime > localTime) {
            local.setData(remote.data)
            lastPushedRef.current = JSON.stringify(remote.data)
          } else {
            await pushToRemote(token, userId, local.data!)
            lastPushedRef.current = JSON.stringify(local.data)
          }
        }
        setSyncStatus('synced')
        setSyncError(null)
      } catch (err) {
        setSyncStatus('error')
        setSyncError(err instanceof Error ? err.message : 'Sync failed')
      }
    }

    resync()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justReconnected])

  // Update sync status based on auth/network
  useEffect(() => {
    if (!isSignedIn || !isSupabaseConfigured()) {
      setSyncStatus('disabled')
    } else if (!isOnline) {
      setSyncStatus('offline')
    }
  }, [isSignedIn, isOnline])

  return {
    ...local,
    syncStatus,
    syncError,
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/hooks/useSyncedStorage.test.ts`
Expected: PASS

**Step 5: Run full unit test suite**

Run: `npm run test:unit`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/hooks/useSyncedStorage.ts src/__tests__/hooks/useSyncedStorage.test.ts
git commit -m "feat: add useSyncedStorage hook with cloud sync"
```

---

### Task 5: Wire useSyncedStorage into useAllotmentData

**Files:**
- Modify: `src/hooks/allotment/useAllotmentData.ts`
- Modify: `src/types/storage.ts` (add SyncStatus export)

**Step 1: Update storage types**

Add to `src/types/storage.ts`:
```typescript
export type SyncStatus = 'disabled' | 'syncing' | 'synced' | 'error' | 'offline'
```

**Step 2: Modify useAllotmentData to use useSyncedStorage**

In `src/hooks/allotment/useAllotmentData.ts`, replace the `usePersistedStorage` import and usage:

Change the import from:
```typescript
import { usePersistedStorage, StorageResult, SaveStatus } from '../usePersistedStorage'
```
To:
```typescript
import { StorageResult, SaveStatus } from '../usePersistedStorage'
import { useSyncedStorage, SyncStatus } from '../useSyncedStorage'
```

Change the `UseAllotmentDataReturn` interface — add:
```typescript
syncStatus: SyncStatus
syncError: string | null
```

Change the hook body — replace `usePersistedStorage<AllotmentData>({...})` with `useSyncedStorage({...})`.

Extract `syncStatus` and `syncError` from the destructured return and include them in the hook's return object.

**Step 3: Run tests to verify nothing breaks**

Run: `npm run test:unit`
Expected: All existing tests pass (useSyncedStorage falls back to usePersistedStorage when not authenticated)

**Step 4: Run type check**

Run: `npm run type-check`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/allotment/useAllotmentData.ts src/types/storage.ts
git commit -m "feat: wire useSyncedStorage into useAllotmentData"
```

---

### Task 6: Clerk Provider and Middleware Integration

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/middleware.ts`

**Step 1: Add ClerkProvider to root layout**

In `src/app/layout.tsx`:

Add import:
```typescript
import { ClerkProvider } from '@clerk/nextjs'
```

Wrap the body content with ClerkProvider. The `<html>` and `<body>` tags stay outside. ClerkProvider goes inside `<body>`, wrapping all existing content:
```tsx
<body className={inter.className}>
  <ClerkProvider
    signInUrl="/sign-in"
    signUpUrl="/sign-up"
  >
    {/* existing AitorChatProvider, TourProvider, etc. */}
  </ClerkProvider>
</body>
```

**Step 2: Update middleware to combine CSP with Clerk**

Rewrite `src/middleware.ts` to use `clerkMiddleware` as the outer wrapper while preserving all existing CSP security headers:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { clerkMiddleware } from '@clerk/nextjs/server'

// CSP directives — extend for Clerk and Supabase domains
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'connect-src': [
    "'self'",
    'https://api.openai.com',
    'https://api.bigdatacloud.net',
    'https://*.clerk.accounts.dev',
    'https://*.supabase.co',
  ],
  'img-src': ["'self'", 'data:', 'blob:', 'https://images.unsplash.com', 'https://img.clerk.com'],
  'font-src': ["'self'"],
  'frame-src': ["'self'", 'https://*.clerk.accounts.dev'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
}

function buildCspHeader(): string {
  return Object.entries(cspDirectives)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ')
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set('Content-Security-Policy', buildCspHeader())
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
}

// All routes are public — Clerk is used for opt-in auth only.
// No routes require authentication at the middleware level.
export default clerkMiddleware(async (_auth, request: NextRequest) => {
  const response = NextResponse.next()

  addSecurityHeaders(response)

  // Request size limit check for API routes
  const contentLength = request.headers.get('content-length')
  if (contentLength) {
    const sizeInBytes = parseInt(contentLength, 10)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (sizeInBytes > maxSize) {
      return new NextResponse('Payload too large', { status: 413 })
    }
  }

  return response
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
```

**Step 3: Run type check**

Run: `npm run type-check`
Expected: PASS

**Step 4: Run build**

Run: `npm run build`
Expected: PASS (Clerk works without env vars in build mode — it just shows unauthenticated state)

**Step 5: Commit**

```bash
git add src/app/layout.tsx src/middleware.ts
git commit -m "feat: add ClerkProvider and merge Clerk into middleware"
```

---

### Task 7: Sign-In and Sign-Up Pages

**Files:**
- Create: `src/app/sign-in/[[...rest]]/page.tsx`
- Create: `src/app/sign-up/[[...rest]]/page.tsx`

**Step 1: Create sign-in page**

Create `src/app/sign-in/[[...rest]]/page.tsx`:
```tsx
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-zen-stone-50 zen-texture flex items-center justify-center px-4">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-lg',
          },
        }}
      />
    </div>
  )
}
```

**Step 2: Create sign-up page**

Create `src/app/sign-up/[[...rest]]/page.tsx`:
```tsx
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-zen-stone-50 zen-texture flex items-center justify-center px-4">
      <SignUp
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-lg',
          },
        }}
      />
    </div>
  )
}
```

**Step 3: Run type check**

Run: `npm run type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add src/app/sign-in/ src/app/sign-up/
git commit -m "feat: add Clerk sign-in and sign-up pages"
```

---

### Task 8: Navigation Auth UI

**Files:**
- Modify: `src/components/Navigation.tsx`
- Modify: `src/components/DesktopMoreDropdown.tsx` (if it exists as separate file)

**Step 1: Add UserButton / Sign In to navigation**

In `src/components/Navigation.tsx`:

Add imports:
```typescript
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { LogIn } from 'lucide-react'
```

After the `DesktopMoreDropdown` in the desktop nav section, add:
```tsx
{/* Auth */}
<SignedIn>
  <UserButton afterSignOutUrl="/" />
</SignedIn>
<SignedOut>
  <Link
    href="/sign-in"
    className="flex items-center gap-1.5 px-3 py-2 rounded-zen text-sm font-medium text-zen-ink-600 hover:text-zen-ink-800 hover:bg-zen-stone-50 transition-colors"
  >
    <LogIn className="w-4 h-4" />
    Sign in
  </Link>
</SignedOut>
```

Add the same pattern at the bottom of the mobile menu section.

**Step 2: Run type check and build**

Run: `npm run type-check && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/Navigation.tsx
git commit -m "feat: add auth UI to navigation"
```

---

### Task 9: Sync Status Indicator

**Files:**
- Create: `src/components/auth/SyncStatusIcon.tsx`
- Modify: `src/components/Navigation.tsx` (add sync indicator near UserButton)

**Step 1: Create SyncStatusIcon component**

Create `src/components/auth/SyncStatusIcon.tsx`:
```tsx
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
```

**Step 2: Wire into Navigation**

In the desktop nav, next to the UserButton, add the SyncStatusIcon. This requires getting syncStatus from useAllotment — add `syncStatus` and `syncError` to the `useAllotment` return type and thread it through.

First, update `src/hooks/useAllotment.ts` to expose `syncStatus` and `syncError` from `useAllotmentData`.

Then in Navigation.tsx, destructure them:
```typescript
const { data, updateMeta, syncStatus, syncError } = useAllotment()
```

And render next to UserButton:
```tsx
<SignedIn>
  <SyncStatusIcon syncStatus={syncStatus} syncError={syncError} />
  <UserButton afterSignOutUrl="/" />
</SignedIn>
```

**Step 3: Run type check**

Run: `npm run type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/auth/ src/components/Navigation.tsx src/hooks/useAllotment.ts
git commit -m "feat: add cloud sync status indicator"
```

---

### Task 10: GDPR Account Endpoints

**Files:**
- Create: `src/app/api/account/route.ts`
- Create: `src/__tests__/api/account.test.ts`

**Step 1: Write the failing test**

Create `src/__tests__/api/account.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest'

// Mock Clerk server auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

// Mock Supabase sync
vi.mock('@/lib/supabase/sync', () => ({
  fetchRemote: vi.fn(),
  deleteRemote: vi.fn(),
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: vi.fn(() => true),
}))

describe('GET /api/account (export)', () => {
  it('returns 401 when not authenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)

    const { GET } = await import('@/app/api/account/route')
    const response = await GET()
    expect(response.status).toBe(401)
  })

  it('returns user data as JSON when authenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValue({
      userId: 'user-123',
      getToken: vi.fn().mockResolvedValue('test-token'),
    } as any)

    const { fetchRemote } = await import('@/lib/supabase/sync')
    vi.mocked(fetchRemote).mockResolvedValue({
      data: { version: 16, meta: { name: 'Test' } } as any,
      updatedAt: '2026-03-04T12:00:00Z',
    })

    const { GET } = await import('@/app/api/account/route')
    const response = await GET()
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.meta.name).toBe('Test')
  })
})

describe('DELETE /api/account', () => {
  it('returns 401 when not authenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server')
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)

    const { DELETE } = await import('@/app/api/account/route')
    const response = await DELETE()
    expect(response.status).toBe(401)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/api/account.test.ts`
Expected: FAIL

**Step 3: Write implementation**

Create `src/app/api/account/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { fetchRemote, deleteRemote } from '@/lib/supabase/sync'

/**
 * GET /api/account — Export user data (GDPR)
 */
export async function GET() {
  const { userId, getToken } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const token = await getToken({ template: 'supabase' })
    if (!token) {
      return NextResponse.json({ error: 'Failed to get auth token' }, { status: 500 })
    }

    const remote = await fetchRemote(token, userId)
    if (!remote) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 })
    }

    return NextResponse.json(remote.data, {
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
  const { userId, getToken } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const token = await getToken({ template: 'supabase' })
    if (!token) {
      return NextResponse.json({ error: 'Failed to get auth token' }, { status: 500 })
    }

    await deleteRemote(token, userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/account] Deletion failed:', err)
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/api/account.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/account/ src/__tests__/api/account.test.ts
git commit -m "feat: add GDPR account export and deletion endpoints"
```

---

### Task 11: Settings Account Tab

**Files:**
- Create: `src/components/settings/AccountTab.tsx`
- Modify: `src/app/settings/page.tsx`

**Step 1: Create AccountTab component**

Create `src/components/settings/AccountTab.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { Cloud, Download, Trash2, Shield } from 'lucide-react'

export default function AccountTab() {
  const { signOut } = useAuth()
  const { user } = useUser()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleExport = async () => {
    setIsExporting(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/account')
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'bonnie-wee-plot-export.json'
      a.click()
      URL.revokeObjectURL(url)
      setFeedback('Data exported successfully')
    } catch {
      setFeedback('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setIsDeleting(true)
    try {
      const response = await fetch('/api/account', { method: 'DELETE' })
      if (!response.ok) throw new Error('Deletion failed')

      localStorage.removeItem('allotment-unified-data')
      await signOut()
    } catch {
      setFeedback('Deletion failed. Please try again.')
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Account info */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Cloud className="w-5 h-5 text-zen-water-600" />
          <h2 className="text-lg font-medium text-zen-ink-700">Cloud Account</h2>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Signed in as {user?.primaryEmailAddress?.emailAddress || 'unknown'}.
          Your garden data syncs automatically across devices.
        </p>
      </section>

      {/* Export */}
      <section className="pt-6 border-t border-zen-stone-200">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-zen-moss-600" />
          <h2 className="text-lg font-medium text-zen-ink-700">Export Data</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Download all your garden data as a JSON file.
        </p>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="zen-btn-secondary min-h-[44px] disabled:opacity-50"
        >
          {isExporting ? 'Exporting...' : 'Export My Data'}
        </button>
      </section>

      {/* Delete Account */}
      <section className="pt-6 border-t border-zen-stone-200">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="w-5 h-5 text-zen-kitsune-600" />
          <h2 className="text-lg font-medium text-zen-ink-700">Delete Account</h2>
        </div>
        <div className="bg-zen-kitsune-50 border border-zen-kitsune-200 rounded-zen p-3 mb-4">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-zen-kitsune-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-zen-kitsune-800">
              This permanently deletes your cloud data and account. Local data on this device will also be removed. This cannot be undone.
            </p>
          </div>
        </div>
        {confirmDelete ? (
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="zen-btn-primary bg-zen-kitsune-600 hover:bg-zen-kitsune-700 min-h-[44px] disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="zen-btn-secondary min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleDelete}
            className="zen-btn-secondary text-zen-kitsune-600 border-zen-kitsune-300 hover:bg-zen-kitsune-50 min-h-[44px]"
          >
            Delete My Account
          </button>
        )}
      </section>

      {/* Feedback */}
      {feedback && (
        <p className="text-sm text-zen-ink-600 bg-zen-stone-100 rounded-zen px-3 py-2">{feedback}</p>
      )}
    </div>
  )
}
```

**Step 2: Add Account tab to Settings page**

In `src/app/settings/page.tsx`, add:

Import:
```typescript
import { User } from 'lucide-react'
import AccountTab from '@/components/settings/AccountTab'
import { SignedIn } from '@clerk/nextjs'
```

Add a new tab to the `tabs` array (conditionally rendered only for signed-in users). The simplest approach: always include the tab, but show a "sign in to use" message for unauthenticated users. Or wrap in `<SignedIn>`. Given the tab system, add it as the last tab:

```typescript
{
  id: 'account',
  label: 'Account',
  icon: <User className="w-4 h-4" />,
  content: (
    <SignedIn>
      <AccountTab />
    </SignedIn>
  ),
},
```

**Step 3: Run type check**

Run: `npm run type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/settings/AccountTab.tsx src/app/settings/page.tsx
git commit -m "feat: add Account tab to Settings with GDPR export and deletion"
```

---

### Task 12: Sign-In Prompt on Dashboard

**Files:**
- Create: `src/components/auth/SignInPrompt.tsx`
- Modify: `src/app/page.tsx` (Today dashboard)

**Step 1: Create SignInPrompt component**

Create `src/components/auth/SignInPrompt.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { SignedOut } from '@clerk/nextjs'
import { Cloud } from 'lucide-react'

export default function SignInPrompt() {
  return (
    <SignedOut>
      <div className="zen-card p-4 flex items-center gap-3">
        <Cloud className="w-5 h-5 text-zen-water-500 flex-shrink-0" />
        <p className="text-sm text-zen-ink-600 flex-1">
          <Link href="/sign-in" className="text-zen-moss-600 hover:underline font-medium">
            Sign in
          </Link>
          {' '}to sync your garden across devices.
        </p>
      </div>
    </SignedOut>
  )
}
```

**Step 2: Add to Today dashboard**

In the Today page component (check `src/app/page.tsx`), add `<SignInPrompt />` at a sensible location — after the task list, before the footer. Keep it subtle.

**Step 3: Run type check**

Run: `npm run type-check`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/auth/SignInPrompt.tsx src/app/page.tsx
git commit -m "feat: add sign-in prompt to Today dashboard"
```

---

### Task 13: Full Integration Test and Verification

**Files:**
- None created

**Step 1: Run full unit test suite**

Run: `npm run test:unit`
Expected: All tests pass. New tests from tasks 2-4, 10 should all be green.

**Step 2: Run type check**

Run: `npm run type-check`
Expected: PASS

**Step 3: Run lint**

Run: `npm run lint`
Expected: PASS (fix any lint issues)

**Step 4: Run build**

Run: `npm run build`
Expected: PASS (the app builds without Clerk/Supabase env vars — features just stay in unauthenticated mode)

**Step 5: Run E2E tests**

Run: `npm run test`
Expected: All existing E2E tests pass (auth is opt-in, anonymous path unchanged)

**Step 6: Commit any fixes**

If any fixes were needed for lint/type-check/build, commit them:
```bash
git add -A
git commit -m "fix: address lint and type-check issues"
```

---

### Task 14: Update Documentation and Create PR

**Files:**
- Modify: `CLAUDE.md` (add auth + sync sections)
- Modify: `docs/plans/current-plan.md` (add Phase 6-7 completion entry)
- Delete: `docs/plans/2026-03-04-auth-database-design.md` (temporary design doc)
- Delete: `docs/plans/2026-03-04-auth-database.md` (this plan)

**Step 1: Update CLAUDE.md**

Add sections for:
- Authentication: Clerk setup, ClerkProvider, middleware, sign-in/sign-up pages
- Cloud Persistence: Supabase, useSyncedStorage, sync behaviour, RLS
- GDPR: export and deletion endpoints

**Step 2: Update current-plan.md**

Add an entry for Phase 6-7 completion.

**Step 3: Clean up temporary plan docs**

Delete the design doc and this plan doc.

**Step 4: Commit documentation**

```bash
git add CLAUDE.md docs/plans/current-plan.md
git rm docs/plans/2026-03-04-auth-database-design.md docs/plans/2026-03-04-auth-database.md
git commit -m "docs: update for auth + database integration"
```

**Step 5: Create PR**

```bash
gh pr create --title "feat: add Clerk auth and Supabase cloud persistence" --body "$(cat <<'EOF'
## Summary
- Clerk authentication (opt-in, all pages stay public)
- Supabase JSONB cloud persistence with RLS
- Continuous localStorage ↔ Supabase sync with LWW conflict resolution
- GDPR compliance (data export + account deletion)
- Sign-in/sign-up pages, nav UserButton, sync status indicator
- Settings Account tab

## Test plan
- [ ] Unit tests: useSyncedStorage, useSupabaseSync, Supabase client, GDPR endpoints
- [ ] Type check passes
- [ ] Build succeeds without env vars (graceful degradation)
- [ ] Existing E2E tests pass (anonymous path unchanged)
- [ ] Manual: sign in with Clerk, verify data syncs to Supabase
- [ ] Manual: edit on two devices, verify LWW resolution
- [ ] Manual: go offline, edit, reconnect, verify sync

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
