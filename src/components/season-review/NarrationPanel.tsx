'use client'

/**
 * Opt-in AI narration for the Season Review page (Phase 2c).
 *
 * Collapsed by default and completely inert until the user opens it and
 * presses Generate — the deterministic findings above are the report, this
 * is optional prose over them. Two providers:
 *
 * - Built-in (signed-in users only): the app's /api/season-narration route,
 *   backed by the server-side Gemini free tier and sharing Aitor's monthly
 *   quota. This is the path that works in the deployed app with no setup.
 * - Your own endpoint (everyone): straight from the browser to whatever
 *   OpenAI-compatible endpoint the user configures — local Ollama by default.
 *
 * On both paths only the findings, allotment name and year are sent (never
 * coordinates or internal ids), the result is ephemeral (shown once, never
 * persisted), and every generated draft is number-checked against the
 * findings (narration-verify.ts); a draft that mentions any number the
 * findings don't vouch for is discarded and the panel says so.
 */

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Sparkles } from 'lucide-react'
import type { Finding } from '@/lib/season-review/findings'
import {
  HostedNarrationError,
  narrateSeason,
  narrateSeasonHosted,
  OLLAMA_PRESET,
  type NarrationSettings,
} from '@/lib/season-review/narration'
import { getStorageItem, setStorageItem } from '@/services/generic-storage'
import { useSessionStorage } from '@/hooks/useSessionStorage'
import { useOptionalAuth } from '@/hooks/useOptionalAuth'

/** Endpoint + model + provider persist across sessions; the optional key is session-only. */
const NARRATION_CONFIG_KEY = 'bwp-narration-config'
const NARRATION_API_KEY_KEY = 'bwp-narration-key'

type NarrationProvider = 'hosted' | 'custom'

interface StoredNarrationConfig {
  baseUrl: string
  model: string
  provider?: NarrationProvider
}

type PanelStatus =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; text: string }
  | { kind: 'rejected'; unverifiedNumbers: string[] }
  | { kind: 'quota'; message: string }
  | { kind: 'error'; message: string }

function friendlyRequestError(error: unknown, baseUrl: string): string {
  const message = error instanceof Error ? error.message : String(error)
  // The client aborts a hung request after its timeout. Duck-type on name —
  // abort rejections are DOMExceptions, which older engines didn't parent
  // under Error.
  if ((error as { name?: unknown } | null)?.name === 'AbortError') {
    return (
      `The request to ${baseUrl} timed out. A local model may just be slow to ` +
      `load or generate on your machine — try again.`
    )
  }
  // fetch() network failures surface as TypeError with an opaque message —
  // translate to the causes a gardener can actually act on.
  if (error instanceof TypeError) {
    return (
      `Couldn't reach ${baseUrl}. If you're using Ollama, check it's running ` +
      `(ollama serve) and allows this site: set OLLAMA_ORIGINS to this app's ` +
      `address. Custom endpoints must also be allowed by the deployment's ` +
      `security policy.`
    )
  }
  return message
}

function friendlyHostedError(error: unknown): string {
  if ((error as { name?: unknown } | null)?.name === 'AbortError') {
    return 'The narration request timed out — try again in a moment.'
  }
  if (error instanceof TypeError) {
    return "Couldn't reach the app's narration service. Check your connection and try again."
  }
  return error instanceof Error ? error.message : String(error)
}

export default function NarrationPanel({
  findings,
  year,
  allotmentName,
}: {
  findings: Finding[]
  year: number
  allotmentName?: string
}) {
  const { isSignedIn } = useOptionalAuth()
  // Signed-in users default to the zero-setup built-in tier; the stored
  // choice (loaded below) wins once they've picked. Signed-out users never
  // see the hosted option and always run the direct client.
  const [provider, setProvider] = useState<NarrationProvider>('hosted')
  const [baseUrl, setBaseUrl] = useState(OLLAMA_PRESET.baseUrl)
  const [model, setModel] = useState(OLLAMA_PRESET.model)
  const [apiKey, setApiKey] = useSessionStorage<string>(NARRATION_API_KEY_KEY, '')
  const [status, setStatus] = useState<PanelStatus>({ kind: 'idle' })

  useEffect(() => {
    const stored = getStorageItem<StoredNarrationConfig>(NARRATION_CONFIG_KEY)
    if (stored?.baseUrl) setBaseUrl(stored.baseUrl)
    if (stored?.model) setModel(stored.model)
    if (stored?.provider === 'hosted' || stored?.provider === 'custom') {
      setProvider(stored.provider)
    }
  }, [])

  const effectiveProvider: NarrationProvider =
    isSignedIn && provider === 'hosted' ? 'hosted' : 'custom'

  const chooseProvider = (next: NarrationProvider) => {
    setProvider(next)
    setStatus({ kind: 'idle' })
    // Persist the current in-memory endpoint/model (state was seeded from
    // storage on mount, so it is at least as fresh) — writing the stored
    // values back would silently revert edits made since.
    setStorageItem<StoredNarrationConfig>(NARRATION_CONFIG_KEY, {
      baseUrl: baseUrl.trim() || OLLAMA_PRESET.baseUrl,
      model: model.trim() || OLLAMA_PRESET.model,
      provider: next,
    })
  }

  // A new year (or freshly recomputed findings) makes old prose stale —
  // narration is ephemeral by design, so simply drop it. Bumping the request
  // generation orphans any in-flight request so its late resolution can't
  // repopulate the panel with prose about the previous inputs, and the abort
  // actively cancels it — no point letting a local model keep generating a
  // draft nobody will see.
  const requestGeneration = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  useEffect(() => {
    requestGeneration.current += 1
    setStatus({ kind: 'idle' })
    // Cleanup covers both a year/findings change and unmount.
    return () => abortRef.current?.abort()
  }, [year, findings])

  const handleGenerate = async () => {
    const generation = ++requestGeneration.current
    abortRef.current?.abort()
    const abortController = new AbortController()
    abortRef.current = abortController
    // Pasted keys often carry stray whitespace, which would corrupt the
    // Authorization header into a confusing auth failure.
    const trimmedKey = apiKey.trim()
    const settings: NarrationSettings = {
      baseUrl: baseUrl.trim() || OLLAMA_PRESET.baseUrl,
      model: model.trim() || OLLAMA_PRESET.model,
      ...(trimmedKey ? { apiKey: trimmedKey } : {}),
    }
    // Signed-out users never chose a provider (the toggle isn't rendered),
    // so persist only a choice they actually made — stamping the signed-in
    // default here would override their real preference for a later session.
    const storedProvider = getStorageItem<StoredNarrationConfig>(NARRATION_CONFIG_KEY)?.provider
    const providerToStore = isSignedIn ? provider : storedProvider
    setStorageItem<StoredNarrationConfig>(NARRATION_CONFIG_KEY, {
      baseUrl: settings.baseUrl,
      model: settings.model,
      ...(providerToStore ? { provider: providerToStore } : {}),
    })
    setStatus({ kind: 'loading' })
    try {
      const result =
        effectiveProvider === 'hosted'
          ? await narrateSeasonHosted(
              findings,
              { year, allotmentName },
              undefined,
              { signal: abortController.signal }
            )
          : await narrateSeason(
              findings,
              { year, allotmentName },
              settings,
              undefined,
              { signal: abortController.signal }
            )
      if (generation !== requestGeneration.current) return
      if (result.status === 'ok') {
        setStatus({ kind: 'ok', text: result.text })
      } else {
        setStatus({ kind: 'rejected', unverifiedNumbers: result.unverifiedNumbers })
      }
    } catch (error) {
      if (generation !== requestGeneration.current) return
      if (error instanceof HostedNarrationError && error.quotaExceeded) {
        setStatus({ kind: 'quota', message: error.message })
      } else if (effectiveProvider === 'hosted') {
        setStatus({ kind: 'error', message: friendlyHostedError(error) })
      } else {
        setStatus({ kind: 'error', message: friendlyRequestError(error, settings.baseUrl) })
      }
    }
  }

  return (
    <details className="zen-card group">
      <summary className="flex items-center gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden p-4 text-sm text-zen-ink-700 hover:bg-zen-stone-50 rounded-zen">
        <Sparkles className="w-4 h-4 text-zen-moss-600" aria-hidden="true" />
        <span className="font-medium">Narrate this season</span>
        <span className="text-zen-stone-400 font-normal">optional — AI summary</span>
      </summary>

      <div className="px-4 pb-4 space-y-4">
        <p className="text-xs text-zen-stone-500">
          Turns the findings above into a few paragraphs of prose. Only the findings and your
          allotment&apos;s name are sent (never your coordinates). Every number in the result is
          checked against the findings; a draft that invents numbers is discarded. Nothing is
          saved.
        </p>

        {isSignedIn && (
          <fieldset>
            <legend className="block text-xs font-medium text-zen-ink-700 mb-2">AI provider</legend>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
              <label className="flex items-center gap-2 text-sm text-zen-ink-700 cursor-pointer">
                <input
                  type="radio"
                  name="narration-provider"
                  value="hosted"
                  checked={provider === 'hosted'}
                  onChange={() => chooseProvider('hosted')}
                  className="accent-zen-moss-600"
                />
                Built-in <span className="text-xs text-zen-stone-400">(free, shares Aitor&apos;s monthly quota)</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-zen-ink-700 cursor-pointer">
                <input
                  type="radio"
                  name="narration-provider"
                  value="custom"
                  checked={provider === 'custom'}
                  onChange={() => chooseProvider('custom')}
                  className="accent-zen-moss-600"
                />
                Your own endpoint <span className="text-xs text-zen-stone-400">(e.g. local Ollama)</span>
              </label>
            </div>
          </fieldset>
        )}

        {effectiveProvider === 'custom' && (
          <>
            <p className="text-xs text-zen-stone-500">
              Uses an AI model you run or choose — by default a local Ollama, so nothing leaves
              your machine. The request goes directly from this browser to the address below.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="narration-base-url" className="block text-xs font-medium text-zen-ink-700 mb-1">
                  Endpoint (OpenAI-compatible)
                </label>
                <input
                  id="narration-base-url"
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={OLLAMA_PRESET.baseUrl}
                  className="w-full px-3 py-2 text-sm border border-zen-stone-200 rounded-zen focus:outline-none focus:ring-2 focus:ring-zen-moss-500 focus:border-transparent"
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="narration-model" className="block text-xs font-medium text-zen-ink-700 mb-1">
                  Model
                </label>
                <input
                  id="narration-model"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={OLLAMA_PRESET.model}
                  className="w-full px-3 py-2 text-sm border border-zen-stone-200 rounded-zen focus:outline-none focus:ring-2 focus:ring-zen-moss-500 focus:border-transparent"
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <label htmlFor="narration-api-key" className="block text-xs font-medium text-zen-ink-700 mb-1">
                API key <span className="text-zen-stone-400 font-normal">(optional — Ollama needs none; kept for this session only)</span>
              </label>
              <input
                id="narration-api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-…"
                className="w-full px-3 py-2 text-sm border border-zen-stone-200 rounded-zen focus:outline-none focus:ring-2 focus:ring-zen-moss-500 focus:border-transparent"
                autoComplete="off"
              />
            </div>
          </>
        )}

        <button
          onClick={handleGenerate}
          disabled={status.kind === 'loading'}
          className="zen-btn-primary min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status.kind === 'loading' ? 'Writing…' : 'Generate narration'}
        </button>

        {status.kind === 'ok' && (
          <div className="rounded-zen border border-zen-moss-200 bg-zen-moss-50 p-4">
            <p className="text-sm text-zen-ink-800 whitespace-pre-line">{status.text}</p>
            <p className="mt-3 text-xs text-zen-moss-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              Verified: every number above appears in the findings.
            </p>
          </div>
        )}

        {status.kind === 'rejected' && (
          <div role="note" className="rounded-zen border border-zen-stone-200 bg-zen-stone-50 p-4 text-sm text-zen-ink-700">
            The model&apos;s draft mentioned numbers that aren&apos;t in the findings
            ({status.unverifiedNumbers.join(', ')}), so it was discarded. The findings above
            are the verified report — you can try generating again.
          </div>
        )}

        {status.kind === 'quota' && (
          <div role="note" className="rounded-zen border border-zen-bamboo-200 bg-zen-bamboo-50 p-4 text-sm text-zen-ink-700 space-y-2">
            <p className="font-medium">Free quota used up</p>
            <p>{status.message}</p>
            <p className="font-medium">Two ways forward:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Switch to <strong>Your own endpoint</strong> above — a local Ollama keeps
                narration free and private.
              </li>
              <li>Or check back on the 1st of next month — your free quota resets then.</li>
            </ul>
          </div>
        )}

        {status.kind === 'error' && (
          <div role="alert" className="rounded-zen border border-zen-kitsune-200 bg-zen-kitsune-50 p-4 text-sm text-zen-ink-700">
            {status.message}
          </div>
        )}
      </div>
    </details>
  )
}
