# Plant Guide Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add difficulty filter, "my plants" filter with planted badges, and a plant summary dialog reusable from seeds/allotment pages.

**Architecture:** Three independent features sharing the plant guide pages. Task 1 extends the VegetableIndex with difficulty data. Task 2 adds filters and badges to the plants index page. Task 3 extracts MonthBar to a shared component. Task 4 creates the PlantSummaryDialog. Task 5 wires the dialog into seeds and allotment pages.

**Tech Stack:** React 19, Next.js 16, TypeScript, Tailwind CSS, Vitest

---

### Task 1: Add difficulty to VegetableIndex

**Files:**
- Modify: `src/lib/vegetables/index.ts` — add `difficulty` field to interface and all entries
- Modify: `src/types/garden-planner.ts` — no changes needed (DifficultyLevel already exported)

**Step 1: Update the VegetableIndex interface**

In `src/lib/vegetables/index.ts`, add `difficulty` to the interface:

```typescript
import { VegetableCategory, DifficultyLevel } from '@/types/garden-planner'

export interface VegetableIndex {
  id: string
  name: string
  category: VegetableCategory
  difficulty: DifficultyLevel
}
```

**Step 2: Add difficulty to every entry**

Each entry in the `vegetableIndex` array needs a `difficulty` field. The values must match what's in the full vegetable database files under `src/lib/vegetables/data/*.ts`. Use the `care.difficulty` value from each plant's full entry. This is ~192 entries.

Example:
```typescript
{ id: 'lettuce', name: 'Lettuce', category: 'leafy-greens', difficulty: 'beginner' },
```

**Step 3: Verify**

Run: `npm run type-check` — should pass with no new errors
Run: `npm run lint` — should pass

**Step 4: Commit**

```
feat: add difficulty to vegetable index
```

---

### Task 2: Add difficulty filter, "my plants" filter, and planted badges

**Files:**
- Modify: `src/app/plants/page.tsx`
- Test: `src/__tests__/app/plants-page.test.tsx` (new)

**Step 1: Write tests for the new filters**

Create `src/__tests__/app/plants-page.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock useSearchParams
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

// Mock useAllotment — return data with one planting of 'lettuce' in current year
const mockData = {
  currentYear: 2026,
  seasons: [{
    year: 2026,
    areas: [{
      areaId: 'bed-a',
      plantings: [{ id: 'p1', plantId: 'lettuce' }],
    }],
  }],
}
vi.mock('@/hooks/useAllotment', () => ({
  useAllotment: () => ({ data: mockData }),
}))

// Use the real vegetable index (it's lightweight)

describe('Plants page filters', () => {
  it('renders difficulty dropdown with all levels option', async () => {
    const { default: PlantsPage } = await import('@/app/plants/page')
    render(<PlantsPage />)
    expect(screen.getByDisplayValue('All levels')).toBeInTheDocument()
  })

  it('renders my plants checkbox', async () => {
    const { default: PlantsPage } = await import('@/app/plants/page')
    render(<PlantsPage />)
    expect(screen.getByLabelText(/my plants/i)).toBeInTheDocument()
  })

  it('shows planted badge for plants in current season', async () => {
    const { default: PlantsPage } = await import('@/app/plants/page')
    render(<PlantsPage />)
    // Lettuce should show a planted indicator
    const lettuceRow = screen.getByText('Lettuce').closest('a')
    expect(lettuceRow).toHaveTextContent(/planted/i)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/app/plants-page.test.tsx`
Expected: FAIL

**Step 3: Implement the filters in page.tsx**

Modify `src/app/plants/page.tsx`:

Add imports:
```typescript
import { useAllotment } from '@/hooks/useAllotment'
import { DifficultyLevel } from '@/types/garden-planner'
```

Add state for new filters:
```typescript
const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all')
const [myPlantsOnly, setMyPlantsOnly] = useState(false)
const { data } = useAllotment()
```

Compute planted plant IDs from current year season data:
```typescript
const plantedIds = useMemo(() => {
  if (!data) return new Set<string>()
  const currentSeason = data.seasons.find(s => s.year === data.currentYear)
  if (!currentSeason) return new Set<string>()
  const ids = new Set<string>()
  for (const area of currentSeason.areas) {
    for (const p of area.plantings || []) {
      ids.add(p.plantId)
    }
  }
  return ids
}, [data])
```

Update the filter logic in the `grouped` useMemo to include difficulty and myPlantsOnly:
```typescript
const grouped = useMemo(() => {
  const lowerSearch = search.toLowerCase()
  const filtered = vegetableIndex.filter(v => {
    if (selectedCategory !== 'all' && v.category !== selectedCategory) return false
    if (selectedDifficulty !== 'all' && v.difficulty !== selectedDifficulty) return false
    if (myPlantsOnly && !plantedIds.has(v.id)) return false
    if (search && !v.name.toLowerCase().includes(lowerSearch) && !v.id.toLowerCase().includes(lowerSearch)) return false
    return true
  })
  // ... rest unchanged
}, [search, selectedCategory, selectedDifficulty, myPlantsOnly, plantedIds])
```

Add the difficulty dropdown after the category dropdown:
```tsx
<select
  value={selectedDifficulty}
  onChange={e => setSelectedDifficulty(e.target.value as DifficultyLevel | 'all')}
  className="zen-select sm:w-40"
>
  <option value="all">All levels</option>
  <option value="beginner">Beginner</option>
  <option value="intermediate">Intermediate</option>
  <option value="advanced">Advanced</option>
</select>
```

Add the "my plants" checkbox below the filter row:
```tsx
<label className="flex items-center gap-2 text-sm text-zen-ink-600 cursor-pointer">
  <input
    type="checkbox"
    checked={myPlantsOnly}
    onChange={e => setMyPlantsOnly(e.target.checked)}
    className="rounded border-zen-stone-300 text-zen-moss-600 focus:ring-zen-moss-500"
  />
  My plants only
</label>
```

Add a "planted" badge in the plant link when `plantedIds.has(v.id)`:
```tsx
<Link key={v.id} href={`/plants/${v.id}`} className="block px-4 py-3 hover:bg-zen-stone-50 transition-colors">
  <span className="flex items-center justify-between">
    <span className="text-sm text-zen-ink-700">{v.name}</span>
    {plantedIds.has(v.id) && (
      <span className="zen-badge-moss text-xs">planted</span>
    )}
  </span>
</Link>
```

Update the empty state when myPlantsOnly is on and nothing matches:
```tsx
{categoryOrder.length === 0 ? (
  <div className="zen-card p-8 text-center">
    <p className="text-zen-stone-500">
      {myPlantsOnly
        ? 'No plants added yet — start planning in Allotment.'
        : 'No plants match your search.'}
    </p>
  </div>
) : ( ... )}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/app/plants-page.test.tsx`
Expected: PASS

**Step 5: Run full checks**

Run: `npm run type-check && npm run lint && npx vitest run`

**Step 6: Commit**

```
feat: add difficulty filter, my-plants filter, and planted badges to plant guide
```

---

### Task 3: Extract MonthBar to shared component

**Files:**
- Create: `src/components/plants/MonthBar.tsx`
- Modify: `src/app/plants/[id]/page.tsx` — import from shared location

**Step 1: Create the shared MonthBar component**

Create `src/components/plants/MonthBar.tsx` by moving the MonthBar function from `src/app/plants/[id]/page.tsx`. Keep it identical but export it:

```typescript
import { MONTH_NAMES_SHORT, type Month } from '@/types/garden-planner'

export default function MonthBar({
  label,
  months,
  color,
}: {
  label: string
  months: Month[]
  color: string
}) {
  if (months.length === 0) return null
  const allMonths: Month[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-zen-ink-600 w-20 sm:w-28 shrink-0">{label}</span>
      <div className="flex gap-0.5 flex-1">
        {allMonths.map(m => (
          <div
            key={m}
            className={`h-6 flex-1 rounded-sm text-[10px] flex items-center justify-center ${
              months.includes(m) ? color : 'bg-zen-stone-100 text-zen-stone-400'
            }`}
            title={MONTH_NAMES_SHORT[m]}
          >
            {MONTH_NAMES_SHORT[m][0]}
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Update plants/[id]/page.tsx**

Remove the local `MonthBar` function and add:
```typescript
import MonthBar from '@/components/plants/MonthBar'
```

**Step 3: Verify**

Run: `npm run type-check && npm run lint`

**Step 4: Commit**

```
refactor: extract MonthBar to shared component
```

---

### Task 4: Create PlantSummaryDialog

**Files:**
- Create: `src/components/plants/PlantSummaryDialog.tsx`
- Test: `src/__tests__/components/PlantSummaryDialog.test.tsx` (new)

**Step 1: Write test**

Create `src/__tests__/components/PlantSummaryDialog.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import PlantSummaryDialog from '@/components/plants/PlantSummaryDialog'

// Mock vegetable-database
vi.mock('@/lib/vegetable-database', () => ({
  getVegetableById: (id: string) => id === 'lettuce' ? {
    id: 'lettuce',
    name: 'Lettuce',
    botanicalName: 'Lactuca sativa',
    description: 'A leafy green',
    category: 'leafy-greens',
    care: { sun: 'partial-shade', water: 'moderate', spacing: { between: 25, rows: 30 }, depth: 1, difficulty: 'beginner', tips: [] },
    planting: { sowIndoorsMonths: [2, 3], sowOutdoorsMonths: [4, 5], transplantMonths: [4, 5], harvestMonths: [6, 7, 8], daysToHarvest: { min: 45, max: 70 } },
    enhancedCompanions: [],
    enhancedAvoid: [],
  } : null,
}))

describe('PlantSummaryDialog', () => {
  it('renders plant name and key facts when open', () => {
    render(<PlantSummaryDialog plantId="lettuce" isOpen={true} onClose={() => {}} />)
    expect(screen.getByText('Lettuce')).toBeInTheDocument()
    expect(screen.getByText('Beginner')).toBeInTheDocument()
    expect(screen.getByText(/Partial Shade/)).toBeInTheDocument()
  })

  it('renders nothing when plantId is invalid', () => {
    render(<PlantSummaryDialog plantId="nonexistent" isOpen={true} onClose={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('includes link to full detail page', () => {
    render(<PlantSummaryDialog plantId="lettuce" isOpen={true} onClose={() => {}} />)
    expect(screen.getByText('View full details')).toHaveAttribute('href', '/plants/lettuce')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/PlantSummaryDialog.test.tsx`
Expected: FAIL

**Step 3: Implement PlantSummaryDialog**

Create `src/components/plants/PlantSummaryDialog.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { getVegetableById } from '@/lib/vegetable-database'
import Dialog from '@/components/ui/Dialog'
import MonthBar from '@/components/plants/MonthBar'

function formatSun(sun: string): string {
  return sun.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function formatDifficulty(d: string): string {
  return d.charAt(0).toUpperCase() + d.slice(1)
}

function difficultyColor(d: string): string {
  if (d === 'beginner') return 'zen-badge-moss'
  if (d === 'intermediate') return 'zen-badge-kitsune'
  return 'zen-badge-sakura'
}

interface PlantSummaryDialogProps {
  plantId: string | null
  isOpen: boolean
  onClose: () => void
}

export default function PlantSummaryDialog({ plantId, isOpen, onClose }: PlantSummaryDialogProps) {
  if (!plantId) return null
  const plant = getVegetableById(plantId)
  if (!plant) return null

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={plant.name} maxWidth="lg">
      <div className="space-y-4">
        {/* Header info */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className={difficultyColor(plant.care.difficulty)}>
            {formatDifficulty(plant.care.difficulty)}
          </span>
          {plant.botanicalName && (
            <span className="text-sm text-zen-stone-500 italic">{plant.botanicalName}</span>
          )}
        </div>

        {/* Key facts grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <div className="text-xs text-zen-stone-500">Sun</div>
            <div className="text-sm text-zen-ink-700">{formatSun(plant.care.sun)}</div>
          </div>
          <div>
            <div className="text-xs text-zen-stone-500">Water</div>
            <div className="text-sm text-zen-ink-700">{plant.care.water.charAt(0).toUpperCase() + plant.care.water.slice(1)}</div>
          </div>
          <div>
            <div className="text-xs text-zen-stone-500">Spacing</div>
            <div className="text-sm text-zen-ink-700">{plant.care.spacing.between}cm</div>
          </div>
          <div>
            <div className="text-xs text-zen-stone-500">Depth</div>
            <div className="text-sm text-zen-ink-700">{plant.care.depth}cm</div>
          </div>
        </div>

        {/* Planting calendar */}
        <div className="space-y-2">
          <MonthBar label="Sow Indoors" months={plant.planting.sowIndoorsMonths} color="bg-zen-water-200 text-zen-water-800" />
          <MonthBar label="Sow Outdoors" months={plant.planting.sowOutdoorsMonths} color="bg-zen-moss-200 text-zen-moss-800" />
          <MonthBar label="Transplant" months={plant.planting.transplantMonths} color="bg-zen-bamboo-200 text-zen-bamboo-800" />
          <MonthBar label="Harvest" months={plant.planting.harvestMonths} color="bg-zen-kitsune-200 text-zen-kitsune-800" />
        </div>

        <p className="text-xs text-zen-stone-500">
          {plant.planting.daysToHarvest.min}–{plant.planting.daysToHarvest.max} days to harvest
        </p>

        {/* Link to full page */}
        <Link
          href={`/plants/${plant.id}`}
          onClick={onClose}
          className="block text-center text-sm text-zen-moss-600 hover:text-zen-moss-700 transition py-2"
        >
          View full details →
        </Link>
      </div>
    </Dialog>
  )
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/components/PlantSummaryDialog.test.tsx`
Expected: PASS

**Step 5: Commit**

```
feat: add PlantSummaryDialog component
```

---

### Task 5: Wire PlantSummaryDialog into seeds and allotment pages

**Files:**
- Modify: `src/app/seeds/page.tsx` — make group header plant names open dialog
- Modify: `src/components/allotment/PlantingCard.tsx` — add info button to open dialog
- Modify: `src/components/allotment/details/BedDetailPanel.tsx` — manage dialog state

**Step 1: Add dialog to seeds page**

In `src/app/seeds/page.tsx`:

Add imports:
```typescript
import PlantSummaryDialog from '@/components/plants/PlantSummaryDialog'
```

Add state:
```typescript
const [summaryPlantId, setSummaryPlantId] = useState<string | null>(null)
```

Replace the plant group name text with a clickable button. Currently at line ~442:
```tsx
<span className="font-medium text-zen-ink-800">{name}</span>
```

Replace with a button that opens the dialog. Need to resolve the name back to an ID — look up in vegetableIndex:
```tsx
<button
  type="button"
  onClick={(e) => {
    e.stopPropagation()
    const veg = vegetableIndex.find(v => v.name === name)
    if (veg) setSummaryPlantId(veg.id)
  }}
  className="font-medium text-zen-ink-800 hover:text-zen-moss-700 transition-colors underline decoration-zen-stone-300 underline-offset-2"
>
  {name}
</button>
```

Add the dialog at the end of the component (before closing fragment/div):
```tsx
<PlantSummaryDialog
  plantId={summaryPlantId}
  isOpen={summaryPlantId !== null}
  onClose={() => setSummaryPlantId(null)}
/>
```

Also add the `vegetableIndex` import if not already present.

**Step 2: Add dialog to allotment PlantingCard**

The PlantingCard already has an `onClick` prop that opens PlantingDetailDialog. Adding a separate info button to open the plant summary dialog would conflict with the card click. Instead, add a small info icon button on the plant name that opens the summary dialog.

Modify `src/components/allotment/PlantingCard.tsx`:

Add to props interface:
```typescript
onPlantInfo?: (plantId: string) => void
```

Add a small info button next to the plant name (line ~65):
```tsx
<span className="font-medium text-zen-ink-800">
  {veg?.name || planting.plantId}
</span>
{onPlantInfo && veg && (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation()
      onPlantInfo(planting.plantId)
    }}
    className="p-1 text-zen-stone-400 hover:text-zen-moss-600 transition-colors rounded-zen"
    aria-label={`Info about ${veg.name}`}
    title={`About ${veg.name}`}
  >
    <Info className="w-3.5 h-3.5" />
  </button>
)}
```

Add `Info` to the lucide-react import.

**Step 3: Wire dialog in BedDetailPanel**

Modify `src/components/allotment/details/BedDetailPanel.tsx`:

Add imports:
```typescript
import PlantSummaryDialog from '@/components/plants/PlantSummaryDialog'
```

Add state:
```typescript
const [summaryPlantId, setSummaryPlantId] = useState<string | null>(null)
```

Pass the callback to PlantingCard where it's rendered:
```tsx
<PlantingCard
  ...existing props...
  onPlantInfo={setSummaryPlantId}
/>
```

Add dialog at end of component:
```tsx
<PlantSummaryDialog
  plantId={summaryPlantId}
  isOpen={summaryPlantId !== null}
  onClose={() => setSummaryPlantId(null)}
/>
```

**Step 4: Verify**

Run: `npm run type-check && npm run lint && npx vitest run`

**Step 5: Commit**

```
feat: wire PlantSummaryDialog into seeds and allotment pages
```

---

### Task 6: Final verification and cleanup

**Step 1: Run all checks**

```bash
npm run type-check
npm run lint
npx vitest run
npx playwright test
```

**Step 2: Clean up the design doc**

Delete `docs/plans/2026-03-09-plant-guide-enhancements-design.md` (temporary working document, this plan supersedes it).

**Step 3: Update current-plan.md**

Add a section to `docs/plans/current-plan.md` documenting the completed work.

**Step 4: Final commit**

```
docs: update plan with plant guide enhancements
```
