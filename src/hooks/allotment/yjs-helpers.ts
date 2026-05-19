/**
 * Yjs helpers for domain-hook ports (ADR 027 Step 3, PR-B).
 *
 * SyncedStore cannot represent `undefined` values — assigning
 * `undefined` to a Y.Map field throws or silently loses the value
 * depending on the path. The legacy `setData` branches construct
 * AllotmentData snapshots with `undefined` fields freely (TypeScript
 * optionals), and JSON.stringify drops them on the way out to
 * localStorage. The Yjs branches need to strip them at the assignment
 * site instead.
 *
 * These helpers live in their own module so the seven domain-hook
 * ports share one strip-undefined implementation. The legacy
 * `allotment-yjs.ts` module already has an internal `assignDefined`
 * helper but it is not exported, and reshaping that module is out of
 * scope for PR-B (the spec explicitly forbids it). Once Step 5 deletes
 * the legacy chain and the rename to `src/lib/yjs/` lands, the two
 * helpers can be consolidated.
 */

/**
 * Returns a shallow copy of `obj` with `undefined`-valued fields
 * removed. The return type is widened to allow assigning the result
 * into a Yjs-backed slot that has fewer required fields than the
 * input.
 *
 * Use at the push site for Yjs branches that build a record from
 * optional inputs. The generic is widened to `object` (not
 * `Record<string, unknown>`) so the helper accepts typed records like
 * `Planting` or `SeasonRecord` whose fields use literal-string unions
 * rather than bare `string`s.
 */
export function withoutUndefined<T extends object>(obj: T): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value
    }
  }
  return result as T
}

/**
 * Assigns a source object's defined-only fields into a Yjs-backed
 * target object. Skips `undefined` values. Use when patching an
 * existing Y.Map field-by-field from a partial update record (e.g.
 * the `PlantingUpdate` shape).
 */
export function assignDefined<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>,
): void {
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined) {
      ;(target as Record<string, unknown>)[key] = value
    }
  }
}
