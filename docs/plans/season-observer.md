# Season Observer — build plan & reuse map

The Season Observer closes the plan → observe → learn → better-plan loop: a
season's logged events plus backfilled weather become an end-of-season report
that improves next year's plan. This doc records the Phase 0 inspection, the
reuse decisions, what shipped in Phase 1, and the deferred roadmap.

## Phase 0 — inspection findings

**Stack:** Next.js 16 / React 19 / TypeScript strict / Tailwind ("zen" theme).
There is **no relational database**. Data is a local-first Yjs CRDT document
(`@syncedstore/core`) persisted to IndexedDB, with optional Supabase binary
sync. Everything lives in one typed model, `AllotmentData`
(`src/types/unified-allotment.ts`). "Migrations" are version-bump functions in
`src/services/storage-migrations.ts`, not SQL DDL.

**Consequence:** the brief's relational data model was reframed onto the
existing document model rather than introducing a second storage stack (which
the brief itself forbids — "do not introduce a parallel stack or a second
database").

### Brief table → existing home

| Brief entity | Existing type | Notes |
|---|---|---|
| `plot` | `AllotmentMeta` | has `name`, `location`, `coordinates{lat,lon}`, `frostDates` |
| `bed` | `Area` (kind `rotation-bed`) | `shortId`=code, `name`, `description`=notes |
| `planting` | `Planting` | `sowDate`, `sowMethod`, `transplantDate`, `notes`, `status`; **added `endedOn`** |
| `observation` | `CareLogEntry` | **added agronomic types + `severity` + `plantingId` + `photoId`** |
| `harvest` | `CareLogEntry` type `harvest` | `quantity`/`unit`; also `Planting.actualHarvest*` |
| `crop` (reference) | `Vegetable` DB + `src/lib/agronomy.ts` | **added agronomy reference module** |
| `photo` | — | not built yet (deferred) |

### Weather (already ~60% built)
- `src/lib/weather/open-meteo.ts` — forecast API, parses `soil_temperature_0_to_7cm`, precip, temps, cached.
- `src/lib/weather/frost-dates.ts` — computes this-plot last-spring / first-autumn frost over a 15-year Climate-API window. This is the brief's "actual frost dates" metric, done.
- `src/lib/sowing-thresholds.ts` — per-crop min outdoor-sow soil temps (peas 7, beans 12, sweetcorn 13).

## Phase 1 — shipped

Additive, backward-compatible. Schema bumped **v22 → v23** (all new fields
optional; the v23 migration is a no-op version stamp, matching the v19/v21/v22
precedent).

1. **Model extensions** (`src/types/unified-allotment.ts`)
   - `CareLogType` gained observation values: `germinated`, `thinned`,
     `flowering`, `pest`, `disease`, `bolted`, `damage`. Free-form notes reuse
     the existing `observation` type (no separate `note` synonym). `water`/`feed`
     double as the brief's `watered`/`fed`, so they are not duplicated.
   - `CareLogEntry` gained `severity?: 1|2|3`, `photoId?`, `plantingId?`.
   - `Planting` gained `endedOn?` (when a planting left the bed).
   - `ObservationSeverity` type added.
2. **Agronomy reference** (`src/lib/agronomy.ts` + tests)
   - `getCropAgronomy(plantId)` → GDD base temp, min germination soil temp,
     typical days-to-germinate/maturity, frost tolerance, heat-stress temp.
   - Family defaults + per-crop overrides (self-describing family); resolves
     usable numbers for every crop. Deterministic, pure, fully unit-tested.
   - `getRotationFamily(plantId)` → the brief's 8 rotation families.
3. **Quick-capture screen** (`src/app/log/page.tsx`, nav link "Log")
   - The <15s one-handed path: tap a bed (active beds first) → tap an event →
     optional crop/severity/quantity/note → Save. Bed & date persist between
     saves for rapid logging. Offline-tolerant for free (writes go to
     Yjs/IndexedDB and sync later).

**Phase 1 acceptance status**
- [x] Logging an observation/harvest is a 2-tap path (bed + event), rest optional.
- [x] Works with no signal; syncs later (inherent to Yjs/IndexedDB).
- [x] Camera-roll importer (≥30 draft observations) — **shipped** (see below).
- [x] No new external service dependencies.

## Camera-roll EXIF importer (shipped)

Reconstructs a season retroactively from the phone photo library. All
client-side and local-only:

- `src/lib/photo-import/exif.ts` — small pure JPEG/EXIF parser
  (DateTimeOriginal + GPS DMS→decimal), no new dependency; tested against
  synthesised EXIF byte fixtures, both endians. HEIC is out of scope
  (surfaced to the user as "no readable date").
- `src/lib/photo-import/geofence.ts` — haversine distance + ~100m plot
  geofence over `meta.coordinates`; skipped with clear messaging when the
  plot has no coordinates.
- `src/lib/photo-import/pipeline.ts` — pure parse → geofence → group-by-date
  → draft pipeline. Drafts are never auto-committed; unconfirmed drafts are
  discarded. `DraftObservation.suggestedCaption` + the `DraftAnnotator`
  interface are the deliberate seam for future local vision captioning
  (unused in v1).
- `src/services/photo-store.ts` — separate plain-IndexedDB blob store
  (`bwp-photos`). Blobs stay out of the Yjs doc; only `CareLogEntry.photoId`
  (already in v23) lives in the CRDT, so export/share/GDPR/cloud-sync
  payloads never carry photo EXIF or GPS.
- `/log/import` (`src/app/log/import/page.tsx`) — review UI linked from
  Quick Log: pick photos → per-date draft groups with thumbnails →
  include/exclude per photo, optional note, assign a bed → confirm writes
  the blob then the observation care-log entry through the existing
  `addCareLog` write path. Groups outside the active season are blocked
  from import (same misfiling guard as /log).

Acceptance test: `src/__tests__/lib/photo-import/pipeline.test.ts` runs 38
synthesised photos end-to-end (real EXIF byte parsing) and asserts 30 drafts
in 10 correctly-ordered date groups with camera-roll noise excluded for the
right reasons.

## Deferred roadmap (with the reframing decisions)

### Weather backfill (Phase 2a) — **shipped**
Archive API client (`src/lib/weather/open-meteo-archive.ts`): one call fetches
a whole season of daily weather (temps, rain, radiation, ET0, sunshine,
daylight, weather code) plus hourly soil temp/moisture aggregated to daily
(`soil-daily.ts`), cached in localStorage keyed by rounded coords + year —
completed seasons forever, the current season with a 24h TTL. 10-year monthly
normals in `weather-baseline.ts` (`getBaseline`), pure `computeBaseline` over
fetched seasons. Everything comes from the Archive API (ERA5): the Historical
Forecast API was rejected for the current season because its soil layers
(0/6/18cm, 0-1cm moisture) don't match ERA5's 0-7/7-28cm, which would break
comparability with the baseline; the ~5-day lag doesn't matter for a
retrospective report. Coordinates stay in local cache keys only (rounded
~1 km), never logged, absent from exported types. Reuse `frost-dates.ts` for
the frost metric.

### Derived metrics + rules engine (Phase 2b) — **shipped**
Deterministic code over logs + weather, all in `src/lib/season-review/`:

- `metrics.ts` — pure derived metrics over `SeasonWeather`/`WeatherBaseline` +
  plantings/care-logs: GDD accumulation (coverage-gated), soil temp at sowing,
  sustained soil-threshold detection, dry spells, monthly water balance
  (rain − ET₀), heat-stress day counts, frost-in-window, actual
  days-to-germinate (sow → `germinated` care log), monthly actuals + anomalies
  vs the 10-year baseline (same coverage rules as `computeBaseline`, so the
  comparison is like-for-like).
- `rules.ts` — `evaluateSeason()` runs 10 rules and emits a structured
  `findings[]` array (`findings.ts`: id, ruleId, severity info/notice/warning,
  plain-English summary, the metric values behind it, and the bed/planting
  entities). Rules: cold-soil sowing, slow germination, frost after tender
  planting-out, heat-stress days (escalates when bolting was logged), monthly
  temp/rain/sunshine anomalies vs baseline, dry spells (cross-referenced with
  watering logs — only when the user logs watering at all), monthly water
  deficit, and pest/disease clusters (log-only, works without weather).
  Every rule stays silent on missing/thin data — metrics return null under
  coverage floors and the engine emits nothing rather than guess; the sparse
  fixture asserts exactly that. `computePlantingMetrics()` powers the page's
  per-planting table.
- `/season-review` page — deterministic rendering only (no narration): year
  picker, findings list, monthly weather vs baseline table, per-planting
  metrics, with graceful no-coordinates / no-cached-weather / sparse-log
  states. Linked from the More menu and from `/log`. Findings are computed on
  demand — nothing new is persisted in the Yjs doc, and coordinates never
  appear in findings.

### Report narration (Phase 2c) — **shipped**

**Decision (resolving the open question):** a provider-agnostic narration
client — configurable base URL + model, OpenAI-compatible chat-completions
API, local Ollama (`http://localhost:11434/v1`) as the default preset. No new
required cloud service; narration is strictly opt-in and OFF by default, and
the deterministic `/season-review` page stays fully useful without it. The
brief's Ollama-only mandate is honoured as the default (nothing leaves the
machine), while the configurable endpoint covers the deployed-web-app reality
that a server can never reach a user's `localhost`.

- `src/lib/season-review/narration.ts` — the client. Browser → configured
  endpoint directly (no app server in the path), `temperature: 0.2`, optional
  bearer key for hosted endpoints (sessionStorage, mirroring the AI-advisor
  BYO-key pattern; endpoint + model persist in localStorage). The findings[]
  from `rules.ts` are the ONLY season data sent, plus allotment name + year —
  never coordinates, never internal ids. The system prompt forbids numbers
  not present in the findings.
- `src/lib/season-review/narration-verify.ts` — the real guarantee,
  deterministic code: every numeric token in the draft must be vouched for by
  the findings (summaries, metric values, ISO date parts) or a small derived
  allowance (season year, year+1, finding counts). Tokens are canonicalized
  (`21.50` ≡ `21.5`, thousands separators joined, sign treated as grammar);
  model-side rounding/conversions/arithmetic all fail. A failing draft is
  discarded and the UI says so — the findings list is the fallback report.
- `src/components/season-review/NarrationPanel.tsx` — collapsed
  `<details>` on `/season-review`, inert until the user presses Generate.
  Narration is ephemeral: rendered on demand, never persisted (not in the
  Yjs doc, not anywhere), dropped when the year or findings change. Friendly
  guidance on unreachable endpoints (Ollama not running / `OLLAMA_ORIGINS`).
- CSP: `connect-src` gained `http://localhost:11434` + `http://127.0.0.1:11434`
  (browsers exempt localhost from mixed-content blocking, but CSP still needs
  the origin). Custom remote endpoints need their origin added to
  `src/middleware.ts`.
- No release-visibility flag: the collapsed opt-in panel that does nothing
  until configured-and-clicked *is* the gate, and a flag would be sprawl.
- Tests: `narration-verify.test.ts` (the checker, tested hard — rounding,
  conversions, thousands separators, dedupe, zero-findings) and
  `narration.test.ts` (mocked fetch: request shape, auth header only with a
  key, prompt contract, error paths, verified/rejected orchestration).

**Hosted free-tier provider (follow-up).** The browser→endpoint client can
never work for a deployed user without their own Ollama/endpoint, so
signed-in users now get a second provider that routes through the app
server and reuses the Gemini free-tier plumbing Aitor built (PR #345):

- `POST /api/season-narration` (`src/app/api/season-narration/route.ts`) —
  Clerk-gated, per-user short-window rate limit, then the same `ai_usage`
  monthly quota check/increment as Aitor (one shared 30-requests counter),
  then `callGemini` (gemini.ts adapter) with the narration system prompt at
  `NARRATION_TEMPERATURE`. The zod schema
  (`src/lib/validations/season-narration.ts`) is the server-side enforcement
  of the payload contract: it accepts only severity, summary, metrics,
  entity display names and dates, stripping unknown keys — so internal ids
  never reach the prompt and coordinates can't (no accepted field holds
  them). The prompt itself comes from the shared `buildNarrationMessages`,
  identical to the direct path.
- `narrateSeasonHosted` in `narration.ts` posts the stripped
  `toNarrationPayload` shape (ids removed before the request leaves the
  browser) and then runs the draft through the exact same `verifyNarration`
  gate — a failing draft is discarded identically on both paths.
  Quota-exhausted 429s surface as a typed `HostedNarrationError` with
  `quotaExceeded`.
- `NarrationPanel` offers an "AI provider" toggle only when signed in:
  Built-in (default for signed-in users — zero setup, works deployed) vs
  Your own endpoint (the existing Ollama/BYO path, unchanged and still the
  only path for anonymous users). Quota exhaustion renders the same
  friendly two-options message as Aitor (switch provider / wait for the
  monthly reset), not an error. Provider choice persists in the existing
  `bwp-narration-config` localStorage entry.
- Tests: route handler (auth gate, rate limit, quota 429 with
  `quotaExceeded`, prompt contract incl. id-stripping, increment-only-on-
  success), hosted client (payload shape, quota error, unchanged verify
  gate), and panel provider selection (hidden signed-out, hosted default,
  two-options quota message, custom path untouched).

### Plan feedback (Phase 3) — **shipped**

Closes the loop: last season's findings feed next season's planning, all
deterministic (no LLM anywhere in this phase).

- `src/lib/season-review/plan-adjustments.ts` — pure mapper: the findings[]
  from `evaluateSeason()` in, typed `PlanAdjustment[]` out (observed fact +
  concrete action, entities carried through). Each suggestion maps 1:1 to a
  rule id and restates only numbers already in the finding's `metrics`, with
  the rules engine's silence-on-thin-data discipline: missing metrics → no
  suggestion, and rules with no concrete plan action (temp/rain anomalies,
  water deficit, dull months — season context) never become suggestions.
  Actionable mappings: cold-soil sowing → wait for the crop's soil threshold
  (with last year's actual threshold date when known) or start indoors; slow
  germination → sow later / pre-warm the bed; frost after tender planting-out
  → hold back past `meta.frostDates.lastSpring` (compares the planting date
  against the average last frost, with a fleece fallback when the frost came
  after it, and a generic wait when no frost dates are known); heat stress →
  bolt-resistant variety / earlier sowing, or shade + watering when nothing
  bolted; dry spell → mulch + a watering routine for the spell's months;
  pest/disease cluster → early netting/collars or spacing/family rotation for
  that specific bed.
- `src/components/allotment/LastSeasonPanel.tsx` — one focused "Learning
  from <year>" panel on `/allotment`, rendered under the season status widget
  only when planning the current/next year (selected year ≥ calendar year)
  with a previous season on record. Weather loads cache-first via
  `fetchSeasonWeather` + `getBaseline` (same pattern as `/season-review`) and
  degrades to log-only findings; suggestions are computed on demand and never
  persisted to the Yjs doc. Dismissal is per plan-year in localStorage
  (`bwp-plan-feedback-dismissed:<year>`), not the CRDT. No adjustments → the
  panel renders nothing at all. Links to `/season-review` for the full report.
- Tests: `plan-adjustments.test.ts` (every rule → suggestion mapping, the
  frost-date branches, and the missing-metric / unknown-rule / context-rule
  silence cases) and `LastSeasonPanel.test.tsx` (renders from a log-only
  season, silence without a record or without actionable findings, dismissal
  persistence keyed by plan year).

### Point-of-decision nudges (Phase 4) — **shipped**

Surfaces last season's crop-specific adjustment inside the Add Planting flow,
at the moment the crop is picked. Same guardrails as Phase 3: deterministic,
computed on demand, nothing persisted to the Yjs doc, and silence when
nothing matches.

- `adjustmentsForPlant(plantId, adjustments)` — small pure selector added to
  `plan-adjustments.ts`, matching via each adjustment's `entities[].plantId`
  (the vegetable-database id the form's combobox picks). Plot-wide
  adjustments (dry-spell) carry no plant entity, so they never match — they
  stay on the `/allotment` panel and never appear in the form. No new rule
  text anywhere: the nudge renders the adjustment's `observed` + `action`
  verbatim.
- `src/hooks/useLastSeasonAdjustments.ts` — the cache-first weather
  (`fetchSeasonWeather` + `getBaseline`) → `evaluateSeason` →
  `derivePlanAdjustments` pipeline that `LastSeasonPanel` owned, extracted so
  the panel and the form compute from one place. Takes the same inputs the
  panel took as props (`planYear`, `areas`, `seasonRecord`, `coordinates`,
  `frostDates`) and returns `{ settled, adjustments }`; evaluation is
  memoized per (season, weather) — never per keystroke — and the hook adds
  no fetches beyond the existing cache-first calls. The panel's rendering
  and per-plan-year dismissal behaviour are unchanged.
- `AddPlantingForm` — already reads `useAllotment()` (for frost dates), so it
  derives the previous season record itself and shows one compact
  "Last year: <observed> <action>" note per matching adjustment directly
  under the plant picker (alongside the companion hints, complementing the
  SowDateValidator output further down). The dialog only mounts the form
  when opened, and `LastSeasonPanel` on the same page has already warmed the
  season-weather cache, so opening the form costs no network.
- Tests: selector cases in `plan-adjustments.test.ts` (crop matching,
  plot-wide exclusion, empty inputs) and form integration in
  `AddPlantingForm.test.tsx` (right nudge for the picked plant with
  plot-wide advice excluded, silence for a crop without a matching
  adjustment, silence when the previous season produced nothing) with the
  shared hook mocked; existing form and panel tests unchanged.

### Bed-scoped nudges (Phase 5) — **shipped**

Surfaces last season's bed-specific adjustment inside the Add Planting flow,
for the bed being planted into, regardless of which plant is picked. Same
guardrails as Phase 4: deterministic, computed on demand, nothing persisted
to the Yjs doc, no new fetches, and silence when nothing matches.

- `adjustmentsForArea(areaId, adjustments)` — small pure selector added to
  `plan-adjustments.ts`, matching via each adjustment's `entities[].areaId`.
  Adjustments that name a plant are excluded even when they also carry the
  bed (the four planting-level rules emit both via `plantingEntity`): those
  stay crop-matched via `adjustmentsForPlant`, so a finding carrying both
  never renders twice. Plot-wide adjustments (dry-spell) carry no entities
  and never match. Today only `pest-disease-cluster` emits area-only
  entities, so that is the one rule that surfaces here. No new rule text:
  the nudge renders the adjustment's `observed` + `action` verbatim.
- `AddPlantingForm` — gained an optional `areaId` prop and shows one compact
  "Last year in this bed: <observed> <action>" note per matching adjustment,
  above the Phase 4 crop nudges and independent of the plant selection.
  Reuses `useLastSeasonAdjustments` unchanged, so evaluation stays memoized
  per (season, weather), never per keystroke.
- Mount point: the form is mounted once, in the `/allotment` page's Add
  Planting dialog, which both the desktop sidebar and `MobileAreaBottomSheet`
  open via `openAddDialog` — so passing `areaId={selectedBedId}` at that one
  mount covers every entry path. `LastSeasonPanel` and the hook are untouched.
- Tests: selector cases in `plan-adjustments.test.ts` (area matching,
  plant-entity exclusion even with a matching bed, plot-wide exclusion,
  empty inputs) and form integration in `AddPlantingForm.test.tsx` (bed
  nudge shows before and after any plant choice, a crop-and-bed adjustment
  renders exactly once as a crop nudge, silence for a non-matching bed or a
  missing `areaId`); existing form tests unchanged.

### Not building (per brief non-goals)
Bed-layout designer, sensors/hardware, cloud accounts/telemetry for this
feature, real-time alerts, one-shot photo plant-ID as a headline, any
LLM-generated agronomy.
