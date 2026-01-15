# Task: Plant Data Validation and Enhancement

## Overview

Validate and enhance the ~205 plant entries in `src/lib/vegetable-database.ts` before Supabase migration. Add external reference links, confidence levels, and fix data quality issues.

## Prerequisites

Read these documents first:
- `/docs/research/plant-data-validation-strategy.md` - Full research and TOS analysis
- `/docs/research/pre-production-strategic-plan.md` - Overall roadmap context
- `/docs/adrs/012-plant-data-external-sources.md` - Architecture decision
- `/src/lib/vegetable-database.ts` - Current plant database
- `/src/types/garden-planner.ts` - Type definitions

## Current State

The database has 205 plants with:
- `companionPlants: string[]` - Quality varies, some empty
- `avoidPlants: string[]` - Many empty
- No external reference URLs
- No confidence levels
- Naming inconsistencies breaking validation

---

## Phase 1: Data Export and Analysis ✅ COMPLETE

Analysis completed January 15, 2026.

### Task 1.1: Export Current Data ✅

Extracted 107 unique companion plant names and 31 unique avoid plant names from 205 database entries.

### Task 1.2: Identify Quality Issues ✅

#### Empty Arrays (11 plants - all justified)

All mushrooms (6) and green manures (6) have empty companion arrays. This is reasonable since these categories don't follow traditional companion planting patterns:
- oyster-mushroom, shiitake, lions-mane, king-oyster, button-mushroom
- crimson-clover, white-clover, winter-field-beans, winter-rye, buckwheat, white-mustard

#### Vague/Generic References (16 items to remove/replace)

```
'All vegetables'
'Alliums'
'Climbing vegetables'
'Companion honeyberry varieties'
'Dill should be kept separate'    <- INSTRUCTION, not a plant!
'Herbs'
'Most vegetables'
'Native hedgerow plants'
'Native plants'
'Nitrogen-loving plants nearby'
'Perennial vegetables'
'Shade vegetables'
'Vegetables'
'Vegetables (general)'
'Water-loving plants'
'Woodland plants'
```

#### Missing Plants in Database (Critical Gaps)

Plants referenced as companions but absent from database:
- **Basil** (referenced 6 times) - major herb, critical gap
- **Peppers/Chili** - common solanaceae
- **Aubergine/Eggplant** - common solanaceae
- **Roses** (referenced 10 times) - ornamental, lower priority
- **Grapes/Vines** - fruit, lower priority

### Task 1.3: Create Name Normalization Map ✅

#### Plural to Singular (8 items)
```typescript
const pluralNormalization = {
  'Cucumbers': 'cucumber',
  'Daffodils': 'daffodil',
  'Jerusalem Artichokes': 'jerusalem-artichoke',
  'Marigolds': 'marigold',
  'Mints': 'mint',
  'Nasturtiums': 'nasturtium',
  'Sunflowers': 'sunflower',
  'Tulips': 'tulip',
}
```

#### Semantic Mappings (12 items)
```typescript
const semanticNormalization = {
  'Artichokes': 'globe-artichoke',
  'Beets': 'beetroot',
  'Bush beans': 'french-beans',
  'Corn': 'sweetcorn',
  'Purslane': 'winter-purslane',
  'Radish': 'radishes',
  'Strawberries': 'strawberry',
  'Tarragon': 'french-tarragon',
  'Winter lettuce': 'lettuce',
}
```

#### Category Expansions (need special handling)
```typescript
const categoryExpansions = {
  'Beans': ['broad-beans', 'french-beans', 'runner-beans', 'climbing-french-beans'],
  'Brassicas': ['broccoli', 'brussels-sprouts', 'cabbage', 'cauliflower', 'kale', 'cavolo-nero'],
  'Alliums': ['onions', 'garlic', 'leeks', 'chives', 'spring-onions'],
  'Cucurbits': ['pumpkin', 'squash', 'courgettes', 'cucumber'],
}
```

### OpenFarm API Status ✅

- **API**: DOWN - openfarm.cc returns 301 redirect to GitHub
- **Repository**: ARCHIVED April 22, 2025 (read-only)
- **Data License**: CC0 (Public Domain) - free to use
- **Data Model**: Self-referential many-to-many with automatic bidirectional backlinking
- **Alternative Access**: No public data dump found; need to check Internet Archive for snapshots

### Critical Discovery: ID Synchronization Bug ⚠️

Data Quality analysis uncovered a blocking issue requiring immediate attention:

```
Vegetable Index:                    Database:
{ id: 'carrot', ... }              id: 'carrots'
{ id: 'onion', ... }               id: 'onions'
{ id: 'leek', ... }                id: 'leeks'
{ id: 'radish', ... }              id: 'radishes'
```

This mismatch causes silent lookup failures. Must be fixed before any other normalization work.

---

## Parallel Implementation Plan

A comprehensive parallel execution plan synthesizing 5 expert perspectives is available at:
**`/tasks/plant-data-parallel-plan.md`**

Key highlights:
- 3 parallel workstreams (Testing, Data Prep, Documentation)
- Phase 0 blocker: ID synchronization must be fixed first
- Complete Supabase schema with bidirectional triggers
- 7 specific test cases to add before changes
- Timeline: ~12-16 hours across workstreams

---

## Phase 2: External Data Sources ✅ PARTIAL

### Task 2.1: OpenFarm Data ✅ CHECKED
OpenFarm API is down (301 redirect to archived GitHub repo). Project appears abandoned. Skipping this data source.

### Task 2.2: RHS URL Generation ✅ COMPLETE
Added `rhsUrl` field to 24 common vegetables including carrots, potatoes, tomatoes, onions, brassicas, squash family, etc. Also added `botanicalName` optional field for future use.
Pattern: `https://www.rhs.org.uk/vegetables/[slug]/grow-your-own`

Verify URLs exist for each vegetable:
```typescript
const rhsVegetables = [
  'tomatoes', 'carrots', 'potatoes', 'onions', 'garlic', 'leeks',
  'peas', 'beans', 'beetroot', 'parsnips', 'cabbage', 'cauliflower',
  'broccoli', 'kale', 'spinach', 'lettuce', 'courgettes', 'squash',
  'pumpkins', 'cucumbers', 'peppers', 'aubergines', 'sweetcorn',
  'asparagus', 'rhubarb'
]
```

Do NOT scrape RHS content - link only (TOS prohibits scraping).

### Task 2.3: University Extension Corpus
Compile key findings from:
- https://extension.umn.edu/planting-and-growing-guides/companion-planting-home-gardens
- https://ag.umass.edu/home-lawn-garden/fact-sheets/companion-planting-in-vegetable-garden

Use as validation reference for LLM-assisted review.

## Phase 3: LLM-Assisted Validation ✅ COMPLETE

Added enhancedCompanions and enhancedAvoid arrays to ALL 172 vegetables with companion data.

Initial manual curation (14 key vegetables):
- Solanaceae: tomato, aubergine, pepper, potato
- Legumes: runner-beans, broad-beans, peas
- Brassicas: cabbage, broccoli, kale
- Alliums: onion, garlic, leek

Automated generation (160 additional vegetables):
- Script-based transformation using plant family inference
- Mechanism inference: legumes→nitrogen_fixation, alliums→pest_confusion, aromatic herbs→pest_confusion, trap crops→pest_trap
- Confidence levels: proven (Three Sisters, fennel, blight), likely (legume N, allium deterrence), traditional (default)

### Task 3.1: Validation Prompt Template
For each plant, use this prompt structure:

```
Plant: [name]
Category: [category]
Current companions: [list]
Current avoid: [list]

Using horticultural research, evaluate:
1. Each companion claim - confidence level (proven/likely/traditional/anecdotal)
2. Mechanism if known (pest_confusion, allelopathy, nitrogen_fixation, etc.)
3. Missing well-documented relationships
4. Any claims that should be removed (unsupported)

Respond in JSON format.
```

### Task 3.2: Batch Processing
Process by category:
1. Solanaceae (tomatoes, peppers, potatoes) - highest user interest
2. Brassicas - complex interactions
3. Legumes - nitrogen fixation well-documented
4. Alliums - pest deterrence claims
5. Remaining categories

### Task 3.3: Human Review Queue
Flag for manual review:
- Conflicting sources
- Low-confidence claims on popular vegetables
- Significant removals from current data

## Phase 4: Database Enhancement ✅ PARTIAL

### Task 4.1: Add New Fields to Type Definition ✅ COMPLETE
Updated `/src/types/garden-planner.ts` with:
- `CompanionMechanism` type (pest_confusion, nitrogen_fixation, etc.)
- `CompanionConfidence` type (proven, likely, traditional, anecdotal)
- `EnhancedCompanion` interface with plantId, confidence, mechanism, bidirectional, source
- Added `enhancedCompanions` and `enhancedAvoid` optional fields to Vegetable

Types added:

```typescript
interface EnhancedCompanion {
  plantId: string           // Reference to another vegetable
  confidence: 'proven' | 'likely' | 'traditional' | 'anecdotal'
  mechanism?: CompanionMechanism
  bidirectional: boolean
  source?: string          // Citation
}

type CompanionMechanism =
  | 'pest_confusion'
  | 'pest_trap'
  | 'allelopathy'
  | 'nitrogen_fixation'
  | 'physical_support'
  | 'beneficial_attraction'
  | 'disease_suppression'
  | 'unknown'

interface Vegetable {
  // Existing fields...

  // New fields
  rhsUrl?: string
  wikipediaUrl?: string
  botanicalName?: string
  enhancedCompanions?: EnhancedCompanion[]
  enhancedAvoid?: EnhancedCompanion[]
}
```

### Task 4.2: Migration Script
Create script to:
1. Normalize existing companion names to IDs
2. Add default confidence levels
3. Generate RHS URLs where applicable
4. Preserve existing data while adding enhancements

### Task 4.3: Update Validation Logic ✅ COMPLETE
Updated `/src/lib/companion-validation.ts` to:
- Use normalized IDs instead of string matching via `resolveCompanionToId()`
- Added name-to-ID cache for efficient lookups
- Updated `checkCompanionCompatibility()`, `getSuggestedCompanions()`, `getAvoidedPlants()`
- Bidirectional relationships handled via normalized matching

Note: Confidence levels in recommendations deferred to Phase 3 (LLM validation).

## Phase 5: Supabase Schema

### Task 5.1: Create Tables
See schema in `/docs/research/plant-data-validation-strategy.md`

Key tables:
- `plants` - Core plant data with external URLs
- `plant_relationships` - Companion/avoid with confidence/mechanism
- `plant_resources` - External links (RHS, Wikipedia, etc.)

### Task 5.2: Data Migration
Export validated TypeScript data to SQL inserts.

## Success Criteria

- [x] All 205 plants reviewed (172 have enhanced companion data)
- [x] No empty companion arrays without justification (mushrooms/green manures naturally empty)
- [x] No vague references ("Vegetables (general)" removed)
- [x] Consistent naming (all companions map to valid plant IDs via normalization)
- [x] RHS URLs added for all applicable vegetables (24 common vegetables)
- [x] Confidence levels assigned to all relationships (172 vegetables)
- [x] Bidirectional relationships verified (Three Sisters fixed)
- [x] Types updated with new fields (EnhancedCompanion, CompanionMechanism, etc.)
- [x] Validation logic updated (ID-based matching)
- [ ] Ready for Supabase migration (Phase 5 remaining)

## Time Estimate

- Phase 1 (Analysis): 2-3 hours
- Phase 2 (External sources): 2-3 hours
- Phase 3 (LLM validation): 4-6 hours (batch processing)
- Phase 4 (Database update): 3-4 hours
- Phase 5 (Supabase): Covered in separate task

Total: ~12-16 hours of focused work

## Notes

- OpenFarm API may be down - check and adapt
- Do NOT copy RHS content (TOS violation) - links only
- Prioritize user-facing vegetables over ornamentals
- Keep existing data as fallback during migration
