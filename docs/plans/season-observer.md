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
- [ ] Camera-roll importer (≥30 draft observations) — **deferred** (needs photo store).
- [x] No new external service dependencies.

## Deferred roadmap (with the reframing decisions)

### Photos + camera-roll EXIF import
No photo storage exists. Local-first in a PWA means IndexedDB blobs
(`photo` records referenced by `CareLogEntry.photoId`, already wired). The EXIF
importer (filter by ~100m of plot coords, group by date, human-confirm) is a
self-contained follow-up. Optional local vision captioning stays human-confirmed.

### Weather backfill (Phase 2a)
Add an **Archive API** client (`archive-api.open-meteo.com`) for one-call
full-season backfill incl. soil moisture + ET0, plus a **10-year daily
baseline**, cached in localStorage/IndexedDB (not SQLite/parquet — that would be
the forbidden second stack). Reuse `frost-dates.ts` for the frost metric.

### Derived metrics + rules engine (Phase 2b)
Deterministic code over logs + weather: GDD accumulation, soil temp at sowing,
dry spells, water balance, heat-stress days, days-to-germinate vs typical,
anomaly vs baseline. Emit a structured `findings[]` array (8–12 well-tested
rules; false positives are the failure mode). `src/lib/agronomy.ts` is the
reference input.

### Report narration (Phase 2c) — **open decision**
The brief mandates local Ollama only (privacy-first). The repo's only LLM path
is a cloud OpenAI proxy (`/api/ai-advisor`, hidden behind `SHOW_AI_ADVISOR`).
A deployed web app cannot reach a user's `localhost:11434`, so Ollama-only means
"self-hosted / local machine," not the public deploy. **Recommendation:** a
provider-agnostic narration client (configurable base URL, Ollama default),
with the deterministic `findings` JSON + a "no number absent from findings"
automated check as the real guarantee. Confirm before building.

### Not building (per brief non-goals)
Bed-layout designer, sensors/hardware, cloud accounts/telemetry for this
feature, real-time alerts, one-shot photo plant-ID as a headline, any
LLM-generated agronomy.
