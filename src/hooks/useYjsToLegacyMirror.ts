/**
 * useYjsToLegacyMirror Hook (ADR 027 Step 3, PR-A foundation)
 *
 * Effect-based adapter that bridges a Yjs-derived `AllotmentData`
 * snapshot into the existing `usePersistedStorage` chain. The mirror is
 * one-way (Yjs → legacy) so the legacy chain is always a derived view
 * of the Yjs state during the Step 3 soak window.
 *
 * Why this is necessary: `useSyncedStorage`'s cloud-push effect listens
 * for `local.saveStatus === 'saved'` transitions from
 * `usePersistedStorage`'s debounce cycle. Writing to localStorage from
 * outside that cycle would skip the push and the cloud copy would
 * stagnate. By calling `local.setData(snapshot)`, we drive the existing
 * debounce + save + push pipeline exactly as a domain-hook `setData`
 * call would.
 *
 * Contract:
 *   - When `data` changes by reference, call `local.setData(data)`.
 *   - When `data` is `null`, do nothing.
 *   - When `data` is reference-equal to the previous snapshot, do
 *     nothing — `serializeToJson` returns a fresh object on every Yjs
 *     update, so reference inequality is a reliable change signal.
 */

'use client'

import { useEffect, useRef } from 'react'
import type { AllotmentData } from '@/types/unified-allotment'
import type { UsePersistedStorageReturn } from './usePersistedStorage'

/**
 * Mirrors a Yjs-derived snapshot into the legacy `usePersistedStorage`
 * instance. Returns nothing; the legacy chain is the side effect.
 *
 * @param data Yjs-derived `AllotmentData` snapshot (or `null` while the
 *   doc is still loading).
 * @param local Legacy `usePersistedStorage` instance whose `setData` is
 *   the mirror sink.
 */
export function useYjsToLegacyMirror(
  data: AllotmentData | null,
  local: UsePersistedStorageReturn<AllotmentData>,
): void {
  // Track the last snapshot we mirrored. Using a ref means we don't
  // trigger React state churn on every Yjs update, and reference
  // equality is the only signal we need — `serializeToJson` returns a
  // fresh object on every change, so two consecutive identical Yjs
  // updates would still reach this effect with the same reference and
  // skip correctly.
  const lastMirroredRef = useRef<AllotmentData | null>(null)

  useEffect(() => {
    if (data === null) return
    if (data === lastMirroredRef.current) return
    lastMirroredRef.current = data
    local.setData(data)
    // We intentionally exclude `local` from the dep array: it is a
    // freshly-constructed object on every render, and including it
    // would cause the effect to fire on every render rather than only
    // when the Yjs snapshot changes. The `setData` reference is stable
    // inside `usePersistedStorage`, so calling the latest one inside
    // the effect body is safe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])
}
