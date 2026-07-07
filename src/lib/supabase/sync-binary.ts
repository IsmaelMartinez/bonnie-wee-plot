/**
 * Yjs binary cloud transport (ADR 027 Step 4)
 *
 * The cloud copy of a user's allotment is exchanged as the Yjs document's
 * *binary* CRDT state (`Y.encodeStateAsUpdate`) rather than as full JSON with
 * last-write-wins reconciliation. Concurrent edits merge via `Y.applyUpdate`
 * instead of one side overwriting the other.
 *
 * Storage lives in two columns on `allotments` (see sql/004-allotment-yjs.sql):
 *   - `yjs_state`      BYTEA        — the authoritative encoded doc.
 *   - `yjs_updated_at` TIMESTAMPTZ  — optimistic-concurrency (CAS) token.
 *   - `data`           JSONB        — kept as a derived mirror (history / GDPR
 *                                     export / Studio inspection); written on
 *                                     every push from the merged doc.
 *
 * BYTEA travels over PostgREST as a hex string in Postgres' default `hex`
 * output format (`\x` + lowercase hex). `bytesToPgHex` / `pgHexToBytes` are the
 * boundary conversions.
 */

import { createAuthClient } from './client'
import type { AllotmentData } from '@/types/unified-allotment'

const TABLE = 'allotments'

export interface RemoteBinary {
  /** True when a row exists for this user at all. */
  exists: boolean
  /**
   * Decoded Yjs update for the whole document, or `null` when the row exists
   * but has not been migrated to binary yet (only `data` JSONB is populated).
   */
  update: Uint8Array | null
  /**
   * CAS token — the row's `yjs_updated_at`. `null` when the row exists but
   * `yjs_state` has never been written (the pre-migration state).
   */
  yjsUpdatedAt: string | null
  /**
   * The JSONB mirror. Present on pre-migration rows (the migration source) and
   * kept fresh afterwards. `null` only when the row itself does not exist.
   */
  jsonb: AllotmentData | null
}

export interface PushBinaryOptions {
  /** Whether a row already exists (from the immediately-preceding fetch). */
  rowExists: boolean
  /**
   * The `yjs_updated_at` value the caller last read. The write only lands if
   * the column still matches this (CAS); `null` matches a row whose
   * `yjs_state` was never written (the migration write).
   */
  expectedYjsUpdatedAt: string | null
}

export interface PushBinaryResult {
  /** The write landed. */
  ok: boolean
  /**
   * The CAS predicate did not match (someone wrote between our fetch and
   * write, or a row appeared concurrently). The caller should re-fetch,
   * re-merge, and retry.
   */
  casConflict: boolean
  /** The new CAS token on success. */
  yjsUpdatedAt: string | null
}

const HEX = '0123456789abcdef'

/**
 * Encode bytes as a Postgres `bytea` hex literal (`\x` + lowercase hex) —
 * the format PostgREST accepts for writing and returns when reading.
 */
export function bytesToPgHex(bytes: Uint8Array): string {
  // Build into a pre-allocated array and join once — appending to a string in
  // the loop would allocate an intermediate string per byte, which adds up for
  // larger doc states.
  const len = bytes.length
  const parts = new Array<string>(len)
  for (let i = 0; i < len; i++) {
    const b = bytes[i]
    parts[i] = HEX[b >> 4] + HEX[b & 0x0f]
  }
  return '\\x' + parts.join('')
}

/**
 * Decode a Postgres `bytea` hex string (with or without the leading `\x`)
 * back into bytes.
 */
export function pgHexToBytes(hex: string): Uint8Array {
  const s = hex.startsWith('\\x') ? hex.slice(2) : hex
  const len = s.length >> 1
  const out = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

/**
 * Fetch the user's Yjs binary state (plus the JSONB mirror and CAS token).
 * Returns `exists: false` when the user has no cloud row yet.
 */
export async function fetchRemoteBinary(
  token: string,
  userId: string,
): Promise<RemoteBinary> {
  const client = createAuthClient(token)
  const { data, error } = await client
    .from(TABLE)
    .select('yjs_state, yjs_updated_at, data')
    .eq('user_id', userId)
    .single()

  if (error) {
    // PGRST116 = "no rows returned" — user has no cloud data yet.
    if (error.code === 'PGRST116') {
      return { exists: false, update: null, yjsUpdatedAt: null, jsonb: null }
    }
    throw new Error(error.message)
  }

  const rawState = (data.yjs_state as string | null) ?? null
  return {
    exists: true,
    update: rawState ? pgHexToBytes(rawState) : null,
    yjsUpdatedAt: (data.yjs_updated_at as string | null) ?? null,
    jsonb: (data.data as AllotmentData | null) ?? null,
  }
}

/**
 * Write the merged Yjs state (and the derived JSONB mirror) with
 * optimistic-concurrency control. On an existing row the UPDATE is gated on
 * `yjs_updated_at` still matching `expectedYjsUpdatedAt`; a 0-row result means
 * the CAS failed and the caller must re-pull-merge-retry.
 */
export async function pushBinary(
  token: string,
  userId: string,
  update: Uint8Array,
  jsonMirror: AllotmentData,
  opts: PushBinaryOptions,
): Promise<PushBinaryResult> {
  const client = createAuthClient(token)
  const nowIso = new Date().toISOString()
  const hexState = bytesToPgHex(update)

  const row = {
    yjs_state: hexState,
    yjs_updated_at: nowIso,
    data: jsonMirror,
    updated_at: nowIso,
  }

  if (!opts.rowExists) {
    const { data, error } = await client
      .from(TABLE)
      .insert({ user_id: userId, ...row })
      .select('yjs_updated_at')
      .single()

    if (error) {
      // 23505 = unique_violation: a row for this user appeared concurrently.
      if (error.code === '23505') {
        return { ok: false, casConflict: true, yjsUpdatedAt: null }
      }
      throw new Error(error.message)
    }
    return {
      ok: true,
      casConflict: false,
      yjsUpdatedAt: (data?.yjs_updated_at as string | null) ?? nowIso,
    }
  }

  let query = client.from(TABLE).update(row).eq('user_id', userId)
  query =
    opts.expectedYjsUpdatedAt === null
      ? query.is('yjs_updated_at', null)
      : query.eq('yjs_updated_at', opts.expectedYjsUpdatedAt)

  const { data, error } = await query.select('yjs_updated_at')

  if (error) throw new Error(error.message)
  if (!data || data.length === 0) {
    // CAS predicate matched no rows — someone else wrote first.
    return { ok: false, casConflict: true, yjsUpdatedAt: null }
  }
  return {
    ok: true,
    casConflict: false,
    yjsUpdatedAt: (data[0].yjs_updated_at as string | null) ?? nowIso,
  }
}
