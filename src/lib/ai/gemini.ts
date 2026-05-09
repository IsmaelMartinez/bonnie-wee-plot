/**
 * Gemini provider for the Aitor route.
 *
 * Adapter that takes the same OpenAI-shaped chat request the rest of the
 * route already builds (system prompt + alternating user/assistant messages,
 * optional inline image on the last user message) and returns a plain text
 * response. Tool calling is intentionally NOT supported on this path — the
 * OpenAI provider keeps tools; the Gemini free-tier path is text + vision
 * only for the first cut.
 *
 * Default model is `gemini-2.5-flash` because that's the model Google's
 * generative-language v1beta endpoint is known to serve at the time of
 * writing. Override via the `GEMINI_MODEL` env var to switch to
 * `gemini-3-flash` or any future model name without a code change.
 */
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'

export interface GeminiChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GeminiInlineImage {
  /** MIME type, e.g. `image/jpeg`. */
  type: string
  /** Base64-encoded image data, no `data:` prefix. */
  data: string
}

export interface GeminiCallOptions {
  apiKey: string
  systemPrompt: string
  history: GeminiChatMessage[]
  /** Final user turn — kept separate so we can attach an image to it. */
  userMessage: string
  image?: GeminiInlineImage
  model?: string
  /** Defaults to 1500 to match the existing OpenAI path. */
  maxOutputTokens?: number
  /** Defaults to 0.7. */
  temperature?: number
  /** AbortSignal for the underlying fetch. */
  signal?: AbortSignal
}

export interface GeminiCallResult {
  text: string
  /** Token counts when Gemini returns them; undefined when it doesn't. */
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
}

interface GeminiPart {
  text?: string
  inline_data?: { mime_type: string; data: string }
}

interface GeminiContent {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
    finishReason?: string
  }>
  usageMetadata?: {
    promptTokenCount?: number
    candidatesTokenCount?: number
    totalTokenCount?: number
  }
  error?: { code?: number; message?: string; status?: string }
}

function toGeminiContent(history: GeminiChatMessage[]): GeminiContent[] {
  // Gemini's contents array uses `user` and `model` roles only; the system
  // prompt is carried separately. Drop `system` entries from history (the
  // route only ever passes one and we hoist it via systemInstruction below).
  return history
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))
}

export async function callGemini(options: GeminiCallOptions): Promise<GeminiCallResult> {
  const model = options.model ?? process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL

  const finalUserParts: GeminiPart[] = [{ text: options.userMessage }]
  if (options.image) {
    finalUserParts.push({
      inline_data: { mime_type: options.image.type, data: options.image.data },
    })
  }

  const contents: GeminiContent[] = [
    ...toGeminiContent(options.history),
    { role: 'user', parts: finalUserParts },
  ]

  const body = {
    systemInstruction: { parts: [{ text: options.systemPrompt }] },
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? 1500,
    },
  }

  const url = `${GEMINI_BASE_URL}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(options.apiKey)}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: options.signal,
  })

  if (!response.ok) {
    let errorMessage = `Gemini request failed (${response.status})`
    try {
      const errBody = (await response.json()) as GeminiResponse
      if (errBody.error?.message) errorMessage = errBody.error.message
    } catch {
      // Body wasn't JSON; keep the status-based message.
    }
    const err = new Error(errorMessage)
    ;(err as Error & { status?: number }).status = response.status
    throw err
  }

  const data = (await response.json()) as GeminiResponse
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''

  if (!text) {
    throw new Error('Gemini returned an empty response')
  }

  return {
    text,
    usage: data.usageMetadata
      ? {
          promptTokens: data.usageMetadata.promptTokenCount,
          completionTokens: data.usageMetadata.candidatesTokenCount,
          totalTokens: data.usageMetadata.totalTokenCount,
        }
      : undefined,
  }
}
