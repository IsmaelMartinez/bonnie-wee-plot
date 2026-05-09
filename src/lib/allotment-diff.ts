/**
 * AllotmentData-aware diff.
 *
 * Hand-rolled walker that summarises the meaningful differences between two
 * AllotmentData snapshots. We avoid generic deep-diff libraries on purpose:
 * the bulk of the noise between two adjacent cloud snapshots is timestamp
 * churn (`meta.updatedAt`, etc.) which generic libraries surface verbatim
 * and drown out the changes a user actually cares about — areas added,
 * plantings edited, varieties renamed, schema bumps.
 *
 * The output is a structured summary, not a raw JSON patch. The
 * `summariseDiff()` helper renders it as a one-line inline hint; the
 * structured form is used by the dialog UI to render concrete lists.
 */

import type {
  AllotmentData,
  Area,
  Planting,
  StoredVariety,
} from '@/types/unified-allotment'

export interface RenameEntry {
  id: string
  from: string
  to: string
}

export interface AllotmentDiff {
  areas: {
    added: string[]
    removed: string[]
    renamed: RenameEntry[]
  }
  plantings: {
    added: number
    removed: number
    edited: number
  }
  varieties: {
    added: string[]
    removed: string[]
    renamed: RenameEntry[]
  }
  meta: {
    schemaVersionChanged?: { from: number; to: number }
  }
}

function emptyDiff(): AllotmentDiff {
  return {
    areas: { added: [], removed: [], renamed: [] },
    plantings: { added: 0, removed: 0, edited: 0 },
    varieties: { added: [], removed: [], renamed: [] },
    meta: {},
  }
}

function indexById<T extends { id: string }>(items: readonly T[] | undefined): Map<string, T> {
  const map = new Map<string, T>()
  if (!items) return map
  for (const item of items) {
    if (item && typeof item.id === 'string') {
      map.set(item.id, item)
    }
  }
  return map
}

function diffNamedItems<T extends { id: string; name: string }>(
  oldItems: readonly T[] | undefined,
  newItems: readonly T[] | undefined,
) {
  const oldMap = indexById(oldItems)
  const newMap = indexById(newItems)
  const added: string[] = []
  const removed: string[] = []
  const renamed: RenameEntry[] = []

  for (const [id, item] of newMap) {
    if (!oldMap.has(id)) {
      added.push(item.name)
    } else {
      const prev = oldMap.get(id)!
      if (prev.name !== item.name) {
        renamed.push({ id, from: prev.name, to: item.name })
      }
    }
  }
  for (const [id, item] of oldMap) {
    if (!newMap.has(id)) {
      removed.push(item.name)
    }
  }

  return { added, removed, renamed }
}

/**
 * Two plantings are considered "edited" when any non-id field differs.
 * The Planting shape is all scalars (strings, numbers, enum strings — see
 * src/types/unified-allotment.ts), so a shallow comparison with nullish
 * coalescing handles all real cases. We unify undefined and null because
 * JSONB roundtrips through Supabase don't preserve the distinction.
 */
function plantingsEqual(a: Planting, b: Planting): boolean {
  // Union of all keys (excluding id) so a key that exists on only one side
  // counts as a difference rather than being silently skipped.
  const keys = new Set<string>()
  for (const k of Object.keys(a)) if (k !== 'id') keys.add(k)
  for (const k of Object.keys(b)) if (k !== 'id') keys.add(k)
  for (const key of keys) {
    const valA = (a as unknown as Record<string, unknown>)[key]
    const valB = (b as unknown as Record<string, unknown>)[key]
    if ((valA ?? null) !== (valB ?? null)) return false
  }
  return true
}

function collectPlantings(data: AllotmentData | undefined): Map<string, Planting> {
  // Key on `${year}|${areaId}|${plantingId}` so we can detect plantings that
  // moved across seasons or across areas without mistaking them for an
  // edit-in-place. Same id under the same (year, areaId) pair = same planting.
  const map = new Map<string, Planting>()
  if (!data?.seasons) return map
  for (const season of data.seasons) {
    if (!season?.areas) continue
    for (const areaSeason of season.areas) {
      if (!areaSeason?.plantings) continue
      for (const planting of areaSeason.plantings) {
        if (planting && typeof planting.id === 'string') {
          map.set(`${season.year}|${areaSeason.areaId}|${planting.id}`, planting)
        }
      }
    }
  }
  return map
}

function diffPlantings(oldData: AllotmentData, newData: AllotmentData) {
  const oldMap = collectPlantings(oldData)
  const newMap = collectPlantings(newData)
  let added = 0
  let removed = 0
  let edited = 0

  for (const [key, planting] of newMap) {
    const prev = oldMap.get(key)
    if (!prev) {
      added++
    } else if (!plantingsEqual(prev, planting)) {
      edited++
    }
  }
  for (const key of oldMap.keys()) {
    if (!newMap.has(key)) {
      removed++
    }
  }

  return { added, removed, edited }
}

/**
 * Compute a structured summary of meaningful differences between two
 * AllotmentData snapshots. Pure function — no side effects.
 *
 * Notes on what is intentionally ignored:
 * - `meta.updatedAt` and other timestamp churn (we never look at them).
 * - `meta.createdAt` (immutable in practice; comparing it would just add noise).
 * - `currentYear` (UI-only state).
 * - `customTasks`, `maintenanceTasks`, `gardenEvents`, `compost` (out of scope
 *    for this surface — the main signal users want is areas / plantings /
 *    varieties / schema).
 */
export function diffAllotment(oldData: AllotmentData, newData: AllotmentData): AllotmentDiff {
  const diff = emptyDiff()

  diff.areas = diffNamedItems<Area>(oldData.layout?.areas, newData.layout?.areas)
  diff.varieties = diffNamedItems<StoredVariety>(oldData.varieties, newData.varieties)
  diff.plantings = diffPlantings(oldData, newData)

  if (
    typeof oldData.version === 'number' &&
    typeof newData.version === 'number' &&
    oldData.version !== newData.version
  ) {
    diff.meta.schemaVersionChanged = { from: oldData.version, to: newData.version }
  }

  return diff
}

/**
 * True when the diff has no meaningful changes.
 */
export function isEmptyDiff(d: AllotmentDiff): boolean {
  return (
    d.areas.added.length === 0 &&
    d.areas.removed.length === 0 &&
    d.areas.renamed.length === 0 &&
    d.plantings.added === 0 &&
    d.plantings.removed === 0 &&
    d.plantings.edited === 0 &&
    d.varieties.added.length === 0 &&
    d.varieties.removed.length === 0 &&
    d.varieties.renamed.length === 0 &&
    !d.meta.schemaVersionChanged
  )
}

/**
 * One-line, comma-separated summary of the diff. Returns "No changes" when
 * the diff is empty. Uses a Unicode minus sign (U+2212) for negative counts
 * since it reads more cleanly than ASCII hyphen-minus alongside the +.
 */
export function summariseDiff(d: AllotmentDiff): string {
  if (isEmptyDiff(d)) return 'No changes'

  const parts: string[] = []

  // Areas — net add/remove + rename count
  if (d.areas.added.length > 0) {
    parts.push(`+${d.areas.added.length} area${d.areas.added.length === 1 ? '' : 's'}`)
  }
  if (d.areas.removed.length > 0) {
    parts.push(`−${d.areas.removed.length} area${d.areas.removed.length === 1 ? '' : 's'}`)
  }
  if (d.areas.renamed.length > 0) {
    parts.push(`${d.areas.renamed.length} renamed`)
  }

  // Plantings
  if (d.plantings.added > 0) {
    parts.push(`+${d.plantings.added} planting${d.plantings.added === 1 ? '' : 's'}`)
  }
  if (d.plantings.removed > 0) {
    parts.push(
      `−${d.plantings.removed} planting${d.plantings.removed === 1 ? '' : 's'}`,
    )
  }
  if (d.plantings.edited > 0) {
    parts.push(`${d.plantings.edited} edited`)
  }

  // Varieties
  if (d.varieties.added.length > 0) {
    parts.push(
      `+${d.varieties.added.length} variet${d.varieties.added.length === 1 ? 'y' : 'ies'}`,
    )
  }
  if (d.varieties.removed.length > 0) {
    parts.push(
      `−${d.varieties.removed.length} variet${d.varieties.removed.length === 1 ? 'y' : 'ies'}`,
    )
  }
  if (d.varieties.renamed.length > 0) {
    parts.push(
      `${d.varieties.renamed.length} variety rename${d.varieties.renamed.length === 1 ? '' : 's'}`,
    )
  }

  if (d.meta.schemaVersionChanged) {
    parts.push(`schema v${d.meta.schemaVersionChanged.from}→v${d.meta.schemaVersionChanged.to}`)
  }

  return parts.join(', ')
}
