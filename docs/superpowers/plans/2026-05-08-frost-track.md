# Frost Track Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add frost awareness to bonnie-wee-plot — surface frost risk on the weather strip, warn the user the night before a freeze with a list of affected tender crops, and replace text-based "after last frost" advice with date-driven validation grounded in real climate data.

**Architecture:** Five tasks build on each other. Task 1 is pure UI on the existing 3-day forecast. Task 2 adds an `hardiness` field (RHS H1a–H7 ratings) to every plant in the database. Task 3 introduces a one-time fetch of average last-spring / first-autumn frost dates from Open-Meteo's free Climate API and persists them on `meta.frostDates` via schema migration v21. Tasks 4 and 5 consume both the hardiness field and frost dates to produce a "frost tonight" banner on Today and replace `validateSowDate()`'s textual fall warnings with date-driven, hardiness-aware ones.

**Tech Stack:** Next.js 16, React 19, TypeScript (strict), Vitest for unit tests, Playwright for e2e, Tailwind + Zen design system for styling, lucide-react icons. Uses Open-Meteo (no key required) for climate data.

---

## File Structure

### Created
- `src/lib/weather/frost-dates.ts` — `fetchFrostDates(lat, lng)` helper, in-memory + localStorage cache, derives last-spring / first-autumn averages from a 15-year temperature_2m_min window.
- `src/__tests__/lib/weather/frost-dates.test.ts` — unit tests for `fetchFrostDates` (parsing, cache hit/miss, missing data).
- `src/components/dashboard/FrostWarningBanner.tsx` — Today banner shown when forecast min ≤ 0 °C and at least one tender (H1a–H3) planting is active.
- `src/__tests__/components/dashboard/FrostWarningBanner.test.tsx` — unit tests for banner rendering and tender filtering.
- `src/__tests__/components/dashboard/WeatherStrip.test.tsx` — snapshot/structure tests for the new frost dot/snowflake.
- `src/lib/hardiness.ts` — small helper module: `Hardiness` type, `isFrostTender(rating)`, `LAST_FROST_DEFAULT_DATE` fallback when frost dates are not yet cached.
- `src/__tests__/lib/hardiness.test.ts` — unit tests for the helper.

### Modified
- `src/types/garden-planner.ts` — add `Hardiness` type union and an optional `hardiness?: Hardiness` field on `Vegetable`.
- `src/lib/vegetables/data/*.ts` — populate `hardiness` on every entry across all 17 category files (fail-safe default of `'H4'` documented but applied explicitly per plant).
- `src/types/unified-allotment.ts` — add `frostDates?: { lastSpring: string; firstAutumn: string; fetchedAt: string }` to `AllotmentMeta`; bump `CURRENT_SCHEMA_VERSION` from 20 → 21.
- `src/services/storage-migrations.ts` — add no-op v20→v21 migration (new field is optional; no data transform required).
- `src/lib/weather/open-meteo.ts` — extend `ForecastDay` type comment (no shape change). Pure UI consumes existing `tempMinC`.
- `src/components/dashboard/WeatherStrip.tsx` — render frost indicator beside temps when `tempMinC ≤ 0` (snowflake) or `tempMinC ≤ 3` (faint dot).
- `src/components/dashboard/TodayDashboard.tsx` — mount `<FrostWarningBanner>` between `LocationPromptBanner` and `WeatherStrip`.
- `src/lib/date-calculator.ts` — `validateSowDate()` consumes `vegetable.hardiness` and `data.meta.frostDates` to emit date-driven warnings for tender crops sown before last spring frost.
- `src/components/allotment/SowDateValidator.tsx` — accept new optional `frostDates` prop, pass into `validateSowDate`.
- `src/components/allotment/AddPlantingForm.tsx` — pass `data.meta.frostDates` through to `<SowDateValidator>`.
- `src/__tests__/lib/date-calculator.test.ts` — extend `validateSowDate` suite with hardiness/frost cases.

---

## Task 1: Frost Dot on WeatherStrip

Pure UI. `tempMinC` is already in the 3-day forecast tiles. Render a small frost glyph beside the min temperature: a `Snowflake` icon when `tempMinC ≤ 0` (definite frost) and a faint dot (text-zen-water-300) when `tempMinC ≤ 3` (frost risk). No changes to data fetching.

**Files:**
- Modify: `src/components/dashboard/WeatherStrip.tsx`
- Create: `src/__tests__/components/dashboard/WeatherStrip.test.tsx`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/__tests__/components/dashboard/WeatherStrip.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import WeatherStrip from '@/components/dashboard/WeatherStrip'
import type { ForecastDay } from '@/lib/weather/open-meteo'

function makeDay(overrides: Partial<ForecastDay> = {}): ForecastDay {
  return {
    date: '2026-05-08',
    weatherCode: 1,
    tempMaxC: 12,
    tempMinC: 5,
    precipitationMm: 0,
    ...overrides,
  }
}

describe('WeatherStrip frost indicator', () => {
  it('renders nothing when forecast is empty', () => {
    const { container } = render(<WeatherStrip forecast={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows a snowflake when tempMinC is at or below 0', () => {
    const forecast = [makeDay({ tempMinC: -1 })]
    render(<WeatherStrip forecast={forecast} />)
    expect(screen.getByLabelText('Frost expected')).toBeInTheDocument()
  })

  it('shows a frost-risk dot when tempMinC is between 0 and 3', () => {
    const forecast = [makeDay({ tempMinC: 2 })]
    render(<WeatherStrip forecast={forecast} />)
    expect(screen.getByLabelText('Frost risk')).toBeInTheDocument()
  })

  it('shows neither indicator when tempMinC is above 3', () => {
    const forecast = [makeDay({ tempMinC: 5 })]
    render(<WeatherStrip forecast={forecast} />)
    expect(screen.queryByLabelText('Frost expected')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Frost risk')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx vitest run src/__tests__/components/dashboard/WeatherStrip.test.tsx`
Expected: tests fail because the labels do not exist in the current component.

- [ ] **Step 3: Add the frost glyph to the WeatherStrip component**

Replace the inner JSX of each tile in `src/components/dashboard/WeatherStrip.tsx` so that it renders a snowflake or a faint dot beside the min temperature.

```typescript
'use client'

import { Snowflake } from 'lucide-react'
import { ForecastDay } from '@/lib/weather/open-meteo'
import { getWeatherIcon } from '@/lib/weather/wmo-icons'

interface WeatherStripProps {
  forecast: ForecastDay[]
}

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat('en-GB', { weekday: 'short' })

function tileLabel(isoDate: string, index: number): string {
  if (index === 0) return 'Today'
  if (index === 1) return 'Tomorrow'
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return isoDate
  return DAY_LABEL_FORMATTER.format(new Date(y, m - 1, d))
}

function FrostIndicator({ tempMinC }: { tempMinC: number }) {
  if (tempMinC <= 0) {
    return (
      <Snowflake
        className="w-3.5 h-3.5 text-zen-water-600 ml-1"
        aria-label="Frost expected"
      />
    )
  }
  if (tempMinC <= 3) {
    return (
      <span
        className="w-1.5 h-1.5 rounded-full bg-zen-water-300 ml-1"
        aria-label="Frost risk"
        role="img"
      />
    )
  }
  return null
}

export default function WeatherStrip({ forecast }: WeatherStripProps) {
  if (forecast.length === 0) return null

  return (
    <div
      className="grid grid-cols-3 gap-2 -mt-4"
      role="region"
      aria-label="Three day weather forecast"
    >
      {forecast.map((day, index) => {
        const { Icon, label } = getWeatherIcon(day.weatherCode)
        return (
          <div
            key={day.date}
            className="zen-card px-3 py-3 flex flex-col items-center text-center"
          >
            <div className="text-xs font-medium text-zen-stone-500 mb-1">
              {tileLabel(day.date, index)}
            </div>
            <Icon
              className="w-7 h-7 text-zen-water-600 mb-1"
              aria-label={label}
            />
            <div className="text-sm text-zen-ink-900 flex items-center justify-center">
              {Math.round(day.tempMaxC)}° <span className="text-zen-stone-400">/ {Math.round(day.tempMinC)}°</span>
              <FrostIndicator tempMinC={day.tempMinC} />
            </div>
            {day.precipitationMm > 0 && (
              <div className="text-xs text-zen-water-600 mt-0.5">
                {day.precipitationMm.toFixed(1)}mm
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Re-run tests and confirm they pass**

Run: `npx vitest run src/__tests__/components/dashboard/WeatherStrip.test.tsx`
Expected: all four tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/WeatherStrip.tsx src/__tests__/components/dashboard/WeatherStrip.test.tsx
git commit -m "feat(weather): add frost dot and snowflake indicators to WeatherStrip"
```

---

## Task 2: Hardiness field on Vegetable

Adds RHS H1a–H7 hardiness ratings to every plant in the database. The new field is optional on the `Vegetable` type; consumers should treat `undefined` as `'H4'` (hardy) — the safe failure direction for frost warnings (under-warns rather than over-warns). Every existing plant gets an explicit value so the optional fallback never fires in practice for built-in data; the optional shape is preserved so user-imported data does not break the build.

RHS hardiness ratings used:
- `H1a` — heated greenhouse, tropical
- `H1b` — warm conservatory
- `H1c` — warm greenhouse / windowsill (e.g. basil)
- `H2` — tender, cool greenhouse / frost-free (e.g. tomato, cucumber, courgette, runner beans, sweetcorn)
- `H3` — half-hardy, mild winters (e.g. globe artichoke)
- `H4` — hardy, average UK winter (default; covers most crops)
- `H5` — hardy, cold winter
- `H6` — hardy, very cold winter (e.g. brassicas, leeks, parsnips)
- `H7` — very hardy

**Files:**
- Modify: `src/types/garden-planner.ts` (add `Hardiness` type and field)
- Create: `src/lib/hardiness.ts` (helper)
- Create: `src/__tests__/lib/hardiness.test.ts` (helper tests)
- Modify: `src/lib/vegetables/data/alliums.ts`
- Modify: `src/lib/vegetables/data/annual-flowers.ts`
- Modify: `src/lib/vegetables/data/berries.ts`
- Modify: `src/lib/vegetables/data/brassicas.ts`
- Modify: `src/lib/vegetables/data/bulbs.ts`
- Modify: `src/lib/vegetables/data/climbers.ts`
- Modify: `src/lib/vegetables/data/cucurbits.ts`
- Modify: `src/lib/vegetables/data/fruit-trees.ts`
- Modify: `src/lib/vegetables/data/green-manures.ts`
- Modify: `src/lib/vegetables/data/herbs.ts`
- Modify: `src/lib/vegetables/data/leafy-greens.ts`
- Modify: `src/lib/vegetables/data/legumes.ts`
- Modify: `src/lib/vegetables/data/mushrooms.ts`
- Modify: `src/lib/vegetables/data/other.ts`
- Modify: `src/lib/vegetables/data/perennial-flowers.ts`
- Modify: `src/lib/vegetables/data/root-vegetables.ts`
- Modify: `src/lib/vegetables/data/solanaceae.ts`
- Modify: `src/__tests__/lib/vegetable-database.test.ts` (add hardiness coverage assertion)

- [ ] **Step 1: Write the failing tests for the helper**

Create `src/__tests__/lib/hardiness.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { isFrostTender, hardinessOrDefault } from '@/lib/hardiness'

describe('isFrostTender', () => {
  it('returns true for H1a, H1b, H1c, H2 and H3', () => {
    expect(isFrostTender('H1a')).toBe(true)
    expect(isFrostTender('H1b')).toBe(true)
    expect(isFrostTender('H1c')).toBe(true)
    expect(isFrostTender('H2')).toBe(true)
    expect(isFrostTender('H3')).toBe(true)
  })

  it('returns false for H4 and warmer-rated hardy ratings', () => {
    expect(isFrostTender('H4')).toBe(false)
    expect(isFrostTender('H5')).toBe(false)
    expect(isFrostTender('H6')).toBe(false)
    expect(isFrostTender('H7')).toBe(false)
  })

  it('treats undefined as H4 (not tender)', () => {
    expect(isFrostTender(undefined)).toBe(false)
  })
})

describe('hardinessOrDefault', () => {
  it('returns the rating when defined', () => {
    expect(hardinessOrDefault('H2')).toBe('H2')
  })

  it('returns H4 when undefined', () => {
    expect(hardinessOrDefault(undefined)).toBe('H4')
  })
})
```

- [ ] **Step 2: Add the Hardiness type to `garden-planner.ts`**

In `src/types/garden-planner.ts`, add the type union near the other enum unions (after `Month`):

```typescript
/**
 * RHS hardiness rating. H1a–H3 are frost-tender (need protection in UK winters
 * or shoulder seasons). H4 (hardy) is the default and covers most UK crops.
 *
 * Reference: https://www.rhs.org.uk/plants/trials-awards/award-of-garden-merit/rhs-hardiness-rating
 */
export type Hardiness = 'H1a' | 'H1b' | 'H1c' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6' | 'H7'
```

Then extend the `Vegetable` interface (line 108–124) to include the optional field:

```typescript
export interface Vegetable {
  id: string
  name: string
  category: VegetableCategory
  description: string
  planting: PlantingInfo
  care: CareRequirements
  growingRequirement?: GrowingRequirement
  maintenance?: MaintenanceInfo
  careTips?: CareTip[]
  perennialInfo?: PerennialInfo
  rhsUrl?: string
  wikipediaUrl?: string
  botanicalName?: string
  hardiness?: Hardiness            // NEW: RHS H1a–H7 rating; undefined treated as H4
  enhancedCompanions: EnhancedCompanion[]
  enhancedAvoid: EnhancedCompanion[]
}
```

- [ ] **Step 3: Create the hardiness helper module**

Create `src/lib/hardiness.ts`:

```typescript
import type { Hardiness } from '@/types/garden-planner'

const TENDER_RATINGS: ReadonlySet<Hardiness> = new Set(['H1a', 'H1b', 'H1c', 'H2', 'H3'])

/**
 * Default rating when none is set. H4 (hardy) under-warns rather than
 * over-warns — a missing rating won't fire a "frost tender" alert.
 */
export const DEFAULT_HARDINESS: Hardiness = 'H4'

export function hardinessOrDefault(rating: Hardiness | undefined): Hardiness {
  return rating ?? DEFAULT_HARDINESS
}

export function isFrostTender(rating: Hardiness | undefined): boolean {
  return TENDER_RATINGS.has(hardinessOrDefault(rating))
}
```

- [ ] **Step 4: Run helper tests**

Run: `npx vitest run src/__tests__/lib/hardiness.test.ts`
Expected: all six assertions pass.

- [ ] **Step 5: Populate `hardiness` on every plant in every data file**

For each file under `src/lib/vegetables/data/`, add a `hardiness` field after `botanicalName` on every plant entry. Use the values below. If a plant in a file is not listed by id, choose the value of the closest sibling in the same file (in practice almost every entry is named below; default H4 if uncertain).

```
# cucurbits.ts (all H2 — frost-tender summer crops)
courgette: H2
squash: H2
pumpkin: H2
cucumber: H2
melon: H2
gherkin: H2
ridge-cucumber: H2

# solanaceae.ts (all H2 except potato/tomatillo)
tomato: H2
pepper: H2
chilli: H2
aubergine: H2
tomatillo: H2
potato: H3   # foliage frost-tender, tubers survive in soil

# legumes.ts
runner-beans: H2
french-beans: H2
broad-beans: H4
peas: H4
mangetout: H4

# alliums.ts
onion: H4
shallot: H4
garlic: H6
leek: H6
spring-onion: H4
chives: H6

# brassicas.ts
cabbage: H5
kale: H6
broccoli: H4
sprouting-broccoli: H6
cauliflower: H4
brussels-sprouts: H6
swede: H6
turnip: H5
radish: H4
kohlrabi: H4
pak-choi: H4
mustard-greens: H4

# root-vegetables.ts
carrot: H4
beetroot: H4
parsnip: H6
celery: H3
celeriac: H4
fennel: H3
salsify: H6
scorzonera: H6
horseradish: H7
jerusalem-artichoke: H6

# leafy-greens.ts
lettuce: H4
spinach: H5
chard: H4
rocket: H5
sorrel: H6
purslane: H3
corn-salad: H6
mizuna: H5

# herbs.ts
basil: H1c
parsley: H4
coriander: H3
chervil: H4
dill: H3
oregano: H4
mint: H7
rosemary: H4
sage: H4
thyme: H4
tarragon: H4
bay: H4
fennel-herb: H3
lemon-balm: H7

# berries.ts (all hardy in UK)
strawberry: H6
raspberry: H7
blackberry: H7
blackcurrant: H7
redcurrant: H7
whitecurrant: H7
blueberry: H6
gooseberry: H7

# fruit-trees.ts
apple-tree: H6
pear-tree: H6
plum-tree: H6
cherry-tree: H6
fig: H4
quince: H6
medlar: H6
mulberry: H5

# annual-flowers.ts (mostly tender)
nasturtium: H2
calendula: H4
sunflower: H3
cosmos: H2
sweet-pea: H4
marigold: H3
zinnia: H2

# perennial-flowers.ts
borage: H4
echinacea: H7
yarrow: H7
ice-plant: H7
lavender: H4

# bulbs.ts
daffodil: H6
tulip: H6
crocus: H6

# climbers.ts
hops: H6
honeysuckle: H6

# green-manures.ts
clover: H7
mustard-green-manure: H4
phacelia: H4
field-bean: H6
rye-grass: H6

# mushrooms.ts (all H4 default — grown indoors usually)
oyster-mushroom: H4
button-mushroom: H4
shiitake: H4

# other.ts (default to H4 unless obvious)
asparagus: H6
rhubarb: H7
artichoke: H3
seakale: H7
sweetcorn: H2
```

For every plant, add the `hardiness:` field on its own line after `botanicalName` (or after `wikipediaUrl` if `botanicalName` is absent), e.g.:

```typescript
{
  id: 'courgette',
  name: 'Courgettes (Zucchini)',
  // ...
  rhsUrl: 'https://www.rhs.org.uk/vegetables/courgettes/grow-your-own',
  botanicalName: 'Cucurbita pepo',
  hardiness: 'H2',
  wikipediaUrl: 'https://en.wikipedia.org/wiki/Zucchini',
  enhancedCompanions: [/* ... */],
  enhancedAvoid: [/* ... */],
}
```

If a plant id appears in a data file but is missing from the table above, use `'H4'` as a safe default and note it in the commit body.

- [ ] **Step 6: Add a coverage assertion to the database test**

In `src/__tests__/lib/vegetable-database.test.ts`, add a new `describe` block at the bottom of the file:

```typescript
describe('vegetable hardiness coverage', () => {
  const validRatings = new Set(['H1a','H1b','H1c','H2','H3','H4','H5','H6','H7'])

  it('every vegetable has a hardiness rating', () => {
    const missing = vegetables.filter(v => v.hardiness === undefined).map(v => v.id)
    expect(missing).toEqual([])
  })

  it('every hardiness rating is one of the RHS values', () => {
    for (const veg of vegetables) {
      if (veg.hardiness !== undefined) {
        expect(validRatings.has(veg.hardiness)).toBe(true)
      }
    }
  })
})
```

- [ ] **Step 7: Run unit tests and type-check**

Run: `npm run type-check && npx vitest run src/__tests__/lib/vegetable-database.test.ts src/__tests__/lib/hardiness.test.ts`
Expected: type-check clean (the new field is optional, so no callsite breaks); both test files pass.

- [ ] **Step 8: Commit**

```bash
git add src/types/garden-planner.ts src/lib/hardiness.ts src/lib/vegetables/data src/__tests__/lib/hardiness.test.ts src/__tests__/lib/vegetable-database.test.ts
git commit -m "feat(plants): add RHS hardiness rating to every vegetable entry"
```

---

## Task 3: Last/first frost dates from Open-Meteo Climate API

Introduce `fetchFrostDates(lat, lng)` that hits Open-Meteo's free Climate API for ~15 years of daily `temperature_2m_min`, derives an average last spring frost date (last day of year with min ≤ 0 °C in Jan–Jun, averaged across years) and an average first autumn frost date (first day with min ≤ 0 °C in Jul–Dec). Cache on `meta.frostDates` so the whole app reads the same value without refetching. Schema migration v20→v21 adds the field; no data transform needed because the field is optional.

The Open-Meteo Climate API endpoint is `https://climate-api.open-meteo.com/v1/climate` with params:
- `latitude`, `longitude`
- `start_date=2010-01-01`, `end_date=2024-12-31` (15-year window; relative to "today" not strictly required — fixed window is fine for the first cut)
- `models=ECMWF_IFS`
- `daily=temperature_2m_min`

Endpoint returns `daily.time` (array of ISO dates) and `daily.temperature_2m_min` (array of numbers). Both arrays line up index-for-index. We compute averages by day-of-year then take the last spring frost and first autumn frost.

**Files:**
- Create: `src/lib/weather/frost-dates.ts`
- Create: `src/__tests__/lib/weather/frost-dates.test.ts`
- Modify: `src/types/unified-allotment.ts`
- Modify: `src/services/storage-migrations.ts`

- [ ] **Step 1: Write the failing test for `fetchFrostDates`**

Create `src/__tests__/lib/weather/frost-dates.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { fetchFrostDates, _resetFrostCacheForTests } from '@/lib/weather/frost-dates'

const ORIGINAL_FETCH = global.fetch

function mockResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response
}

describe('fetchFrostDates', () => {
  beforeEach(() => {
    _resetFrostCacheForTests()
    localStorage.clear()
    global.fetch = vi.fn()
  })
  afterEach(() => {
    global.fetch = ORIGINAL_FETCH
  })

  it('returns null when the API call fails', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse({}, false, 500))
    const result = await fetchFrostDates(55.95, -3.19)
    expect(result).toBeNull()
  })

  it('derives last spring frost as the average of last frost dates per year', async () => {
    // Two-year synthetic window: last frost in 2010 was 14 May, in 2011 was 16 May.
    // Average day-of-year => 15 May.
    const time: string[] = []
    const temps: number[] = []
    function pushDay(date: string, t: number) {
      time.push(date)
      temps.push(t)
    }
    // 2010
    pushDay('2010-05-13', -1)
    pushDay('2010-05-14', -1)
    pushDay('2010-05-15', 4)
    pushDay('2010-08-15', 12)
    pushDay('2010-10-30', -1)
    // 2011
    pushDay('2011-05-15', -1)
    pushDay('2011-05-16', -1)
    pushDay('2011-05-17', 4)
    pushDay('2011-08-15', 12)
    pushDay('2011-11-02', -1)
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockResponse({ daily: { time, temperature_2m_min: temps } })
    )

    const result = await fetchFrostDates(55.95, -3.19)
    expect(result).not.toBeNull()
    // 14 May (DOY 134) and 16 May (DOY 136) average → 15 May (DOY 135)
    expect(result!.lastSpring.endsWith('-05-15')).toBe(true)
    // 30 Oct and 2 Nov average → 31 Oct
    expect(result!.firstAutumn.endsWith('-10-31')).toBe(true)
    expect(result!.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('returns null when the response has no temperature_2m_min series', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockResponse({ daily: { time: ['2010-01-01'] } })
    )
    const result = await fetchFrostDates(55.95, -3.19)
    expect(result).toBeNull()
  })

  it('caches results and does not refetch on a second call within the same coordinate cell', async () => {
    const time = ['2010-05-14', '2010-05-15', '2010-10-30']
    const temps = [-1, 2, -1]
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockResponse({ daily: { time, temperature_2m_min: temps } })
    )

    const a = await fetchFrostDates(55.95, -3.19)
    const b = await fetchFrostDates(55.95, -3.19)
    expect(a).toEqual(b)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run the test and confirm it fails (module does not exist yet)**

Run: `npx vitest run src/__tests__/lib/weather/frost-dates.test.ts`
Expected: fails with import error / module-not-found.

- [ ] **Step 3: Implement `fetchFrostDates`**

Create `src/lib/weather/frost-dates.ts`:

```typescript
import { logger } from '@/lib/logger'

const ENDPOINT = 'https://climate-api.open-meteo.com/v1/climate'
const CACHE_PREFIX = 'bwp-frost-dates-'
const START_DATE = '2010-01-01'
const END_DATE = '2024-12-31'
const MODEL = 'ECMWF_IFS'
const FROST_THRESHOLD_C = 0

export interface FrostDates {
  /** ISO date (YYYY-MM-DD) for average last spring frost (Jan–Jun). */
  lastSpring: string
  /** ISO date (YYYY-MM-DD) for average first autumn frost (Jul–Dec). */
  firstAutumn: string
  /** ISO timestamp for when the data was fetched. */
  fetchedAt: string
}

interface ClimateResponse {
  daily?: {
    time?: string[]
    temperature_2m_min?: number[]
  }
}

const memoryCache = new Map<string, FrostDates>()

function cacheKey(latitude: number, longitude: number): string {
  return `${CACHE_PREFIX}${latitude.toFixed(2)}-${longitude.toFixed(2)}`
}

function readCache(key: string): FrostDates | null {
  if (memoryCache.has(key)) return memoryCache.get(key)!
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FrostDates
    memoryCache.set(key, parsed)
    return parsed
  } catch {
    return null
  }
}

function writeCache(key: string, value: FrostDates): void {
  memoryCache.set(key, value)
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage may be full or unavailable — fall back to memory-only cache
  }
}

/** Internal helper: only used by tests to clear caches between runs. */
export function _resetFrostCacheForTests(): void {
  memoryCache.clear()
}

interface YearAccumulator {
  year: number
  lastSpringDoy: number | null
  firstAutumnDoy: number | null
}

function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0)
  const diff = date.getTime() - start
  return Math.floor(diff / (24 * 60 * 60 * 1000))
}

function doyToIsoDate(doy: number, referenceYear: number): string {
  const d = new Date(Date.UTC(referenceYear, 0, doy))
  return d.toISOString().slice(0, 10)
}

function deriveFrostDates(times: string[], minTemps: number[]): { lastSpring: string; firstAutumn: string } | null {
  const byYear = new Map<number, YearAccumulator>()

  for (let i = 0; i < times.length; i++) {
    const iso = times[i]
    const t = minTemps[i]
    if (typeof t !== 'number' || Number.isNaN(t)) continue
    const [yStr, mStr, dStr] = iso.split('-')
    const year = Number(yStr)
    const month = Number(mStr)
    const day = Number(dStr)
    if (!year || !month || !day) continue
    const date = new Date(Date.UTC(year, month - 1, day))
    const doy = dayOfYear(date)

    let acc = byYear.get(year)
    if (!acc) {
      acc = { year, lastSpringDoy: null, firstAutumnDoy: null }
      byYear.set(year, acc)
    }

    if (t <= FROST_THRESHOLD_C) {
      // Spring frost: months 1..6 → keep the latest day-of-year seen
      if (month <= 6) {
        if (acc.lastSpringDoy === null || doy > acc.lastSpringDoy) {
          acc.lastSpringDoy = doy
        }
      }
      // Autumn frost: months 7..12 → keep the earliest day-of-year seen
      if (month >= 7) {
        if (acc.firstAutumnDoy === null || doy < acc.firstAutumnDoy) {
          acc.firstAutumnDoy = doy
        }
      }
    }
  }

  const springDoys: number[] = []
  const autumnDoys: number[] = []
  for (const acc of byYear.values()) {
    if (acc.lastSpringDoy !== null) springDoys.push(acc.lastSpringDoy)
    if (acc.firstAutumnDoy !== null) autumnDoys.push(acc.firstAutumnDoy)
  }

  if (springDoys.length === 0 || autumnDoys.length === 0) return null

  const avgSpring = Math.round(springDoys.reduce((a, b) => a + b, 0) / springDoys.length)
  const avgAutumn = Math.round(autumnDoys.reduce((a, b) => a + b, 0) / autumnDoys.length)

  const referenceYear = new Date().getUTCFullYear()
  return {
    lastSpring: doyToIsoDate(avgSpring, referenceYear),
    firstAutumn: doyToIsoDate(avgAutumn, referenceYear),
  }
}

export async function fetchFrostDates(latitude: number, longitude: number): Promise<FrostDates | null> {
  const key = cacheKey(latitude, longitude)
  const cached = readCache(key)
  if (cached) return cached

  const url = `${ENDPOINT}?latitude=${latitude}&longitude=${longitude}&start_date=${START_DATE}&end_date=${END_DATE}&models=${MODEL}&daily=temperature_2m_min`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      logger.warn('frost-dates: API request failed', { status: res.status })
      return null
    }
    const body = (await res.json()) as ClimateResponse
    const times = body.daily?.time
    const temps = body.daily?.temperature_2m_min
    if (!Array.isArray(times) || !Array.isArray(temps) || times.length === 0 || temps.length === 0) {
      return null
    }
    const derived = deriveFrostDates(times, temps)
    if (!derived) return null
    const result: FrostDates = {
      ...derived,
      fetchedAt: new Date().toISOString(),
    }
    writeCache(key, result)
    return result
  } catch (error) {
    logger.warn('frost-dates: fetch error', { error: String(error) })
    return null
  }
}
```

- [ ] **Step 4: Run the test suite and confirm it passes**

Run: `npx vitest run src/__tests__/lib/weather/frost-dates.test.ts`
Expected: all four cases pass.

- [ ] **Step 5: Add `frostDates` to `AllotmentMeta` and bump the schema version**

Edit `src/types/unified-allotment.ts`:

In `AllotmentMeta` (lines 174–189) add the new optional field:

```typescript
export interface AllotmentMeta {
  name: string
  location?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  /**
   * Average last spring frost / first autumn frost, derived once from the
   * Open-Meteo Climate API and cached forever (or until the user moves
   * coordinates). Optional — undefined means the data has not been fetched
   * yet, callers should fall back to defaults.
   */
  frostDates?: {
    lastSpring: string   // ISO date in current year, e.g. "2026-05-15"
    firstAutumn: string  // ISO date in current year, e.g. "2026-10-12"
    fetchedAt: string    // ISO timestamp
  }
  createdAt: string
  updatedAt: string
  setupCompleted?: boolean
}
```

Then bump the schema version constant:

```typescript
export const CURRENT_SCHEMA_VERSION = 21 // Add meta.frostDates for frost-aware planning
```

- [ ] **Step 6: Add the v20→v21 migration**

In `src/services/storage-migrations.ts`, add a new block before the final `migrated.version = CURRENT_SCHEMA_VERSION` line:

```typescript
  // Version 20 -> 21: Added meta.frostDates for frost-aware planning.
  // No data transform needed — the field is optional and is populated lazily
  // by the weather hook the first time coordinates are available.
  if (migrated.version < 21) {
    migrated.version = 21
    logger.info('Schema migration complete', { from: 20, to: 21, change: 'added meta.frostDates for frost-aware planning' })
    return migrateSchema(migrated)
  }
```

- [ ] **Step 7: Run type-check and the full unit test suite**

Run: `npm run type-check && npm run test:unit`
Expected: type-check clean, all tests pass (including the new frost-dates tests).

- [ ] **Step 8: Commit**

```bash
git add src/lib/weather/frost-dates.ts src/__tests__/lib/weather/frost-dates.test.ts src/types/unified-allotment.ts src/services/storage-migrations.ts
git commit -m "feat(weather): fetch and cache average frost dates from Open-Meteo Climate API"
```

---

## Task 4: Tonight's frost warning banner

When `forecast[0].tempMinC ≤ 0` and the user has at least one active planting whose plant is frost-tender (`isFrostTender(vegetable.hardiness)`), show a yellow banner on Today: *"Frost tonight — protect your tender crops"* with a list of affected bed names. Mirrors the structure of `LocationPromptBanner` (zen-card, dismissable, localStorage-backed dismissal keyed by date so the dismissal resets each night).

**Files:**
- Create: `src/components/dashboard/FrostWarningBanner.tsx`
- Create: `src/__tests__/components/dashboard/FrostWarningBanner.test.tsx`
- Modify: `src/components/dashboard/TodayDashboard.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/components/dashboard/FrostWarningBanner.test.tsx`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import FrostWarningBanner from '@/components/dashboard/FrostWarningBanner'

const todayIso = new Date().toISOString().slice(0, 10)

const baseProps = {
  forecastMinC: -1,
  affectedAreas: [{ areaId: 'a', areaName: 'Bed A', plantNames: ['Tomato'] }],
  todayIso,
}

describe('FrostWarningBanner', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders nothing when forecastMinC is above 0', () => {
    const { container } = render(
      <FrostWarningBanner {...baseProps} forecastMinC={2} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when there are no affected areas', () => {
    const { container } = render(
      <FrostWarningBanner {...baseProps} affectedAreas={[]} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows the warning copy and the affected bed name when frost is forecast', () => {
    render(<FrostWarningBanner {...baseProps} />)
    expect(screen.getByText(/Frost tonight/i)).toBeInTheDocument()
    expect(screen.getByText(/Bed A/)).toBeInTheDocument()
    expect(screen.getByText(/Tomato/)).toBeInTheDocument()
  })

  it('hides itself once the dismiss button has been clicked for today', () => {
    const { rerender } = render(<FrostWarningBanner {...baseProps} />)
    screen.getByLabelText('Dismiss').click()
    rerender(<FrostWarningBanner {...baseProps} />)
    expect(screen.queryByText(/Frost tonight/i)).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run src/__tests__/components/dashboard/FrostWarningBanner.test.tsx`
Expected: fails with module-not-found.

- [ ] **Step 3: Implement the banner**

Create `src/components/dashboard/FrostWarningBanner.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Snowflake, X } from 'lucide-react'

const DISMISSED_KEY_PREFIX = 'bwp-frost-banner-dismissed-'

export interface FrostAffectedArea {
  areaId: string
  areaName: string
  plantNames: string[]
}

interface FrostWarningBannerProps {
  forecastMinC: number
  affectedAreas: FrostAffectedArea[]
  /** YYYY-MM-DD for today; passed in for test determinism. */
  todayIso: string
}

export default function FrostWarningBanner({
  forecastMinC,
  affectedAreas,
  todayIso,
}: FrostWarningBannerProps) {
  const dismissedKey = `${DISMISSED_KEY_PREFIX}${todayIso}`
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(dismissedKey) === 'true') {
        setDismissed(true)
      }
    } catch {
      // ignore
    }
  }, [dismissedKey])

  if (forecastMinC > 0) return null
  if (affectedAreas.length === 0) return null
  if (dismissed) return null

  const handleDismiss = () => {
    try {
      localStorage.setItem(dismissedKey, 'true')
    } catch {
      // ignore
    }
    setDismissed(true)
  }

  return (
    <div
      className="zen-card p-4 bg-zen-tanuki-50 border border-zen-tanuki-200 flex items-start gap-3"
      role="alert"
    >
      <Snowflake className="w-5 h-5 text-zen-tanuki-700 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zen-ink-900">
          Frost tonight — protect your tender crops
        </p>
        <p className="text-xs text-zen-stone-600 mt-1">
          Forecast minimum: {Math.round(forecastMinC)}°C. Cover or move tender plants tonight.
        </p>
        <ul className="mt-2 text-xs text-zen-ink-700 space-y-0.5">
          {affectedAreas.map(area => (
            <li key={area.areaId}>
              <span className="font-medium">{area.areaName}:</span>{' '}
              {area.plantNames.join(', ')}
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={handleDismiss}
        className="p-1 text-zen-stone-400 hover:text-zen-stone-600 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run banner tests and confirm they pass**

Run: `npx vitest run src/__tests__/components/dashboard/FrostWarningBanner.test.tsx`
Expected: all four cases pass.

- [ ] **Step 5: Mount the banner in TodayDashboard**

Edit `src/components/dashboard/TodayDashboard.tsx`. The banner needs the active plantings filtered to tender crops. The dashboard already has `data` (AllotmentData) and `rainfall` (with the forecast). Use the current season's areas to compute affected areas.

Add an import block near the existing imports:

```typescript
import FrostWarningBanner, { FrostAffectedArea } from './FrostWarningBanner'
import { isFrostTender } from '@/lib/hardiness'
import { getVegetableByIdCached } from '@/lib/vegetable-loader'
```

Add a derivation just above the JSX return (after `showLocationPrompt` is computed). Note: `AreaSeason` only stores `areaId`; the display name lives on `Area` in `data.layout.areas`, so look it up from the layout.

```typescript
const todayIso = new Date().toISOString().slice(0, 10)
const tonightMinC = rainfall?.forecast?.[0]?.tempMinC ?? Infinity
const currentSeason = data?.seasons.find(s => s.year === data.currentYear)
const layoutAreas = data?.layout.areas ?? []
const affectedAreas: FrostAffectedArea[] = []
if (tonightMinC <= 0 && currentSeason) {
  for (const areaSeason of currentSeason.areas || []) {
    const tenderNames: string[] = []
    for (const planting of areaSeason.plantings || []) {
      if (planting.status === 'removed' || planting.status === 'harvested') continue
      const veg = getVegetableByIdCached(planting.vegetableId)
      if (veg && isFrostTender(veg.hardiness)) {
        tenderNames.push(veg.name)
      }
    }
    if (tenderNames.length > 0) {
      const layoutArea = layoutAreas.find(a => a.id === areaSeason.areaId)
      affectedAreas.push({
        areaId: areaSeason.areaId,
        areaName: layoutArea?.name ?? areaSeason.areaId,
        plantNames: Array.from(new Set(tenderNames)),
      })
    }
  }
}
```

Then mount the banner between `LocationPromptBanner` and `WeatherStrip` (lines 114–122 in the existing file):

```tsx
{showLocationPrompt && (
  <LocationPromptBanner onRequestLocation={onRequestLocation} />
)}
<FrostWarningBanner
  forecastMinC={tonightMinC}
  affectedAreas={affectedAreas}
  todayIso={todayIso}
/>
{rainfall && hasCoordinates && rainfall.forecast && (
  <WeatherStrip forecast={rainfall.forecast} />
)}
```

(`<FrostWarningBanner>` returns null when conditions are not met, so it's safe to render unconditionally.)

- [ ] **Step 6: Run unit tests and type-check**

Run: `npm run type-check && npx vitest run src/__tests__/components/dashboard/`
Expected: type-check clean, all dashboard tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/dashboard/FrostWarningBanner.tsx src/components/dashboard/TodayDashboard.tsx src/__tests__/components/dashboard/FrostWarningBanner.test.tsx
git commit -m "feat(today): add frost warning banner for tender crops"
```

---

## Task 5: Frost-aware `validateSowDate()`

`validateSowDate()` currently warns about fall sowings using the `FALL_FACTOR_DAYS` heuristic. With `vegetable.hardiness` populated and `frostDates` available on `AllotmentData.meta`, replace generic fall warnings with date-driven ones for frost-tender crops: *"Cucumber is H2 (frost tender). Average last spring frost is 14 May; sowing outdoors before then risks frost damage."* The change is additive — existing warnings are preserved when no frost dates are passed.

**Files:**
- Modify: `src/lib/date-calculator.ts` (introduces and exports a new `SowDateValidationContext` interface)
- Modify: `src/components/allotment/SowDateValidator.tsx`
- Modify: `src/components/allotment/AddPlantingForm.tsx`
- Modify: `src/__tests__/lib/date-calculator.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `src/__tests__/lib/date-calculator.test.ts` near the existing `validateSowDate` block:

```typescript
describe('validateSowDate (frost awareness)', () => {
  const tenderTomato: Vegetable = {
    ...testTomato,
    hardiness: 'H2',
  }
  const hardyCarrot: Vegetable = {
    ...testCarrot,
    hardiness: 'H4',
  }
  const frostDates = {
    lastSpring: '2025-05-15',
    firstAutumn: '2025-10-12',
    fetchedAt: '2025-01-01T00:00:00.000Z',
  }

  it('warns when a tender crop is sown outdoors before the average last spring frost', () => {
    const result = validateSowDate('2025-04-30', 'outdoor', tenderTomato, { frostDates })
    expect(result.warnings.some(w => w.includes('frost'))).toBe(true)
    expect(result.warnings.some(w => w.includes('15 May') || w.includes('2025-05-15'))).toBe(true)
  })

  it('does not warn when a tender crop is sown outdoors after the last spring frost', () => {
    const result = validateSowDate('2025-05-20', 'outdoor', tenderTomato, { frostDates })
    expect(result.warnings.some(w => w.toLowerCase().includes('frost'))).toBe(false)
  })

  it('does not warn for hardy crops sown before the last spring frost', () => {
    const result = validateSowDate('2025-04-15', 'outdoor', hardyCarrot, { frostDates })
    expect(result.warnings.some(w => w.toLowerCase().includes('frost'))).toBe(false)
  })

  it('does not warn for indoor sowings of tender crops before the last spring frost', () => {
    const result = validateSowDate('2025-04-01', 'indoor', tenderTomato, { frostDates })
    expect(result.warnings.some(w => w.toLowerCase().includes('frost tender'))).toBe(false)
  })

  it('preserves existing behaviour when no frostDates are provided', () => {
    const result = validateSowDate('2025-04-15', 'outdoor', tenderTomato)
    // Same as before — no frost-tender warning fires without frost dates.
    expect(result.warnings.some(w => w.toLowerCase().includes('frost tender'))).toBe(false)
  })
})
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run src/__tests__/lib/date-calculator.test.ts`
Expected: the new `validateSowDate (frost awareness)` block fails because the function signature does not accept the options argument.

- [ ] **Step 3: Extend `validateSowDate` to accept frost context**

In `src/lib/date-calculator.ts`, modify the existing `validateSowDate` signature and add the frost-awareness logic just before the `return { isValid, warnings, errors }` at the end of the happy path (after the existing fall-sowing check):

```typescript
export interface SowDateValidationContext {
  frostDates?: {
    lastSpring: string
    firstAutumn: string
    fetchedAt: string
  }
}

export function validateSowDate(
  sowDate: string,
  sowMethod: SowMethod,
  vegetable: Vegetable,
  context: SowDateValidationContext = {}
): SowDateValidation {
  // ... existing body unchanged up to and including the fall-sowing warning ...

  // Frost-tender warning: only outdoor or transplant-out for tender crops,
  // and only when the user has cached frost dates available.
  const frostDates = context.frostDates
  if (
    frostDates &&
    sowMethod !== 'indoor' &&
    isFrostTender(vegetable.hardiness)
  ) {
    const sowDateObj = parseDate(sowDate)
    const lastSpring = parseDate(applySowYear(frostDates.lastSpring, sowDateObj))
    if (sowDateObj < lastSpring) {
      const display = formatHumanDate(lastSpring)
      warnings.push(
        `${vegetable.name} is ${vegetable.hardiness} (frost tender). Average last spring frost is ${display}; sowing outdoors before then risks frost damage.`
      )
    }
  }

  return { isValid, warnings, errors }
}

function applySowYear(isoDate: string, sowDate: Date): string {
  // frostDates.lastSpring is stored against the current calendar year. If the
  // user is sowing in a different year, swap in their year so the comparison
  // works consistently.
  const sowYear = sowDate.getFullYear()
  return `${sowYear}-${isoDate.slice(5)}`
}

function formatHumanDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' })
  return formatter.format(date)
}
```

Add the import at the top of the file:

```typescript
import { isFrostTender } from '@/lib/hardiness'
```

- [ ] **Step 4: Run the date-calculator tests**

Run: `npx vitest run src/__tests__/lib/date-calculator.test.ts`
Expected: the new block passes; all existing tests still pass.

- [ ] **Step 5: Wire `frostDates` through SowDateValidator**

Edit `src/components/allotment/SowDateValidator.tsx` to accept and forward the frost dates:

```typescript
interface SowDateValidatorProps {
  sowDate: string
  sowMethod: SowMethod
  vegetable: Vegetable
  transplantDate?: string
  frostDates?: SowDateValidationContext['frostDates']
}

// inside the component:
const sowValidation = validateSowDate(sowDate, sowMethod, vegetable, {
  frostDates: props.frostDates,
})
```

(Import `SowDateValidationContext` alongside the existing date-calculator imports.)

- [ ] **Step 6: Pass `frostDates` from AddPlantingForm**

Edit `src/components/allotment/AddPlantingForm.tsx`. The form already has access to allotment data via the `useAllotment` hook (or whatever hook the form uses — open the file, find where it gets `data` or `meta`). Pass `data.meta.frostDates` to the validator:

```tsx
{selectedVegetable && sowDate && (
  <SowDateValidator
    sowDate={sowDate}
    sowMethod={sowMethod}
    vegetable={selectedVegetable}
    transplantDate={transplantDate || undefined}
    frostDates={data?.meta.frostDates}
  />
)}
```

If the form does not currently access `data`, lift it via `useAllotment()` at the top of the component (the project has a stable `useAllotment` hook used widely).

- [ ] **Step 7: Run the full test suite and type-check**

Run: `npm run type-check && npm run test:unit`
Expected: type-check clean, all tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/lib/date-calculator.ts src/components/allotment/SowDateValidator.tsx src/components/allotment/AddPlantingForm.tsx src/__tests__/lib/date-calculator.test.ts
git commit -m "feat(planting): frost-aware sow date validation using hardiness + frost dates"
```

---

## Final verification

- [ ] **Step 1: Lint, type-check, full test suite**

Run: `npm run lint && npm run type-check && npm run test:unit`
Expected: all green.

- [ ] **Step 2: Start dev server and spot-check**

Run: `npm run dev` (background) and open http://localhost:3000.

Manual checks:
1. WeatherStrip shows a snowflake or faint dot when forecast minimum is low (force a low-temp scenario by editing local data if needed).
2. With a tender crop planted (e.g. tomato) and a cold forecast, the FrostWarningBanner appears on the Today page.
3. AddPlantingForm shows the frost-tender warning for an outdoor tomato sown in early April once frostDates are populated for the user.

- [ ] **Step 3: Final commit if any cleanup is required**

If verification reveals any rough edges (e.g. spacing on the snowflake, banner copy), fix and commit with a `chore:` or `fix:` prefix.

- [ ] **Step 4: Push branch and open PR**

```bash
git push -u origin <branch-name>
gh pr create --title "feat: frost-aware planning" --body "$(cat <<'EOF'
## Summary
- Frost dot/snowflake on the 3-day WeatherStrip
- RHS hardiness ratings on every vegetable
- Average frost dates fetched once from the Open-Meteo Climate API and cached on `meta.frostDates` (schema v21)
- Tonight's frost banner on the Today dashboard listing tender crops at risk
- Frost-aware `validateSowDate()` for tender crops sown outdoors before last spring frost

## Test plan
- [x] `npm run lint`
- [x] `npm run type-check`
- [x] `npm run test:unit`
- [ ] Manual: forecast minimum below 0 °C surfaces snowflake on WeatherStrip
- [ ] Manual: tender crop + cold forecast surfaces FrostWarningBanner
- [ ] Manual: AddPlantingForm shows frost-tender warning for early outdoor tomato sowing

EOF
)"
```
