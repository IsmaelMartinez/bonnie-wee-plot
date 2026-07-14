/**
 * Season narration client (Phase 2c).
 *
 * Turns the deterministic findings[] into a few paragraphs of prose via a
 * user-configured, OpenAI-compatible chat endpoint — local Ollama by default.
 * Strictly opt-in and ephemeral: nothing here runs unless the user presses
 * Generate on /season-review, the request goes straight from the browser to
 * the endpoint the user configured (no app server in the path), and the
 * result is never persisted anywhere.
 *
 * The findings are the ONLY season data the model sees — plus the allotment
 * name and year. Coordinates never appear in findings and are never sent.
 * The prose is decoration, not information: every draft is checked by
 * `verifyNarration` (narration-verify.ts) and discarded if it contains any
 * number the findings don't vouch for.
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
const NARRATION_TEMPERATURE = 0.2
const NARRATION_MAX_TOKENS = 700

const SYSTEM_PROMPT = `You write a short season summary for an allotment gardener's journal.

You will be given a JSON array of verified findings about one growing season. The findings are your only source of truth.

Rules — follow every one:
- Use only what the findings state. Do not add advice, causes, events or observations of your own.
- Never write a number that does not appear in the findings. Copy numbers exactly as written — no rounding, no converting units, no arithmetic of your own.
- Do not mention coordinates or any location.
- Write 2 to 4 short paragraphs of plain prose addressed to the gardener. No headings, no bullet points, no markdown.`

/**
 * The exact findings payload sent to the model: severity, summary, metrics,
 * entity display names and dates — nothing else from the season, and never
 * coordinates (findings can't contain them by construction).
 */
function findingsPayload(findings: Finding[]): unknown[] {
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

/** Build the chat messages. Exported for tests. */
export function buildNarrationMessages(
  findings: Finding[],
  meta: NarrationMeta
): ChatMessage[] {
  const lines = [
    meta.allotmentName ? `Allotment: ${meta.allotmentName}` : null,
    `Season: ${meta.year}`,
    'Findings (JSON):',
    JSON.stringify(findingsPayload(findings), null, 2),
  ].filter((line): line is string => line !== null)
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: lines.join('\n') },
  ]
}

/**
 * Call the configured chat-completions endpoint and return the raw draft.
 * Throws on network failure, non-OK status, or an empty completion.
 */
export async function requestNarration(
  findings: Finding[],
  meta: NarrationMeta,
  settings: NarrationSettings,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const url = `${settings.baseUrl.replace(/\/+$/, '')}/chat/completions`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (settings.apiKey) {
    headers['Authorization'] = `Bearer ${settings.apiKey}`
  }

  const response = await fetchImpl(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: settings.model,
      messages: buildNarrationMessages(findings, meta),
      temperature: NARRATION_TEMPERATURE,
      max_tokens: NARRATION_MAX_TOKENS,
      stream: false,
    }),
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
  fetchImpl: typeof fetch = fetch
): Promise<NarrationResult> {
  const text = await requestNarration(findings, meta, settings, fetchImpl)
  const verification = verifyNarration(text, findings, { year: meta.year })
  if (!verification.ok) {
    return { status: 'rejected', text, unverifiedNumbers: verification.unverifiedNumbers }
  }
  return { status: 'ok', text }
}
