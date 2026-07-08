// @vitest-environment node
/**
 * ADR 027 Step 4 — real-PostgREST BYTEA round-trip (guarded integration test).
 *
 * The unit suite (`supabase-sync-binary.test.ts`) mocks the Supabase client, so
 * it proves the hex codec is internally consistent but NOT that a `bytea` column
 * survives the PostgREST wire encoding byte-identically. This test closes that
 * gap: it drives the *real* `pushBinary` / `fetchRemoteBinary` (via
 * `createAuthClient` → `@supabase/supabase-js` → PostgREST) against a live
 * Postgres+PostgREST stack, so any "PostgREST bytea surprise" (the runbook's
 * stated risk) is caught before real users migrate.
 *
 * It is GUARDED: it skips unless `BYTEA_REST_URL` is set, so it never runs in
 * the normal `npm run test:unit` / CI path (no network, no live DB there). To
 * run it against a disposable stack, see
 * `docs/runbooks/adr-027-step-4-yjs-binary-migration.md` ("Verifying the BYTEA
 * round-trip against real PostgREST"). Required env:
 *   BYTEA_REST_URL      — PostgREST base URL (Supabase REST endpoint shape)
 *   BYTEA_REST_ANON_KEY — anon key / apikey (any non-empty string for local PostgREST)
 *   BYTEA_REST_JWT      — a Bearer JWT whose `sub` matches the row's user_id
 *                         (role claim `authenticated`)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  bytesToPgHex,
  pgHexToBytes,
  fetchRemoteBinary,
  pushBinary,
} from '@/lib/supabase/sync-binary'
import { createAuthClient } from '@/lib/supabase/client'
import {
  createAllotmentDoc,
  hydrateFromJson,
  serializeToJson,
  encodeDocState,
  decodeDocState,
} from '@/lib/yjs/allotment-yjs'
import type { AllotmentData } from '@/types/unified-allotment'

const REST_URL = process.env.BYTEA_REST_URL
const ANON_KEY = process.env.BYTEA_REST_ANON_KEY ?? 'anon'
const JWT = process.env.BYTEA_REST_JWT ?? ''
// `sub` inside BYTEA_REST_JWT — RLS matches rows on it.
const USER_ID = process.env.BYTEA_REST_USER_ID ?? 'bytea-roundtrip-user'

function fixture(): AllotmentData {
  return {
    version: 22,
    currentYear: 2026,
    meta: {
      name: 'Round-trip Allotment',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2026-05-12T10:00:00.000Z',
    },
    layout: {
      areas: [
        {
          id: 'bed-a',
          name: 'Bed A',
          kind: 'rotation-bed',
          canHavePlantings: true,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ],
    },
    seasons: [
      {
        year: 2026,
        status: 'current',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-05-12T10:00:00.000Z',
        areas: [{ areaId: 'bed-a', plantings: [] }],
      },
    ],
    customTasks: [],
    maintenanceTasks: [],
    gardenEvents: [],
    varieties: [
      { id: 'var-1', plantId: 'peas', name: 'Kelvedon Wonder', seedsByYear: { 2026: 'have' } },
    ],
    compost: [],
  } as unknown as AllotmentData
}

/** Encode a realistic doc: gives a Uint8Array with 0x00, high bytes, etc. */
function encodedFixture(): { bytes: Uint8Array; json: AllotmentData } {
  const { store, doc } = createAllotmentDoc()
  hydrateFromJson(store, fixture())
  return { bytes: encodeDocState(doc), json: serializeToJson(store) }
}

describe.skipIf(!REST_URL)('BYTEA round-trip against real PostgREST', () => {
  let originalUrl: string | undefined
  let originalAnonKey: string | undefined

  beforeAll(() => {
    // Capture then override — the client reads these at call time.
    originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    process.env.NEXT_PUBLIC_SUPABASE_URL = REST_URL
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ANON_KEY
  })

  afterAll(async () => {
    // Best-effort cleanup so the test is re-runnable.
    try {
      const client = createAuthClient(JWT)
      await client.from('allotments').delete().eq('user_id', USER_ID)
    } catch {
      /* ignore */
    }
    // Restore globals so this file does not leak config into other tests
    // sharing the Vitest process.
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey
  })

  it('pure hex codec matches Postgres bytea output for a known vector', () => {
    const bytes = new Uint8Array([0, 1, 15, 16, 127, 128, 255, 42])
    expect(bytesToPgHex(bytes)).toBe('\\x00010f107f80ff2a')
    expect(Array.from(pgHexToBytes('\\x00010f107f80ff2a'))).toEqual(Array.from(bytes))
  })

  it('inserts an encoded Yjs update and reads it back byte-identical', async () => {
    const { bytes, json } = encodedFixture()

    // Clean slate.
    await createAuthClient(JWT).from('allotments').delete().eq('user_id', USER_ID)

    const insert = await pushBinary(JWT, USER_ID, bytes, json, {
      rowExists: false,
      expectedYjsUpdatedAt: null,
    })
    expect(insert.ok).toBe(true)
    expect(insert.casConflict).toBe(false)
    expect(insert.yjsUpdatedAt).toBeTruthy()

    const remote = await fetchRemoteBinary(JWT, USER_ID)
    expect(remote.exists).toBe(true)
    expect(remote.update).not.toBeNull()

    // The bytes that came back over PostgREST must equal what we sent — this is
    // the actual "no bytea encoding surprise" assertion.
    expect(Array.from(remote.update!)).toEqual(Array.from(bytes))

    // And the round-tripped bytes still decode to the original document.
    const { store: decoded } = decodeDocState(remote.update!)
    expect(serializeToJson(decoded)).toEqual(json)

    // JSONB mirror survived too.
    expect(remote.jsonb).toEqual(json)
    // CAS token is the row's yjs_updated_at.
    expect(remote.yjsUpdatedAt).toBe(insert.yjsUpdatedAt)
  })

  it('a second edit updates the same row with a fresh CAS token', async () => {
    const first = await fetchRemoteBinary(JWT, USER_ID)
    expect(first.exists).toBe(true)

    const edited = fixture()
    edited.meta.name = 'Edited name'
    const { store, doc } = createAllotmentDoc()
    hydrateFromJson(store, edited)
    const bytes = encodeDocState(doc)

    const res = await pushBinary(JWT, USER_ID, bytes, serializeToJson(store), {
      rowExists: true,
      expectedYjsUpdatedAt: first.yjsUpdatedAt,
    })
    expect(res.ok).toBe(true)
    expect(res.yjsUpdatedAt).not.toBe(first.yjsUpdatedAt)

    const after = await fetchRemoteBinary(JWT, USER_ID)
    expect(Array.from(after.update!)).toEqual(Array.from(bytes))
    expect(after.jsonb?.meta.name).toBe('Edited name')
  })

  it('a stale CAS token is rejected (casConflict), serialising concurrent writers', async () => {
    const current = await fetchRemoteBinary(JWT, USER_ID)
    const { bytes, json } = encodedFixture()

    const res = await pushBinary(JWT, USER_ID, bytes, json, {
      rowExists: true,
      expectedYjsUpdatedAt: '2000-01-01T00:00:00.000Z', // stale
    })
    expect(res.ok).toBe(false)
    expect(res.casConflict).toBe(true)

    // The row is untouched by the losing write.
    const unchanged = await fetchRemoteBinary(JWT, USER_ID)
    expect(unchanged.yjsUpdatedAt).toBe(current.yjsUpdatedAt)
  })

  // ---- lazy per-user JSONB -> binary migration (ADR 027 Step 4) -----------
  // Reproduces a pre-migration row (only `data` JSONB, `yjs_state IS NULL`)
  // and drives the client-side migration `useCloudSync` performs on first sync.

  /** Seed a pre-migration row: JSONB only, no binary, no CAS token. */
  async function seedJsonbOnlyRow(json: AllotmentData): Promise<void> {
    const client = createAuthClient(JWT)
    await client.from('allotments').delete().eq('user_id', USER_ID)
    const { error } = await client
      .from('allotments')
      .insert({ user_id: USER_ID, data: json })
    if (error) throw new Error(error.message)
  }

  it('lazy migration: a JSONB-only row is detected as un-migrated', async () => {
    await seedJsonbOnlyRow(fixture())
    const remote = await fetchRemoteBinary(JWT, USER_ID)
    expect(remote.exists).toBe(true)
    expect(remote.update).toBeNull() // no yjs_state yet
    expect(remote.yjsUpdatedAt).toBeNull() // pre-migration CAS token
    expect(remote.jsonb).toEqual(fixture()) // JSONB migration source present
  })

  it('lazy migration: first sync CAS-seeds yjs_state from the JSONB (IS NULL predicate)', async () => {
    await seedJsonbOnlyRow(fixture())
    const remote = await fetchRemoteBinary(JWT, USER_ID)

    // Client migration: hydrate the doc from JSONB, encode, CAS-seed the binary
    // with `expectedYjsUpdatedAt: null` (the `is.null` predicate).
    const { store, doc } = createAllotmentDoc()
    hydrateFromJson(store, remote.jsonb!)
    const bytes = encodeDocState(doc)
    const res = await pushBinary(JWT, USER_ID, bytes, serializeToJson(store), {
      rowExists: true,
      expectedYjsUpdatedAt: null,
    })
    expect(res.ok).toBe(true)
    expect(res.casConflict).toBe(false)

    // yjs_state is now populated and decodes back to the original content.
    const after = await fetchRemoteBinary(JWT, USER_ID)
    expect(after.update).not.toBeNull()
    expect(after.yjsUpdatedAt).toBeTruthy()
    const { store: decoded } = decodeDocState(after.update!)
    expect(serializeToJson(decoded)).toEqual(fixture())
  })

  it('concurrent migrations: CAS serialises two racing devices to one lineage', async () => {
    await seedJsonbOnlyRow(fixture())
    // Both devices fetch the same pre-migration row (both see yjs_updated_at=null).
    const remote = await fetchRemoteBinary(JWT, USER_ID)
    expect(remote.yjsUpdatedAt).toBeNull()

    const migrate = async () => {
      const { store, doc } = createAllotmentDoc()
      hydrateFromJson(store, remote.jsonb!)
      return pushBinary(JWT, USER_ID, encodeDocState(doc), serializeToJson(store), {
        rowExists: true,
        expectedYjsUpdatedAt: null, // both race on the IS NULL predicate
      })
    }

    // Two devices migrate concurrently; the IS NULL CAS predicate matches for
    // exactly one — the other must lose and re-adopt.
    const [r1, r2] = await Promise.all([migrate(), migrate()])
    const winners = [r1, r2].filter((r) => r.ok)
    const losers = [r1, r2].filter((r) => r.casConflict)
    expect(winners).toHaveLength(1)
    expect(losers).toHaveLength(1)

    // The row now has exactly one binary lineage (a single CAS token).
    const final = await fetchRemoteBinary(JWT, USER_ID)
    expect(final.update).not.toBeNull()
    expect(final.yjsUpdatedAt).toBe(winners[0].yjsUpdatedAt)
  })
})
