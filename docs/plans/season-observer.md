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

### Not building (per brief non-goals)
Bed-layout designer, sensors/hardware, cloud accounts/telemetry for this
feature, real-time alerts, one-shot photo plant-ID as a headline, any
LLM-generated agronomy.
