/**
 * Season narration client (Phase 2c).
 *
 * Turns the deterministic findings[] into a few paragraphs of prose via one
 * of two paths, both strictly opt-in and ephemeral (nothing runs unless the
 * user presses Generate on /season-review, and the result is never persisted
 * anywhere):
 *
 * - `narrateSeason` — a user-configured, OpenAI-compatible chat endpoint,
 *   local Ollama by default. Browser → endpoint directly, no app server in
 *   the path.
 * - `narrateSeasonHosted` — the app's own /api/season-narration route, which
 *   proxies to the server-side Gemini free tier for signed-in users (shared
 *   monthly quota with Aitor). This is what makes narration work in the
 *   deployed app, where a server can never reach a user's localhost.
 *
 * On both paths the findings are the ONLY season data the model sees — plus
 * the allotment name and year. Coordinates never appear in findings and are
 * never sent, and internal ids are stripped by `toNarrationPayload` before
 * anything leaves this module. The prose is decoration, not information:
 * every draft is checked by `verifyNarration` (narration-verify.ts) and
 * discarded if it contains any number the findings don't vouch for.
 */

import type { Finding } from './findings'
import { verifyNarration } from './narration-verify'

export interface NarrationSettings {
  /** OpenAI-compatible base URL, e.g. "http://localhost:11434/v1". */
  baseUrl: string
  /** Model name as the endpoint knows it, e.g. "llama3.2". */
  model: string
  /** Optional bearer token for hosted OpenAI-compatible endpoints. */
  apiKey?: string
}

/** The default preset: a local Ollama server. No key, nothing leaves the machine. */
export const OLLAMA_PRESET: NarrationSettings = {
  baseUrl: 'http://localhost:11434/v1',
  model: 'llama3.2',
}

export interface NarrationMeta {
  year: number
  allotmentName?: string
}

export type NarrationResult =
  | { status: 'ok'; text: string }
  | { status: 'rejected'; text: string; unverifiedNumbers: string[] }

/** Low temperature: the job is faithful restatement, not creativity. */
export const NARRATION_TEMPERATURE = 0.2
const NARRATION_MAX_TOKENS = 700
/** Generous — a cold local model may need to load first — but never infinite. */
const NARRATION_TIMEOUT_MS = 60_000

const SYSTEM_PROMPT = `You write a short season summary for an allotment gardener's journal.

You will be given a JSON array of verified findings about one growing season. The findings are your only source of truth.

Rules — follow every one:
- Use only what the findings state. Do not add advice, causes, events or observations of your own.
- Never write a number that does not appear in the findings. Copy numbers exactly as written — no rounding, no converting units, no arithmetic of your own.
- Do not mention coordinates or any location.
- Write 2 to 4 short paragraphs of plain prose addressed to the gardener. No headings, no bullet points, no markdown.`

/** A finding entity as narration sees it: display names only, no ids. */
export interface NarrationEntityPayload {
  areaName?: string
  plantName?: string
  varietyName?: string
}

/**
 * The wire shape of one finding as narration sees it — the narration payload
 * contract. No internal ids (finding, rule, area, planting, plant) and never
 * coordinates. `Finding` is structurally assignable to this, so callers can
 * pass raw findings and the mapping in `toNarrationPayload` does the strip.
 */
export interface NarrationFindingPayload {
  severity: string
  summary: string
  metrics: Record<string, number | string>
  entities: NarrationEntityPayload[]
  dates?: { start?: string; end?: string }
}

/**
 * The exact findings payload sent to the model: severity, summary, metrics,
 * entity display names and dates — nothing else from the season, and never
 * coordinates (findings can't contain them by construction). Both the direct
 * client and the hosted route build their prompts from this.
 */
export function toNarrationPayload(
  findings: NarrationFindingPayload[]
): NarrationFindingPayload[] {
  return findings.map((f) => ({
    severity: f.severity,
    summary: f.summary,
    metrics: f.metrics,
    entities: f.entities.map((e) => ({
      areaName: e.areaName,
      plantName: e.plantName,
      varietyName: e.varietyName,
    })),
    dates: f.dates,
  }))
}

export interface ChatMessage {
  role: 'system' | 'user'
  content: string
}

/** Build the chat messages. Used by the hosted route too; exported for tests. */
export function buildNarrationMessages(
  findings: NarrationFindingPayload[],
  meta: NarrationMeta
): ChatMessage[] {
  const lines = [
    meta.allotmentName ? `Allotment: ${meta.allotmentName}` : null,
    `Season: ${meta.year}`,
    'Findings (JSON):',
    // Compact — pretty-printing only spends context window, which is scarce
    // on small local models.
    JSON.stringify(toNarrationPayload(findings)),
  ].filter((line): line is string => line !== null)
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: lines.join('\n') },
  ]
}

export interface NarrationRequestOptions {
  /** External cancellation (e.g. the inputs changed and the draft is moot). */
  signal?: AbortSignal
}

/**
 * A fetch signal that fires on either the narration timeout or the caller's
 * own signal — a hung endpoint must fail predictably rather than pin the UI
 * on "Writing…" forever, and a superseded request is actively cancelled, not
 * just ignored. Throws immediately when the caller's signal is already
 * aborted. `cleanup` must run once the fetch settles.
 */
function linkAbortSignals(external?: AbortSignal): {
  signal: AbortSignal
  cleanup: () => void
} {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), NARRATION_TIMEOUT_MS)
  const abortFromCaller = () => controller.abort()
  if (external?.aborted) {
    clearTimeout(timeoutId)
    throw new DOMException('The operation was aborted.', 'AbortError')
  }
  external?.addEventListener('abort', abortFromCaller)
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId)
      external?.removeEventListener('abort', abortFromCaller)
    },
  }
}

/**
 * Call the configured chat-completions endpoint and return the raw draft.
 * Throws on network failure, non-OK status, or an empty completion.
 */
export async function requestNarration(
  findings: Finding[],
  meta: NarrationMeta,
  settings: NarrationSettings,
  fetchImpl: typeof fetch = fetch,
  options: NarrationRequestOptions = {}
): Promise<string> {
  // Trim and validate defensively — the UI does too, but this function is
  // exported. A missing or non-absolute base URL is refused outright: it
  // would resolve to a *relative* "/chat/completions" and silently post the
  // findings to this app's own origin, breaking the no-app-server-in-the-path
  // contract.
  const baseUrl = settings.baseUrl.trim().replace(/\/+$/, '')
  if (!baseUrl) {
    throw new Error('Narration endpoint base URL is required')
  }
  let parsedBase: URL
  try {
    parsedBase = new URL(baseUrl)
  } catch {
    throw new Error(
      `Narration endpoint base URL must be absolute (e.g. "${OLLAMA_PRESET.baseUrl}"), got "${baseUrl}"`
    )
  }
  if (parsedBase.protocol !== 'http:' && parsedBase.protocol !== 'https:') {
    throw new Error(
      `Narration endpoint base URL must use http or https, got "${parsedBase.protocol}"`
    )
  }
  const url = `${baseUrl}/chat/completions`
  const model = settings.model.trim()
  if (!model) {
    throw new Error('Narration model is required')
  }
  const apiKey = settings.apiKey?.trim()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  const { signal, cleanup } = linkAbortSignals(options.signal)

  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: buildNarrationMessages(findings, meta),
        temperature: NARRATION_TEMPERATURE,
        max_tokens: NARRATION_MAX_TOKENS,
        stream: false,
      }),
      signal,
    })

    if (!response.ok) {
      let detail = ''
      try {
        const body = (await response.json()) as { error?: { message?: string } | string }
        detail =
          typeof body.error === 'string' ? body.error : body.error?.message ?? ''
      } catch {
        // Non-JSON error body — the status alone will have to do.
      }
      throw new Error(
        `Narration endpoint returned ${response.status}${detail ? `: ${detail}` : ''}`
      )
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>
    }
    const content = data.choices?.[0]?.message?.content
    if (!content || !content.trim()) {
      throw new Error('Narration endpoint returned an empty completion')
    }
    return content.trim()
  } finally {
    cleanup()
  }
}

/** The verification gate every draft passes through, whichever path produced it. */
function verifyDraft(
  text: string,
  findings: Finding[],
  meta: NarrationMeta
): NarrationResult {
  const verification = verifyNarration(text, findings, {
    year: meta.year,
    allotmentName: meta.allotmentName,
  })
  if (!verification.ok) {
    return { status: 'rejected', text, unverifiedNumbers: verification.unverifiedNumbers }
  }
  return { status: 'ok', text }
}

/**
 * Generate a narration and verify it. Returns `ok` with the prose when every
 * number is vouched for by the findings, or `rejected` (caller falls back to
 * the plain findings list) when the draft invented any quantity. Network and
 * endpoint errors propagate as exceptions.
 */
export async function narrateSeason(
  findings: Finding[],
  meta: NarrationMeta,
  settings: NarrationSettings,
  fetchImpl: typeof fetch = fetch,
  options: NarrationRequestOptions = {}
): Promise<NarrationResult> {
  const text = await requestNarration(findings, meta, settings, fetchImpl, options)
  return verifyDraft(text, findings, meta)
}

/** Same-origin route backing the hosted (server-side free tier) path. */
export const HOSTED_NARRATION_PATH = '/api/season-narration'

/**
 * A non-OK response from the hosted narration route. `quotaExceeded` is true
 * when the 429 was the monthly free-tier quota (shared with Aitor) running
 * out — the UI renders that case as guidance, not as a failure.
 */
export class HostedNarrationError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly quotaExceeded: boolean = false
  ) {
    super(message)
    this.name = 'HostedNarrationError'
  }
}

/**
 * Call the app's own /api/season-narration route (server-side Gemini free
 * tier, signed-in users only) and return the raw draft. Sends the stripped
 * `toNarrationPayload` shape plus year and allotment name — the same
 * findings-only contract as the direct client, with internal ids removed
 * before the request leaves the browser. Throws `HostedNarrationError` on a
 * non-OK status, and plain errors on network failure or an empty response.
 */
export async function requestHostedNarration(
  findings: Finding[],
  meta: NarrationMeta,
  fetchImpl: typeof fetch = fetch,
  options: NarrationRequestOptions = {}
): Promise<string> {
  const { signal, cleanup } = linkAbortSignals(options.signal)

  try {
    const response = await fetchImpl(HOSTED_NARRATION_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        year: meta.year,
        ...(meta.allotmentName ? { allotmentName: meta.allotmentName } : {}),
        findings: toNarrationPayload(findings),
      }),
      signal,
    })

    if (!response.ok) {
      let message = `Hosted narration returned ${response.status}`
      let quotaExceeded = false
      try {
        const body = (await response.json()) as { error?: string; quotaExceeded?: boolean }
        if (body.error) message = body.error
        quotaExceeded = body.quotaExceeded === true
      } catch {
        // Non-JSON error body — the status alone will have to do.
      }
      throw new HostedNarrationError(message, response.status, quotaExceeded)
    }

    const data = (await response.json()) as { text?: string }
    if (!data.text || !data.text.trim()) {
      throw new Error('Hosted narration returned an empty response')
    }
    return data.text.trim()
  } finally {
    cleanup()
  }
}

/**
 * Hosted twin of `narrateSeason`: fetch a draft from the app's free-tier
 * route, then run it through the exact same `verifyNarration` gate — a
 * failing draft is discarded identically on both paths.
 */
export async function narrateSeasonHosted(
  findings: Finding[],
  meta: NarrationMeta,
  fetchImpl: typeof fetch = fetch,
  options: NarrationRequestOptions = {}
): Promise<NarrationResult> {
  const text = await requestHostedNarration(findings, meta, fetchImpl, options)
  return verifyDraft(text, findings, meta)
}
