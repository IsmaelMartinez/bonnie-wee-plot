import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { seasonNarrationRequestSchema } from '@/lib/validations/season-narration'
import {
  buildNarrationMessages,
  NARRATION_TEMPERATURE,
} from '@/lib/season-review/narration'
import { callGemini } from '@/lib/ai/gemini'
import {
  FREE_TIER_MONTHLY_QUOTA,
  getCurrentUsage,
  incrementUsage,
} from '@/lib/supabase/ai-usage'
import { checkRateLimit } from '@/lib/server-rate-limiter'
import { logger } from '@/lib/logger'

/**
 * Hosted season narration (Season Observer Phase 2c, hosted tier).
 *
 * Server-side twin of the browser→Ollama narration client: signed-in users
 * without their own endpoint get their season-review findings narrated by
 * the same Gemini free tier that backs Aitor, drawing on the same per-user
 * monthly `ai_usage` quota. The prompt is built by `buildNarrationMessages`
 * from the zod-validated body, which strips everything outside the narration
 * payload contract — internal ids never reach the model, and coordinates
 * can't (no accepted field carries them). Verification of the returned draft
 * stays client-side in `narrateSeasonHosted`, identical to the direct path.
 */
export async function POST(request: NextRequest) {
  try {
    // Mirrors the Aitor route's gate: the panel only offers the hosted
    // option to signed-in users, and matching that at the route level stops
    // the server-side Gemini key being drained by anonymous callers.
    const { userId, getToken } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Sign in to use the built-in narration.' },
        { status: 401 }
      )
    }

    // Fail fast when the deployment has no free tier at all — before spending
    // a Redis round-trip or parsing the body.
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Built-in narration is not available on this deployment. Use your own endpoint instead.' },
        { status: 500 }
      )
    }

    // Short-window per-user rate limit on top of the monthly quota, bounding
    // burst abuse. Fails open if Redis is down.
    const rateLimit = await checkRateLimit(userId, {
      maxRequests: 10,
      windowSeconds: 300,
      prefix: 'season-narration',
    })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a few minutes and try again.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.resetInSeconds) },
        }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      // A client-side mistake, not a server fault.
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }
    const validationResult = seasonNarrationRequestSchema.safeParse(body)
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((e) => e.message).join(', ')
      return NextResponse.json(
        { error: `Validation error: ${errors}` },
        { status: 400 }
      )
    }
    const { findings, year, allotmentName } = validationResult.data

    const supabaseToken = await getToken({ template: 'supabase' })
    if (!supabaseToken) {
      return NextResponse.json(
        { error: 'Free tier requires the "supabase" Clerk JWT template. Use your own endpoint instead.' },
        { status: 500 }
      )
    }

    try {
      const usage = await getCurrentUsage(supabaseToken, userId)
      if (usage.remaining <= 0) {
        return NextResponse.json(
          {
            error: `You've used your ${FREE_TIER_MONTHLY_QUOTA} free AI requests for this month (the narration quota is shared with Aitor).`,
            quotaExceeded: true,
            usage,
          },
          { status: 429 }
        )
      }
    } catch (err) {
      logger.error('Narration quota check failed', { error: String(err) })
      return NextResponse.json(
        { error: 'Could not check your free-tier quota. Try again in a moment.' },
        { status: 500 }
      )
    }

    // Same prompt as the direct client, built from the stripped payload.
    const [systemMessage, userMessage] = buildNarrationMessages(findings, {
      year,
      allotmentName,
    })

    try {
      const result = await callGemini({
        apiKey: process.env.GEMINI_API_KEY,
        systemPrompt: systemMessage.content,
        history: [],
        userMessage: userMessage.content,
        temperature: NARRATION_TEMPERATURE,
      })
      // Increment after a successful response so failed requests don't burn
      // the user's quota (same race tolerance as the Aitor route).
      await incrementUsage(supabaseToken, userId)
      return NextResponse.json({ text: result.text, usage: result.usage })
    } catch (err) {
      logger.error('Narration Gemini call failed', { error: String(err) })
      const status = (err as { status?: number }).status ?? 500
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Failed to generate the narration.' },
        { status }
      )
    }
  } catch (error) {
    logger.error('Season narration API error', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
