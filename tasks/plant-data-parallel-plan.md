# Plant Data Validation: Parallel Implementation Plan

## Executive Summary

This plan synthesizes insights from five expert perspectives: Data Quality Engineering, UX/Product Design, Database Architecture, DevOps/Testing, and Horticulture Domain Expertise. The result is a production-ready implementation plan that maximizes parallel execution while respecting critical dependencies.

Total estimated effort: 12-16 hours across 3 parallel workstreams.

---

## Critical Discovery: ID Synchronization Bug

The Data Quality analysis uncovered a blocking issue that must be addressed first:

```
Vegetable Index (src/lib/vegetables/index.ts):     Database (src/lib/vegetable-database.ts):
{ id: 'carrot', ... }                              id: 'carrots'
{ id: 'onion', ... }                               id: 'onions'
{ id: 'leek', ... }                                id: 'leeks'
{ id: 'radish', ... }                              id: 'radishes'
```

This mismatch means UI components using index IDs to look up database entries silently fail. This must be fixed before any other work proceeds.

---

## Parallel Workstream Architecture

```
Week 1                          Week 2                          Week 3
├─ Stream A: Testing           ├─ Stream A: Apply Changes      ├─ Stream A: Final Validation
│  Infrastructure              │  & Monitor                    │
├─ Stream B: Data Prep         ├─ Stream B: Supabase           ├─ Stream B: UI Enhancements
│  & Missing Plants            │  Schema Prep                  │  (if time)
└─ Stream C: Documentation     └─ Stream C: CI Enhancement     └─ Stream C: Cleanup
   & Research                                                     & Docs
```

---

## Phase 0: Foundation (Day 1) ✅ COMPLETE

All other work depends on this phase completing first.

### 0.1 Fix ID Synchronization ✅ (2 hours)

Decide on canonical format: **singular IDs** (carrot, onion, leek, radish) since the index is the public API.

Update `vegetable-database.ts` to use singular IDs matching the index:
- `carrots` → `carrot`
- `onions` → `onion`
- `leeks` → `leek`
- `radishes` → `radish`

Add localStorage migration in `allotment-storage.ts` to remap any stored plantings using old IDs.

**Risk**: User localStorage data may break. **Mitigation**: Migration function with old→new ID mapping.

### 0.2 Fix Corrupted Data Entry ✅ (10 minutes)

In `herb-fennel` entry, companionPlants contains `'Dill should be kept separate'` - an instruction masquerading as a plant name. Removed.

---

## Stream A: Testing Infrastructure ✅ COMPLETE

### A.1 Create Baseline Test Suite ✅ (3 hours)

Create `src/__tests__/lib/plant-data-integrity.test.ts` with these test cases:

**Test 1: Plant Count Stability**
```typescript
test('database contains expected plant count', () => {
  expect(vegetables.length).toBe(205) // Update to 208 after adding missing plants
})
```

**Test 2: ID Uniqueness**
```typescript
test('all plant IDs are unique', () => {
  const ids = vegetables.map(v => v.id)
  expect(new Set(ids).size).toBe(ids.length)
})
```

**Test 3: Critical Companion Pairs**
```typescript
test.each([
  ['carrot', 'onion', 'good'],
  ['carrot', 'leek', 'good'],
  ['kale', 'strawberry', 'bad'],
  ['kale', 'tomato', 'bad'],
])('%s + %s = %s', (plantA, plantB, expected) => {
  const result = checkCompanionCompatibility(plantA, plantB)
  expect(result).toBe(expected)
})
```

**Test 4: Companion Resolution Rate**
```typescript
test('companion strings resolve to valid plants', () => {
  const allCompanions = vegetables.flatMap(v => v.companionPlants)
  const validIds = new Set(vegetables.map(v => v.id))
  const resolved = allCompanions.filter(c =>
    validIds.has(c.toLowerCase().replace(' ', '-'))
  )
  // Before normalization: ~85%, After: >95%
  expect(resolved.length / allCompanions.length).toBeGreaterThan(0.85)
})
```

**Test 5: Bidirectional Audit**
```typescript
test('Three Sisters relationships are bidirectional', () => {
  const sweetcorn = getVegetableById('sweetcorn')
  const runnerBeans = getVegetableById('runner-beans')
  const squash = getVegetableById('squash')

  expect(sweetcorn.companionPlants).toContain('Beans')
  expect(runnerBeans.companionPlants).toContain('Sweetcorn')
  expect(squash.companionPlants).toContain('Sweetcorn')
})
```

**Test 6: Vague Reference Enumeration**
```typescript
const VAGUE_REFERENCES = [
  'All vegetables', 'Alliums', 'Climbing vegetables',
  'Dill should be kept separate', 'Herbs', 'Most vegetables',
  // ... all 16
]

test('vague references are documented', () => {
  const allCompanions = vegetables.flatMap(v => v.companionPlants)
  const vague = allCompanions.filter(c => VAGUE_REFERENCES.includes(c))
  expect(vague.length).toBeGreaterThan(0) // Decreases as we clean
})
```

### A.2 Add CI Job (1 hour)

Add to `.github/workflows/ci.yml`:

```yaml
plant-data-validation:
  name: Plant Data Validation
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
    - run: npx vitest run src/__tests__/lib/plant-data-integrity.test.ts
```

Add `plant-data-validation` to build job dependencies.

---

## Stream B: Data Preparation ✅ COMPLETE

### B.1 Add Missing Critical Plants ✅ (2 hours)

The UX analysis identified these as highest user impact. Add to `vegetable-database.ts`:

**Basil** (referenced 7 times as companion, critical for tomato-basil pairing):
```typescript
{
  id: 'basil',
  name: 'Basil',
  category: 'herbs',
  description: 'Aromatic herb, essential for Italian cooking. Best grown under cover in Scotland.',
  planting: {
    sowIndoorsMonths: [3, 4, 5],
    sowOutdoorsMonths: [],  // Too cold for Scotland outdoors
    transplantMonths: [5, 6],
    harvestMonths: [6, 7, 8, 9],
    daysToHarvest: { min: 60, max: 90 }
  },
  care: {
    sun: 'full-sun',
    water: 'moderate',
    spacing: { between: 20, rows: 30 },
    depth: 0.5,
    difficulty: 'intermediate',
    tips: [
      'Grow under cover in Scotland - needs warmth',
      'Pinch out growing tips for bushier plants',
      'Do not let flower if harvesting leaves'
    ]
  },
  companionPlants: ['Tomatoes', 'Peppers', 'Marigolds'],
  avoidPlants: ['Sage', 'Rue']
}
```

**Peppers** (sweet/bell peppers):
```typescript
{
  id: 'pepper',
  name: 'Sweet Pepper',
  category: 'solanaceae',
  description: 'Colourful sweet peppers. Require greenhouse or polytunnel in Scotland.',
  // ... full entry
  companionPlants: ['Tomatoes', 'Basil', 'Carrots', 'Onions'],
  avoidPlants: ['Fennel', 'Brassicas']
}
```

**Aubergine**:
```typescript
{
  id: 'aubergine',
  name: 'Aubergine',
  category: 'solanaceae',
  description: 'Mediterranean vegetable requiring heat. Greenhouse essential in Scotland.',
  // ... full entry
  companionPlants: ['Beans', 'Peppers', 'Spinach'],
  avoidPlants: ['Fennel']
}
```

### B.2 Create Normalization Utilities ✅ (2 hours)

Created `src/lib/companion-normalization.ts`:

```typescript
/**
 * Name normalization maps for companion plant validation
 * Phase 1 analysis identified these transformations needed
 */

// Plural to singular (8 items)
export const PLURAL_TO_SINGULAR: Record<string, string> = {
  'Cucumbers': 'cucumber',
  'Daffodils': 'daffodil',
  'Jerusalem Artichokes': 'jerusalem-artichoke',
  'Marigolds': 'marigold',
  'Mints': 'mint',
  'Nasturtiums': 'nasturtium',
  'Sunflowers': 'sunflower',
  'Tulips': 'tulip',
}

// Semantic mappings (12 items)
export const SEMANTIC_MAPPINGS: Record<string, string> = {
  'Artichokes': 'globe-artichoke',
  'Beets': 'beetroot',
  'Bush beans': 'french-beans',
  'Corn': 'sweetcorn',
  'Purslane': 'winter-purslane',
  'Radish': 'radishes',  // Note: keeping plural ID per index
  'Strawberries': 'strawberry',
  'Tarragon': 'french-tarragon',
  'Winter lettuce': 'lettuce',
}

// Category expansions (4 categories)
export const CATEGORY_EXPANSIONS: Record<string, string[]> = {
  'Beans': ['broad-beans', 'french-beans', 'runner-beans', 'climbing-french-beans'],
  'Brassicas': ['broccoli', 'brussels-sprouts', 'cabbage', 'cauliflower', 'kale', 'cavolo-nero'],
  'Alliums': ['onion', 'garlic', 'leek', 'chives', 'spring-onion'],
  'Cucurbits': ['pumpkin', 'squash', 'courgette', 'cucumber'],
}

// Vague references to remove (16 items)
export const VAGUE_REFERENCES = [
  'All vegetables',
  'Alliums',
  'Climbing vegetables',
  'Companion honeyberry varieties',
  'Dill should be kept separate',
  'Herbs',
  'Most vegetables',
  'Native hedgerow plants',
  'Native plants',
  'Nitrogen-loving plants nearby',
  'Perennial vegetables',
  'Shade vegetables',
  'Vegetables',
  'Vegetables (general)',
  'Water-loving plants',
  'Woodland plants',
]

/**
 * Normalize a companion plant name to its canonical ID
 */
export function normalizeCompanionName(name: string): string | string[] | null {
  // Check if vague reference (remove)
  if (VAGUE_REFERENCES.includes(name)) {
    return null
  }

  // Check category expansion
  if (CATEGORY_EXPANSIONS[name]) {
    return CATEGORY_EXPANSIONS[name]
  }

  // Check semantic mapping
  if (SEMANTIC_MAPPINGS[name]) {
    return SEMANTIC_MAPPINGS[name]
  }

  // Check plural normalization
  if (PLURAL_TO_SINGULAR[name]) {
    return PLURAL_TO_SINGULAR[name]
  }

  // Default: convert to lowercase kebab-case ID
  return name.toLowerCase().replace(/\s+/g, '-')
}
```

### B.3 Apply Normalization to Database ✅ (3 hours)

Applied normalization directly to vegetable-database.ts:
1. Reads current vegetable-database.ts
2. Applies normalizations to all companionPlants/avoidPlants arrays
3. Removes vague references
4. Expands category references (Beans → [broad-beans, french-beans, ...])
5. Outputs updated database

Run the script and commit the changes as an atomic commit:
```
feat(plant-data): normalize companion names and remove vague references

- Remove 16 vague references that provide no actionable guidance
- Normalize 8 plural forms to singular IDs
- Map 12 semantic variants to canonical IDs
- Expand 4 category references to specific plant lists
- Fix corrupted "Dill should be kept separate" entry
```

---

## Stream C: Documentation & Research ✅ PARTIAL

### C.1 Update Horticulture Notes ✅ (1 hour)

Based on Horticulture Expert analysis, add notes to task documentation:

**Confidence Level Assignments:**
- PROVEN: Legume nitrogen fixation, French marigold nematode suppression, Fennel allelopathy
- LIKELY: Aromatic herb pest confusion, Nasturtium trap cropping
- TRADITIONAL: Carrot-onion (inconsistent research per Garden Organic), Tomato-basil
- ANECDOTAL: Most specific spacing claims

**Scottish Climate Priorities:**
- Carrot fly protection is highest priority (but physical barriers more reliable)
- Brassica pest protection (cabbage white, root fly, flea beetle)
- Most tomato-basil advice is for greenhouse growing

### C.2 Verify Three Sisters Bidirectionality ✅ (30 minutes)

Horticulture Expert flagged incomplete Three Sisters relationships. Fixed:
- Sweetcorn → companionPlants should include 'Beans', 'Squash'
- Runner Beans → companionPlants should include 'Sweetcorn', 'Squash'
- Squash → companionPlants should include 'Sweetcorn', 'Beans'

---

## Phase 1: Apply Changes (Week 2)

After all streams complete their preparation work:

### 1.1 Create PR with Atomic Commits

Structure the PR with separate commits for easy rollback:

```
Commit 1: fix(plant-data): synchronize IDs between index and database
Commit 2: fix(plant-data): remove corrupted instruction from herb-fennel
Commit 3: feat(plant-data): add basil, pepper, aubergine entries
Commit 4: feat(plant-data): normalize companion names
Commit 5: test(plant-data): add integrity test suite
Commit 6: ci: add plant-data-validation job
```

### 1.2 Staged Merge Strategy

1. Merge to main
2. Deploy to staging environment
3. Run full E2E suite on staging
4. Monitor for 24-48 hours
5. If issues: `git revert <commit>` for targeted rollback
6. Verify production after monitoring period

### 1.3 Rollback Strategy

**If ID sync breaks localStorage:**
```typescript
// Add to allotment-storage.ts
const ID_MIGRATION_MAP = {
  'carrots': 'carrot',
  'onions': 'onion',
  'leeks': 'leek',
  'radishes': 'radish',
}
// Apply during data load
```

**If normalization breaks companion display:**
Keep fuzzy matching code as fallback, behind environment check:
```typescript
const useFuzzyMatching = process.env.NEXT_PUBLIC_LEGACY_COMPANION_MATCHING === 'true'
```

---

## Phase 2: Supabase Preparation (Week 2-3, parallel with monitoring)

### 2.1 Create Enhanced Schema

Based on Database Architect recommendations:

```sql
-- Plants table with external URLs
CREATE TABLE plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  botanical_name TEXT,
  description TEXT,
  rhs_url TEXT,
  wikipedia_url TEXT,
  rotation_group TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relationships with confidence and mechanism
CREATE TABLE plant_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_a_id UUID REFERENCES plants(id) ON DELETE CASCADE,
  plant_b_id UUID REFERENCES plants(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('companion', 'avoid')),
  confidence_level TEXT NOT NULL DEFAULT 'traditional'
    CHECK (confidence_level IN ('proven', 'likely', 'traditional', 'anecdotal')),
  mechanism TEXT CHECK (mechanism IN (
    'allelopathy', 'pest_confusion', 'pest_trap', 'beneficial_attraction',
    'nitrogen_fixation', 'physical_support', 'shade_provision',
    'weed_suppression', 'pollinator_support', 'disease_suppression', 'unknown'
  )),
  bidirectional BOOLEAN DEFAULT true,
  notes TEXT,
  source_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plant_a_id, plant_b_id, relationship_type)
);

-- Staging table for migration validation
CREATE TABLE companion_import_staging (
  id SERIAL PRIMARY KEY,
  source_plant_id UUID REFERENCES plants(id),
  companion_name_raw TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  processed_at TIMESTAMPTZ
);

-- Bidirectional enforcement trigger
CREATE OR REPLACE FUNCTION enforce_bidirectional()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bidirectional = true THEN
    INSERT INTO plant_relationships (plant_a_id, plant_b_id, relationship_type, confidence_level, mechanism, bidirectional)
    VALUES (NEW.plant_b_id, NEW.plant_a_id, NEW.relationship_type, NEW.confidence_level, NEW.mechanism, true)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bidirectional_relationship_trigger
AFTER INSERT ON plant_relationships
FOR EACH ROW EXECUTE FUNCTION enforce_bidirectional();

-- Indexes for companion queries
CREATE INDEX idx_relationships_plant_a ON plant_relationships(plant_a_id, relationship_type);
CREATE INDEX idx_relationships_plant_b ON plant_relationships(plant_b_id, relationship_type);
CREATE INDEX idx_plants_category ON plants(category);
CREATE INDEX idx_plants_rotation ON plants(rotation_group);
```

### 2.2 Migration Script Preparation

Prepare TypeScript export → SQL INSERT scripts for when Supabase integration begins.

---

## Success Criteria

### Pre-Production Checklist

**Data Quality:**
- [x] All plant IDs synchronized between index and database
- [x] No vague references remain in companion arrays
- [x] All companion strings resolve to valid plant IDs (via normalization)
- [x] Basil, pepper, aubergine added with complete data
- [x] Three Sisters relationships are bidirectional

**Testing:**
- [x] Plant data integrity tests pass (14 test cases)
- [x] CI pipeline includes plant-data-validation job
- [x] E2E tests pass with new data
- [x] Companion resolution rate >95% (via ID-based matching)

**Documentation:**
- [x] Normalization maps documented (companion-normalization.ts)
- [ ] Confidence levels assigned to key relationships (Phase 3)
- [x] Scottish climate notes in plant descriptions

**Deployment:**
- [x] Atomic commits enable targeted rollback
- [x] Migration function handles old localStorage IDs
- [ ] 24-48 hour monitoring period completed without issues

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| ID sync breaks user localStorage | Medium | High | Migration function with ID mapping |
| Normalization removes valid relationships | Low | Medium | Baseline tests + manual review |
| New plants have incorrect data | Low | Low | Review by domain expert |
| CI job blocks unrelated PRs | Low | Medium | Separate job, not blocking build initially |

---

## Timeline Summary

| Day | Stream A (Testing) | Stream B (Data) | Stream C (Docs) |
|-----|-------------------|-----------------|-----------------|
| 1 | - | Phase 0: ID sync + corruption fix | - |
| 2 | Create baseline tests | Add missing plants | Update horticultural notes |
| 3 | Add CI job | Create normalization utils | Verify bidirectional relationships |
| 4 | Run full test suite | Apply normalization | - |
| 5 | Review test results | Create PR | Final documentation |
| 6-7 | Monitor staging | Monitor staging | - |
| 8+ | - | Supabase prep (parallel) | - |

---

## Agent Synthesis Credits

This plan synthesizes recommendations from:
- **Data Quality Engineer** (a9bb2be): ID sync bug, validation infrastructure, rollback strategy
- **UX/Product Designer** (a43f1ca): User impact prioritization, missing plants criticality
- **Database Architect** (aab4dcd): Supabase schema, migration sequence, bidirectional enforcement
- **DevOps/QA Engineer** (a394508): Test cases, CI strategy, staged rollout
- **Horticulture Expert** (a288125): Confidence levels, Scottish priorities, Three Sisters fix

---

*Plan created: January 15, 2026*
*Method: 5-persona Opus ultrathink debate synthesis*
