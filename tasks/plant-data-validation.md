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

The database has ~205 plants with:
- `companionPlants: string[]` - Quality varies, some empty
- `avoidPlants: string[]` - Many empty
- No external reference URLs
- No confidence levels
- Naming inconsistencies breaking validation

## Phase 1: Data Export and Analysis

### Task 1.1: Export Current Data
```bash
# Create analysis script to extract companion data
node -e "
const { vegetables } = require('./src/lib/vegetable-database.ts');
const analysis = vegetables.map(v => ({
  id: v.id,
  name: v.name,
  category: v.category,
  companionCount: v.companionPlants.length,
  avoidCount: v.avoidPlants.length,
  hasVagueCompanion: v.companionPlants.some(c =>
    c.includes('general') || c.includes('Most') || c.includes('All')
  )
}));
console.log(JSON.stringify(analysis, null, 2));
"
```

### Task 1.2: Identify Quality Issues
Flag entries with:
- [ ] Empty companionPlants arrays
- [ ] Empty avoidPlants arrays
- [ ] Vague references ("Vegetables (general)", "Most vegetables")
- [ ] Inconsistent naming (find all unique companion names, identify variants)

### Task 1.3: Create Name Normalization Map
Map variants to canonical IDs:
```typescript
const nameNormalization = {
  'Bush beans': 'beans',
  'Pole beans': 'beans',
  'French beans': 'french-beans',
  'Runner beans': 'runner-beans',
  'Brassicas': ['cabbage', 'kale', 'broccoli', 'cauliflower', ...],
  // etc.
}
```

## Phase 2: External Data Sources

### Task 2.1: OpenFarm Data
OpenFarm (CC0 license) has companion data but API may be down.

Check if API works:
```bash
curl -s "https://openfarm.cc/api/v1/crops?filter=tomato" | head -100
```

If API unavailable, use GitHub data:
- Repo: https://github.com/openfarmcc/OpenFarm
- Data model has `companions` field (self-referential many-to-many)
- May need to scrape/export from MongoDB dumps

### Task 2.2: RHS URL Generation
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

## Phase 3: LLM-Assisted Validation

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

## Phase 4: Database Enhancement

### Task 4.1: Add New Fields to Type Definition
Update `/src/types/garden-planner.ts`:

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

### Task 4.3: Update Validation Logic
Update `/src/lib/companion-validation.ts` to:
- Use normalized IDs instead of string matching
- Consider confidence levels in recommendations
- Handle bidirectional relationships properly

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

- [ ] All 205 plants reviewed
- [ ] No empty companion arrays without justification (mark as "neutral")
- [ ] No vague references ("Vegetables (general)" removed)
- [ ] Consistent naming (all companions map to valid plant IDs)
- [ ] RHS URLs added for all applicable vegetables
- [ ] Confidence levels assigned to all relationships
- [ ] Bidirectional relationships verified
- [ ] Types updated with new fields
- [ ] Validation logic updated
- [ ] Ready for Supabase migration

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
