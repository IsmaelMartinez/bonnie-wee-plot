import type { BrowserContext, Route } from '@playwright/test'

/**
 * In-memory stub of the Supabase REST (PostgREST) endpoint for the
 * cross-device sync e2e. It models the exact request shapes
 * `src/lib/supabase/sync-binary.ts` produces:
 *
 *   - GET  /rest/v1/allotments?select=...&user_id=eq.<uid>   (`.single()`)
 *   - POST /rest/v1/allotments                                (insert)
 *   - PATCH /rest/v1/allotments?user_id=eq.<uid>&yjs_updated_at=eq.<tok|is.null>
 *
 * It stores one row per `user_id` with `{ yjs_state, yjs_updated_at, data }`
 * and enforces optimistic-concurrency (CAS) exactly like the `yjs_updated_at`
 * predicate: a PATCH lands only when the stored token matches the query
 * predicate, otherwise it returns zero rows (which the codec reads as
 * `casConflict`). The `yjs_state` hex string is stored verbatim — the whole
 * point is that the client's bytea hex survives a round-trip unchanged.
 *
 * A single `SupabaseStub` instance is shared across BOTH browser contexts so
 * the two "devices" read and write the same cloud row.
 */

interface Row {
  user_id: string
  yjs_state: string
  yjs_updated_at: string
  data: unknown
}

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Expose-Headers': '*',
}

export class SupabaseStub {
  private rows = new Map<string, Row>()
  private seq = 0
  /** Count of writes that actually landed — lets the test await sync progress. */
  public writes = 0

  private nextToken(): string {
    this.seq += 1
    return `srv-token-${this.seq}`
  }

  /** Attach the stub's route handler to a browser context. */
  async attach(context: BrowserContext): Promise<void> {
    await context.route('**/rest/v1/**', (route) => this.handle(route))
  }

  getRow(userId: string): Row | undefined {
    return this.rows.get(userId)
  }

  private json(route: Route, status: number, body: unknown) {
    return route.fulfill({
      status,
      headers: { 'Content-Type': 'application/json', ...CORS },
      body: JSON.stringify(body),
    })
  }

  private async handle(route: Route): Promise<void> {
    const req = route.request()
    const method = req.method()

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS })
      return
    }

    const url = new URL(req.url())
    const params = url.searchParams
    const userFilter = params.get('user_id') ?? ''
    const userId = userFilter.startsWith('eq.') ? userFilter.slice(3) : ''

    if (method === 'GET') {
      const row = this.rows.get(userId)
      if (!row) {
        // `.single()` on zero rows → PostgREST 406 / PGRST116.
        await this.json(route, 406, {
          code: 'PGRST116',
          message: 'JSON object requested, multiple (or no) rows returned',
          details: 'Results contain 0 rows',
        })
        return
      }
      await this.json(route, 200, {
        yjs_state: row.yjs_state,
        yjs_updated_at: row.yjs_updated_at,
        data: row.data,
      })
      return
    }

    const body = req.postData() ? JSON.parse(req.postData() as string) : {}

    if (method === 'POST') {
      const id = body.user_id as string
      if (this.rows.has(id)) {
        // unique_violation — a row for this user already exists.
        await this.json(route, 409, { code: '23505', message: 'duplicate key value' })
        return
      }
      const token = this.nextToken()
      this.rows.set(id, {
        user_id: id,
        yjs_state: body.yjs_state,
        yjs_updated_at: token,
        data: body.data,
      })
      this.writes += 1
      // `.select('yjs_updated_at').single()` → single object.
      await this.json(route, 201, { yjs_updated_at: token })
      return
    }

    if (method === 'PATCH') {
      const row = this.rows.get(userId)
      const casFilter = params.get('yjs_updated_at') ?? ''
      const casOk = row
        ? casFilter === 'is.null'
          ? row.yjs_updated_at == null
          : casFilter === `eq.${row.yjs_updated_at}`
        : false
      if (!row || !casOk) {
        // CAS predicate matched no rows → caller re-pulls, re-merges, retries.
        await this.json(route, 200, [])
        return
      }
      const token = this.nextToken()
      row.yjs_state = body.yjs_state
      row.yjs_updated_at = token
      row.data = body.data
      this.writes += 1
      // `.select('yjs_updated_at')` (no single) → array.
      await this.json(route, 200, [{ yjs_updated_at: token }])
      return
    }

    if (method === 'DELETE') {
      this.rows.delete(userId)
      await this.json(route, 204, null)
      return
    }

    await this.json(route, 405, { message: `unhandled ${method}` })
  }
}
