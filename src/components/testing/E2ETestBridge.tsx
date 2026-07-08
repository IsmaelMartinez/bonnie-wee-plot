'use client'

/**
 * E2E test bridge — mounted ONLY in Playwright test-mode builds
 * (`NEXT_PUBLIC_PLAYWRIGHT_TEST_MODE=true`), from `layout.tsx`. It exposes a
 * tiny deterministic surface on `window.__bwpTest` so the cross-device sync
 * e2e (tests/cloud-sync-merge.spec.ts) can make specific edits and read the
 * merged snapshot without fighting UI selectors.
 *
 * It reads/writes the shared Yjs doc via `useYjsDoc` directly — it does NOT
 * open its own cloud sync (the app's Navigation already drives one), so the
 * bridge never doubles the sync path it is meant to observe. `layout.tsx`
 * imports this module unconditionally but only *renders* the component when
 * `NEXT_PUBLIC_PLAYWRIGHT_TEST_MODE === 'true'`, so it is inert (never mounted,
 * never touches `window`) in real builds.
 */

import { useEffect, useRef } from 'react'
import { useYjsDoc } from '@/hooks/useYjsDoc'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import type { AllotmentData, Area } from '@/types/unified-allotment'

declare global {
  interface Window {
    __bwpTest?: {
      ready: () => boolean
      cloudConfigured: boolean
      snapshot: () => AllotmentData | null
      setMetaName: (name: string) => void
      addArea: (id: string, name: string) => void
    }
  }
}

export default function E2ETestBridge() {
  const { data, getSnapshot, mutate } = useYjsDoc()
  // Keep the latest getters in a ref so the window API is stable but always
  // reads live values.
  const api = useRef({ getSnapshot, mutate })
  api.current = { getSnapshot, mutate }

  useEffect(() => {
    window.__bwpTest = {
      ready: () => api.current.getSnapshot() !== null,
      cloudConfigured: isSupabaseConfigured(),
      snapshot: () => api.current.getSnapshot(),
      setMetaName: (name: string) => {
        api.current.mutate((store) => {
          store.meta.name = name
        })
      },
      addArea: (id: string, name: string) => {
        api.current.mutate((store) => {
          store.areas.push({
            id,
            name,
            kind: 'rotation-bed',
            canHavePlantings: true,
            createdAt: '2026-01-01T00:00:00.000Z',
          } as unknown as Area)
        })
      },
    }
    return () => {
      delete window.__bwpTest
    }
  }, [])

  // Re-render tie so `data` changes keep the component alive; nothing to draw.
  void data
  return null
}
