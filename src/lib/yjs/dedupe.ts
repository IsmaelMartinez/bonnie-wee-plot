/**
 * Allotment de-duplication (ADR 027 Step 4 safety net)
 *
 * The binary CRDT cloud transport keeps every device on one canonical Yjs
 * lineage via the per-device adoption gate (`bwp-yjs-synced-<userId>`). When
 * that gate leaks — IndexedDB evicted while the localStorage flag survives, a
 * blocked IDB delete during adoption, two tabs seeding independent lineages on
 * first run — two same-content documents get CRDT-merged and every id'd entity
 * survives twice (beds, plantings, compost, varieties, …). See
 * `allotment-binary-sync.test.ts` for the hazard.
 *
 * `dedupeAllotmentData` is the convergence guarantee that does not depend on
 * the gate holding: it collapses entities that share a stable key back to a
 * single copy. `useYjsDoc` runs it after every merge/adopt and on load, so a
 * duplicated document self-heals and the repair (real Yjs deletes) propagates
 * to the cloud and to every other device. It is a pure, idempotent function on
 * plain `AllotmentData` — a healthy document is returned unchanged
 * (`changed: false`) so a clean doc is never rewritten.
 */

import type {
  AllotmentData,
  SeasonRecord,
  AreaSeason,
  Planting,
} from '@/types/unified-allotment'

interface DedupeResult<T> {
  result: T[]
  dropped: number
}

/**
 * Keep-first de-duplication of an array by a key selector. Preserves the order
 * of first occurrence; reports how many later duplicates were dropped.
 */
function dedupeBy<T>(items: T[], key: (item: T) => string | number): DedupeResult<T> {
  const seen = new Set<string | number>()
  const result: T[] = []
  let dropped = 0
  for (const item of items) {
    const k = key(item)
    if (seen.has(k)) {
      dropped++
      continue
    }
    seen.add(k)
    result.push(item)
  }
  return { result, dropped }
}

/**
 * Collapse the areas of a single season by `areaId`. When the same area appears
 * twice (two lineages merged), the plantings are UNIONED into the kept copy
 * (then deduped by planting id) so no planting is lost — the copies are
 * same-origin, but unioning is the safe choice even if they diverged. Other
 * per-area fields keep the first copy's value.
 */
function mergeAreaSeasons(areas: AreaSeason[]): { result: AreaSeason[]; changed: boolean } {
  let changed = false
  const byAreaId = new Map<string, AreaSeason>()
  const order: string[] = []

  for (const area of areas) {
    const existing = byAreaId.get(area.areaId)
    if (!existing) {
      byAreaId.set(area.areaId, area)
      order.push(area.areaId)
    } else {
      changed = true
      existing.plantings = [...(existing.plantings ?? []), ...(area.plantings ?? [])]
    }
  }

  const result = order.map((areaId) => {
    const area = byAreaId.get(areaId)!
    const { result: plantings, dropped } = dedupeBy<Planting>(area.plantings ?? [], (p) => p.id)
    if (dropped > 0) {
      changed = true
      area.plantings = plantings
    }
    return area
  })

  return { result, changed }
}

/**
 * Collapse seasons by `year`. Duplicate same-year seasons have their per-area
 * plantings unioned into the kept copy before the extra season record is
 * dropped.
 */
function mergeSeasons(seasons: SeasonRecord[]): { result: SeasonRecord[]; changed: boolean } {
  let changed = false
  const byYear = new Map<number, SeasonRecord>()
  const order: number[] = []

  for (const season of seasons) {
    const existing = byYear.get(season.year)
    if (!existing) {
      byYear.set(season.year, season)
      order.push(season.year)
    } else {
      changed = true
      existing.areas = [...(existing.areas ?? []), ...(season.areas ?? [])]
    }
  }

  const result = order.map((year) => {
    const season = byYear.get(year)!
    const { result: mergedAreas, changed: areasChanged } = mergeAreaSeasons(season.areas ?? [])
    if (areasChanged) {
      changed = true
      season.areas = mergedAreas
    }
    return season
  })

  return { result, changed }
}

/**
 * Return a de-duplicated copy of `data` and whether anything changed. Operates
 * on a structural clone, so the input is never mutated. `changed` is `false`
 * for an already-clean document — callers use it to skip a redundant rewrite.
 */
export function dedupeAllotmentData(data: AllotmentData): { data: AllotmentData; changed: boolean } {
  const clone: AllotmentData = JSON.parse(JSON.stringify(data))
  let changed = false

  const areas = dedupeBy(clone.layout.areas ?? [], (a) => a.id)
  if (areas.dropped > 0) {
    changed = true
    clone.layout.areas = areas.result
  }

  if (clone.varieties) {
    const varieties = dedupeBy(clone.varieties, (v) => v.id)
    if (varieties.dropped > 0) {
      changed = true
      clone.varieties = varieties.result
    }
  }

  if (clone.compost) {
    const compost = dedupeBy(clone.compost, (c) => c.id)
    if (compost.dropped > 0) {
      changed = true
      clone.compost = compost.result
    }
  }

  if (clone.customTasks) {
    const tasks = dedupeBy(clone.customTasks, (t) => t.id)
    if (tasks.dropped > 0) {
      changed = true
      clone.customTasks = tasks.result
    }
  }

  if (clone.maintenanceTasks) {
    const tasks = dedupeBy(clone.maintenanceTasks, (t) => t.id)
    if (tasks.dropped > 0) {
      changed = true
      clone.maintenanceTasks = tasks.result
    }
  }

  if (clone.gardenEvents) {
    const events = dedupeBy(clone.gardenEvents, (e) => e.id)
    if (events.dropped > 0) {
      changed = true
      clone.gardenEvents = events.result
    }
  }

  const seasons = mergeSeasons(clone.seasons ?? [])
  if (seasons.changed) {
    changed = true
    clone.seasons = seasons.result
  }

  return { data: clone, changed }
}
