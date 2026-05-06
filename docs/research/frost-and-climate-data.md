# Frost & Climate Data Research

Date: 2026-05-01
Status: Research — no code changes yet

## Why this is interesting

The app already pulls live weather (Open-Meteo, schema v19) and uses rainfall to suppress watering tasks. Frost is the next-most-actionable weather signal for a UK/Scotland gardener:

- **Sowing decisions** — half the entries in `scotland-calendar.ts` and many plant `tips[]` warn about frost ("after last frost", "wait until June"), but the warnings are free-text and not date-driven.
- **Variety choice** — "frost tender" vs "very hardy" determines whether something can overwinter, go out in April, or has to wait until June.
- **Today's tasks** — overnight low ≤ 0°C ought to trigger a "cover tender plants tonight" task when the user has tender crops outdoors.
- **Date validation** — `validateSowDate()` already exists; it currently only checks the plant's `sowOutdoorsMonths` window, not the user's local frost-free dates.

What we have today:

- `src/lib/weather/open-meteo.ts` already fetches `temperature_2m_min` for past 3 days + 3 forecast days, but only uses it for the strip's "min" tile.
- `src/lib/date-calculator.ts` has a Scotland-specific `getFallFactorDays()` for autumn growth slowdown.
- `Vegetable` type has `growingRequirement` (`'outdoor' | 'greenhouse' | 'windowsill' | 'polytunnel'`) — proxies for tenderness but doesn't capture "hardy down to X°C".
- No `hardiness`, `frostTolerance`, `minTempC`, or last/first-frost-date fields anywhere.

## Data sources

### Open-Meteo (already integrated)

The forecast endpoint we already call exposes everything we need short-term, no extra API key:

| Field | Use |
|---|---|
| `temperature_2m_min` (daily) | overnight low → frost risk for next 3 days. Already in our query. |
| `temperature_2m_max` (daily) | already in our query, used in the WeatherStrip tiles. |
| `soil_temperature_0_to_7cm` (hourly) | sowing decisions ("soil is at 8°C, peas can go in") |
| `precipitation_sum` (daily) | already used for watering |
| `wind_speed_10m_max` (daily) | transplanting decisions; high-wind warnings |
| `apparent_temperature_min` (daily) | felt cold for soft fruit / blossom |

For historical / climatological data:

- **Open-Meteo Climate API** (`api.open-meteo.com/v1/climate`) — free, no API key, returns daily ERA5 reanalysis going back to 1950. From this we can derive a coordinate-specific:
  - **Average last spring frost** — the date in spring when daily `temperature_2m_min < 0°C` last occurs in the historical record (per year, then averaged over 10–30 years).
  - **Average first autumn frost** — same but the first sub-zero day after summer.
  - **10%/50%/90% probability** windows — more accurate than simple averages and worth showing in tooltips.
  - **Frost-free days remaining** — derived live: today vs first-frost-average.

One climate-API call per coordinate, cached forever (these averages don't change month-to-month). 1 fetch on first geolocation, rounded to the same 2-decimal lat/lng key the rainfall cache already uses.

### RHS hardiness ratings (static plant data)

The RHS uses H1a–H7 (warmest greenhouse → exposed mountain). We already store `rhsUrl` on most plants. Adding a `hardiness?: 'H1a' | 'H1b' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6' | 'H7'` field would let us map frost forecasts to "is THIS plant at risk?" without per-plant min-temp lookups.

Mapping (RHS-published):

| Rating | Min temperature | Examples |
|---|---|---|
| H1a | > 15°C | Tropical houseplants |
| H1b | 10 → 15°C | Tomato, basil indoors |
| H1c | 5 → 10°C | Tomato outdoors midsummer |
| H2 | 1 → 5°C | Tender — courgette, cucumber, French bean |
| H3 | -5 → 1°C | Half-hardy — most lettuces, rocket |
| H4 | -10 → -5°C | Hardy — broad bean, garlic, brassicas |
| H5 | -15 → -10°C | Very hardy — leek, parsnip, kale |
| H6 | -20 → -15°C | Most overwintering crops |
| H7 | < -20°C | Highland shelter-belt species |

Most edible UK crops fall in H2–H5. Populating the field for all 192 plants is manual but small (a one-time chore, can be done from the plant data files). Defaulting to `'H4'` (hardy) when unset is safe — it under-warns for tender crops, which is the failure direction we want to avoid.

### Met Office DataPoint

Considered and rejected. UK-specific, free tier exists but requires registration and the data is no richer than Open-Meteo for our needs. Adds an API key dependency without enabling anything new.

## Proposed additions, in order of leverage

### 1. Frost dot on the WeatherStrip (smallest, ~1 hour)

We're already fetching `temperature_2m_min` for the next 3 days. Add a small frost icon (lucide `Snowflake`) on any tile where `tempMinC ≤ 0` (definite frost) or a faint dot for `tempMinC ≤ 3` (frost risk). Pure UI; no API change.

Files: `src/components/dashboard/WeatherStrip.tsx`. Add a new test row to `wmo-icons.test.ts` if we add the icon to the mapping.

### 2. Tonight's frost warning banner (~2 hours)

When `forecast[0].tempMinC ≤ 0` and the user has any planting whose `hardiness` is H2 or warmer, show a yellow banner on Today: "Frost tonight — protect your tender crops" with a list of affected beds. When `hardiness` is missing on plants, fall back to `growingRequirement === 'outdoor'` plants flagged in the plant database with a `frostSensitive` tip — coarse but better than nothing until we populate hardiness.

Files: new `src/components/dashboard/FrostWarningBanner.tsx`, wired into `TodayDashboard.tsx` next to `LocationPromptBanner`.

### 3. Add `hardiness` to `Vegetable` (~3–4 hours)

Type change + data fill across 17 category files in `src/lib/vegetables/data/`. Most plants take 30 seconds — RHS pages already classify them. This unblocks #2 cleanly and makes future planning UX much sharper (e.g. "you can still sow these H4+ crops, frost or not").

Files: `src/types/garden-planner.ts`, `src/lib/vegetables/data/*.ts` (17 files), `src/__tests__/lib/companion-validation.test.ts` may need a fixture update.

### 4. Last/first frost dates from Open-Meteo Climate API (~4–6 hours)

New endpoint helper: `fetchFrostDates(lat, lng)` → `{ avgLastFrost: string; avgFirstFrost: string; lastFrostP90: string }`.

- Hits `api.open-meteo.com/v1/climate?...&daily=temperature_2m_min&start_date=2010-01-01&end_date=2025-12-31`.
- For each year in the response, find the last day in Jan–Jun where `temperature_2m_min < 0` (last spring frost) and the first day after Jul where it next goes sub-zero (first autumn frost).
- Average the day-of-year values; convert back to a date for the *current* year.
- Cache forever (or: 1 year TTL — these averages do shift with climate, just slowly). Keyed by coordinates rounded to 2dp like the rainfall cache.

Surface options: small "Frost-free window: 14 May – 12 Oct (avg)" line under the WeatherStrip, OR feed into `validateSowDate()` so warnings get more specific than the current text-based ones.

Files: extend `src/lib/weather/open-meteo.ts` (new function + cache), `src/types/unified-allotment.ts` (cache the dates on `meta.frostDates` so the whole app can read them without refetching), `src/lib/date-calculator.ts` (consume in validation).

### 5. Frost-aware sow-date validation (~2 hours, depends on #3 + #4)

`validateSowDate()` currently only checks the plant's database calendar. With `hardiness` populated and frost dates cached on `meta.frostDates`, it can warn:

- *"Cucumber is H2 (frost tender). Your average last frost is 14 May; sowing outdoors before then risks frost damage."*
- *"Garlic is H5 (very hardy). Plant in October–November for best results."*

Files: `src/lib/date-calculator.ts`, plus form copy in `AddPlantingForm.tsx` already renders validation warnings.

### 6. Soil temperature for sowing tasks (~2–3 hours)

Add `soil_temperature_0_to_7cm` to the existing forecast call. For tasks like "sow peas" or "sow carrots", suppress when soil temp is below the species threshold (peas: 7°C, carrots: 7°C, beans: 12°C, sweetcorn: 13°C). Could become a new `sowSoilTempC` field on `Vegetable` — or just a category-level lookup.

Open question: is this worth the friction of more plant data? Probably yes for the half-dozen crops where it really matters; YAGNI for the rest. Hold until #1–4 are in.

## Effort summary

| Item | Effort | Depends on |
|---|---|---|
| Frost dot on WeatherStrip | ~1 h | — |
| Tonight's frost warning banner | ~2 h | #3 (or coarse fallback) |
| `hardiness` field on Vegetable | ~3–4 h | — |
| Last/first frost dates (Climate API) | ~4–6 h | — |
| Frost-aware `validateSowDate()` | ~2 h | #3 + #4 |
| Soil temperature for sowing | ~2–3 h | — |
| **Total focused track** | **~12–18 h** | |

## Recommended sequencing

1. **Frost dot in WeatherStrip** — visible win, tiny code, no data work.
2. **`hardiness` on Vegetable** — unblocks every targeted warning that follows. Manual data fill but mechanical.
3. **Frost dates from Climate API + cache on `meta.frostDates`** — one-time API cost per location, then cheap forever.
4. **Tonight's frost warning banner** + **frost-aware sow validation** — both ride on top of (2) and (3).
5. Hold soil temperature until adoption tells us it matters.

## Risks / open questions

- **Open-Meteo non-commercial use limit** is a known constraint. Adding the Climate API call once per location stays well under any reasonable rate limit.
- **Climatological averages can mislead** in a warming climate — a 2010-2025 baseline is more representative than 1990-2020 for current planning. We should make this configurable in code, not hardcoded.
- **Hardiness data quality** — RHS ratings vary across sources for the same crop. We'll pick one canonical source (RHS plant pages) and note exceptions in the data file.
- **Microclimate** — coastal Scotland and highland Scotland have very different last frost dates even at the same latitude. Coordinate-based lookup handles this for free; postcode-based would not.
- **What about non-frost low-temp damage?** Tomato blossom drops below 13°C, basil sulks below 10°C. Hardiness alone doesn't capture this; the soil-temperature track addresses the sowing side, but the "growing-on" risks are out of scope here.