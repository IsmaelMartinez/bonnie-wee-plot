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
 * `dedupeAllotmentCollections` is the convergence guarantee that does not
 * depend on the gate holding: it collapses entities that share a stable key
 * back to a single copy. It works **in place** on the collection arrays, so the
 * SAME code path drives both the live SyncedStore repair (`dedupeStore`) and the
 * pure `dedupeAllotmentData` used in tests. In place matters for the live doc:
 * only the actual duplicate elements are deleted, so every other struct keeps
 * its Yjs identity — no tombstone bloat, and concurrent edits from other devices
 * to unrelated fields are preserved (a clear-and-reload would drop them).
 *
 * `useYjsDoc` runs `dedupeStore` after every merge/adopt and on load, so a
 * duplicated document self-heals and the repair (real, granular Yjs deletes)
 * propagates to the cloud and to every other device. It is idempotent — a
 * healthy document is left untouched and no Yjs update is emitted.
 */

import type {
  AllotmentData,
  SeasonRecord,
  AreaSeason,
  Planting,
} from '@/types/unified-allotment'

/** Structural clone via JSON — detaches a value before re-inserting it into a
 * different parent (a Y.Map cannot live in two places at once). */
function clonePlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/** Push clones of every `source` item onto `target` (a plain or proxy array). */
function appendClones<T>(target: T[], source: readonly T[] | undefined): void {
  if (!source) return
  for (const item of source) target.push(clonePlain(item))
}

/**
 * Copy each listed field from `source` onto `target` where `target` does not
 * already have a value. Object/array values are cloned (a Y.Map cannot be
 * shared between parents). Used to preserve a dropped duplicate's fields on the
 * kept copy instead of silently discarding them.
 */
function fillMissing<T extends object, K extends keyof T>(target: T, source: T, keys: K[]): void {
  for (const key of keys) {
    if (target[key] !== undefined || source[key] === undefined) continue
    const value = source[key]
    target[key] = (typeof value === 'object' && value !== null ? clonePlain(value) : value) as T[K]
  }
}

/**
 * Remove later entries whose key was already seen, keeping the first
 * occurrence. Splices in place (works on a plain array or a SyncedStore proxy
 * array). Returns whether anything was removed.
 */
function dedupeArrayInPlace<T>(array: T[], key: (item: T) => string | number): boolean {
  const seen = new Set<string | number>()
  const removeAt: number[] = []
  for (let i = 0; i < array.length; i++) {
    const k = key(array[i])
    if (seen.has(k)) removeAt.push(i)
    else seen.add(k)
  }
  if (removeAt.length === 0) return false
  // Splice highest-index first so earlier indices stay valid.
  for (let i = removeAt.length - 1; i >= 0; i--) array.splice(removeAt[i], 1)
  return true
}

/**
 * Collapse the areas of a single season by `areaId`, in place. When the same
 * area appears twice, the extra copy's id'd child arrays (plantings, notes,
 * careLogs) are unioned into the kept copy and any scalar/object field the kept
 * copy is missing (rotationGroup, harvest totals, gridPosition) is filled from
 * it — so a diverged duplicate loses nothing — before the duplicate area is
 * spliced out. The unioned child arrays are then deduped by id.
 */
function mergeAreaSeasonsInPlace(areas: AreaSeason[]): boolean {
  let changed = false
  const byAreaId = new Map<string, AreaSeason>()
  const removeAt: number[] = []

  for (let i = 0; i < areas.length; i++) {
    const area = areas[i]
    const existing = byAreaId.get(area.areaId)
    if (!existing) {
      byAreaId.set(area.areaId, area)
      continue
    }
    removeAt.push(i)
    changed = true
    appendClones(existing.plantings, area.plantings)
    if (area.notes?.length) {
      if (!existing.notes) existing.notes = []
      appendClones(existing.notes, area.notes)
    }
    if (area.careLogs?.length) {
      if (!existing.careLogs) existing.careLogs = []
      appendClones(existing.careLogs, area.careLogs)
    }
    fillMissing(existing, area, ['rotationGroup', 'harvestTotal', 'harvestUnit', 'gridPosition'])
  }
  for (let i = removeAt.length - 1; i >= 0; i--) areas.splice(removeAt[i], 1)

  for (const area of areas) {
    if (dedupeArrayInPlace<Planting>(area.plantings, (p) => p.id)) changed = true
    if (area.notes && dedupeArrayInPlace(area.notes, (n) => n.id)) changed = true
    if (area.careLogs && dedupeArrayInPlace(area.careLogs, (c) => c.id)) changed = true
  }
  return changed
}

/**
 * Collapse seasons by `year`, in place. A duplicate same-year season has its
 * areas cloned into the kept season (which `mergeAreaSeasonsInPlace` then folds
 * together, unioning plantings) before the duplicate season is spliced out. The
 * kept season's metadata is merged conservatively so a diverged duplicate loses
 * nothing: earliest `createdAt`, latest `updatedAt`, and `status`/`notes`
 * filled if the kept copy lacks them.
 */
function mergeSeasonsInPlace(seasons: SeasonRecord[]): boolean {
  let changed = false
  const byYear = new Map<number, SeasonRecord>()
  const removeAt: number[] = []

  for (let i = 0; i < seasons.length; i++) {
    const season = seasons[i]
    const existing = byYear.get(season.year)
    if (!existing) {
      byYear.set(season.year, season)
      continue
    }
    removeAt.push(i)
    changed = true
    appendClones(existing.areas, season.areas)
    if (season.createdAt && (!existing.createdAt || season.createdAt < existing.createdAt)) {
      existing.createdAt = season.createdAt
    }
    if (season.updatedAt && (!existing.updatedAt || season.updatedAt > existing.updatedAt)) {
      existing.updatedAt = season.updatedAt
    }
    fillMissing(existing, season, ['status', 'notes'])
  }
  for (let i = removeAt.length - 1; i >= 0; i--) seasons.splice(removeAt[i], 1)

  for (const season of seasons) {
    if (mergeAreaSeasonsInPlace(season.areas)) changed = true
  }
  return changed
}

/**
 * The collections of an allotment, by reference. Accepts the live SyncedStore
 * arrays (`dedupeStore`) or a detached clone's arrays (`dedupeAllotmentData`).
 */
export interface AllotmentCollections {
  areas: { id: string }[]
  seasons: SeasonRecord[]
  varieties?: { id: string }[]
  compost?: { id: string }[]
  customTasks?: { id: string }[]
  maintenanceTasks?: { id: string }[]
  gardenEvents?: { id: string }[]
}

/**
 * De-duplicate every id-keyed collection in place and return whether anything
 * changed. `false` means the input was already clean — callers use it to skip a
 * redundant persist/push. Mutates the arrays passed in.
 */
export function dedupeAllotmentCollections(c: AllotmentCollections): boolean {
  let changed = false
  if (dedupeArrayInPlace(c.areas, (a) => a.id)) changed = true
  if (c.varieties && dedupeArrayInPlace(c.varieties, (v) => v.id)) changed = true
  if (c.compost && dedupeArrayInPlace(c.compost, (x) => x.id)) changed = true
  if (c.customTasks && dedupeArrayInPlace(c.customTasks, (t) => t.id)) changed = true
  if (c.maintenanceTasks && dedupeArrayInPlace(c.maintenanceTasks, (t) => t.id)) changed = true
  if (c.gardenEvents && dedupeArrayInPlace(c.gardenEvents, (e) => e.id)) changed = true
  if (mergeSeasonsInPlace(c.seasons)) changed = true
  return changed
}

/**
 * Pure de-duplication over a plain `AllotmentData`: returns a de-duplicated
 * copy and whether anything changed. Operates on a structural clone, so the
 * input is never mutated. Used in tests and any non-store call site;
 * `dedupeStore` runs the same logic directly against the live document.
 */
export function dedupeAllotmentData(data: AllotmentData): { data: AllotmentData; changed: boolean } {
  const clone: AllotmentData = clonePlain(data)
  const changed = dedupeAllotmentCollections({
    areas: clone.layout.areas ?? [],
    seasons: clone.seasons ?? [],
    varieties: clone.varieties,
    compost: clone.compost,
    customTasks: clone.customTasks,
    maintenanceTasks: clone.maintenanceTasks,
    gardenEvents: clone.gardenEvents,
  })
  return { data: clone, changed }
}
