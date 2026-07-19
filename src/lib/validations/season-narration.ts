import { z } from 'zod'

/**
 * Validation schema for the hosted season-narration route.
 *
 * This is the server-side enforcement of the narration payload contract
 * (`toNarrationPayload` in src/lib/season-review/narration.ts): findings
 * carry severity, summary, metrics, entity display names and dates — and
 * nothing else. Zod strips unknown keys by default, so internal ids
 * (finding id, ruleId, areaId, plantingId, plantId) and anything else a
 * caller might send are dropped before the prompt is built. Coordinates can
 * never appear: no field of this shape holds them.
 */

const MAX_FINDINGS = 60
const MAX_SUMMARY_LENGTH = 500
const MAX_NAME_LENGTH = 200
const MAX_ENTITIES_PER_FINDING = 12
const MAX_METRIC_KEY_LENGTH = 80
const MAX_METRIC_VALUE_LENGTH = 200
const MAX_DATE_LENGTH = 40

const narrationEntitySchema = z.object({
  areaName: z.string().max(MAX_NAME_LENGTH).optional(),
  plantName: z.string().max(MAX_NAME_LENGTH).optional(),
  varietyName: z.string().max(MAX_NAME_LENGTH).optional(),
})

const narrationFindingSchema = z.object({
  severity: z.enum(['info', 'notice', 'warning']),
  summary: z.string().min(1).max(MAX_SUMMARY_LENGTH),
  metrics: z.record(
    z.string().max(MAX_METRIC_KEY_LENGTH),
    z.union([z.number(), z.string().max(MAX_METRIC_VALUE_LENGTH)])
  ),
  entities: z.array(narrationEntitySchema).max(MAX_ENTITIES_PER_FINDING),
  dates: z
    .object({
      start: z.string().max(MAX_DATE_LENGTH).optional(),
      end: z.string().max(MAX_DATE_LENGTH).optional(),
    })
    .optional(),
})

export const seasonNarrationRequestSchema = z.object({
  year: z.number().int().min(1900).max(2200),
  allotmentName: z.string().max(MAX_NAME_LENGTH).optional(),
  // The panel only mounts with findings on screen, so an empty array is a
  // caller bug, not a state worth spending quota on.
  findings: z.array(narrationFindingSchema).min(1).max(MAX_FINDINGS),
})

export type SeasonNarrationRequest = z.infer<typeof seasonNarrationRequestSchema>
