'use client'

/**
 * Opt-in AI narration for the Season Review page (Phase 2c).
 *
 * Collapsed by default and completely inert until the user opens it and
 * presses Generate — the deterministic findings above are the report, this
 * is optional prose over them. The request goes straight from the browser to
 * whatever OpenAI-compatible endpoint the user configures (local Ollama by
 * default), and the result is ephemeral: shown once, never persisted.
 *
 * Every generated draft is number-checked against the findings
 * (narration-verify.ts); a draft that mentions any number the findings don't
 * vouch for is discarded and the panel says so.
 */

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Sparkles } from 'lucide-react'
import type { Finding } from '@/lib/season-review/findings'
import {
  narrateSeason,
  OLLAMA_PRESET,
  type NarrationSettings,
} from '@/lib/season-review/narration'
import { getStorageItem, setStorageItem } from '@/services/generic-storage'
import { useSessionStorage } from '@/hooks/useSessionStorage'

/** Endpoint + model persist across sessions; the optional key is session-only. */
const NARRATION_CONFIG_KEY = 'bwp-narration-config'
const NARRATION_API_KEY_KEY = 'bwp-narration-key'

interface StoredNarrationConfig {
  baseUrl: string
  model: string
}

type PanelStatus =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; text: string }
  | { kind: 'rejected'; unverifiedNumbers: string[] }
  | { kind: 'error'; message: string }

function friendlyRequestError(error: unknown, baseUrl: string): string {
  const message = error instanceof Error ? error.message : String(error)
  // The client aborts a hung request after its timeout.
  if (error instanceof Error && error.name === 'AbortError') {
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

export default function NarrationPanel({
  findings,
  year,
  allotmentName,
}: {
  findings: Finding[]
  year: number
  allotmentName?: string
}) {
  const [baseUrl, setBaseUrl] = useState(OLLAMA_PRESET.baseUrl)
  const [model, setModel] = useState(OLLAMA_PRESET.model)
  const [apiKey, setApiKey] = useSessionStorage<string>(NARRATION_API_KEY_KEY, '')
  const [status, setStatus] = useState<PanelStatus>({ kind: 'idle' })

  useEffect(() => {
    const stored = getStorageItem<StoredNarrationConfig>(NARRATION_CONFIG_KEY)
    if (stored?.baseUrl) setBaseUrl(stored.baseUrl)
    if (stored?.model) setModel(stored.model)
  }, [])

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
    setStorageItem<StoredNarrationConfig>(NARRATION_CONFIG_KEY, {
      baseUrl: settings.baseUrl,
      model: settings.model,
    })
    setStatus({ kind: 'loading' })
    try {
      const result = await narrateSeason(
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
      setStatus({ kind: 'error', message: friendlyRequestError(error, settings.baseUrl) })
    }
  }

  return (
    <details className="zen-card group">
      <summary className="flex items-center gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden p-4 text-sm text-zen-ink-700 hover:bg-zen-stone-50 rounded-zen">
        <Sparkles className="w-4 h-4 text-zen-moss-600" aria-hidden="true" />
        <span className="font-medium">Narrate this season</span>
        <span className="text-zen-stone-400 font-normal">optional — bring your own AI</span>
      </summary>

      <div className="px-4 pb-4 space-y-4">
        <p className="text-xs text-zen-stone-500">
          Turns the findings above into a few paragraphs of prose using an AI model you run or
          choose — by default a local Ollama, so nothing leaves your machine. Only the findings
          and your allotment&apos;s name are sent (never your coordinates), directly from this
          browser to the address below. Every number in the result is checked against the
          findings; a draft that invents numbers is discarded. Nothing is saved.
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

        {status.kind === 'error' && (
          <div role="alert" className="rounded-zen border border-zen-kitsune-200 bg-zen-kitsune-50 p-4 text-sm text-zen-ink-700">
            {status.message}
          </div>
        )}
      </div>
    </details>
  )
}
