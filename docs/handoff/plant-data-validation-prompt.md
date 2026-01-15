# Agent Handoff: Plant Data Validation

Use this prompt to continue the plant data validation work in a new Claude Code session.

---

## Prompt for New Agent

```
I need you to help validate and enhance the plant database for Community Allotment, a garden planning app. This is a continuation of previous work.

## Context

Read these files first (in order):
1. /docs/research/plant-data-validation-strategy.md - Full research on sources and TOS
2. /docs/adrs/012-plant-data-external-sources.md - Architecture decision
3. /tasks/plant-data-validation.md - Detailed task breakdown

## Current State

- ~205 plants in /src/lib/vegetable-database.ts
- Each has companionPlants[] and avoidPlants[] arrays
- Quality is inconsistent - some empty, some vague ("Vegetables general")
- Need to add RHS links, confidence levels, normalize names

## Key Constraints

IMPORTANT - Terms of Service:
- OpenFarm (CC0) - Can import data freely
- RHS - LINK ONLY, do not scrape or copy content
- PFAF - Link with attribution only
- See Part 9 of plant-data-validation-strategy.md for full TOS analysis

## Your Task

Start with Phase 1 from /tasks/plant-data-validation.md:
1. Export and analyze current companion data
2. Identify all quality issues (empty arrays, vague refs, naming variants)
3. Create name normalization map
4. Check if OpenFarm API is working (curl test)

Use ultrathink to plan your approach before starting.

## Expected Output

- Analysis report of current data quality
- List of plants needing attention by category
- Name normalization mapping
- Status of OpenFarm API availability
- Recommendations for Phase 2

Do NOT start modifying the database yet - this is analysis only for Phase 1.
```

---

## Alternative: Full Implementation Prompt

If you want to do more than just Phase 1:

```
Continue the plant data validation work for Community Allotment.

Read these files:
- /docs/research/plant-data-validation-strategy.md
- /docs/adrs/012-plant-data-external-sources.md
- /tasks/plant-data-validation.md

Your goal: Complete Phases 1-4 of the task plan.

Key requirements:
- OpenFarm data is CC0 (can use freely)
- RHS links only (no scraping - TOS prohibits)
- Add confidence levels to companion relationships
- Normalize plant names for consistent matching
- Update types in /src/types/garden-planner.ts

Start by analyzing current data, then systematically enhance each category starting with solanaceae (tomatoes, peppers, etc).

Use Ralph Loop if you need iterative refinement cycles.
```

---

## Files Created in This Session

| File | Purpose |
|------|---------|
| `/docs/research/pre-production-strategic-plan.md` | Overall roadmap (security, PWA, a11y, etc) |
| `/docs/research/plant-data-validation-strategy.md` | Full research on plant data sources and TOS |
| `/docs/adrs/012-plant-data-external-sources.md` | ADR for external data sources |
| `/tasks/plant-data-validation.md` | Detailed task breakdown for plant validation |

## Key Findings

1. **OpenFarm** is best for data import (CC0 license) but API may be down (redirects to GitHub)
2. **RHS** provides authoritative UK info but TOS prohibits scraping - link only
3. **OpenFarm data model** has `companions` field with bidirectional relationships
4. **Current issues**: ~50+ plants have empty companion arrays, naming inconsistent
5. **RHS URL pattern**: `https://www.rhs.org.uk/vegetables/[slug]/grow-your-own`

## Related Work

This is part of the larger pre-production plan. Other parallel tracks:
- Security hardening (Phase 1)
- PWA/offline support (Phase 3)
- Accessibility fixes (Phase 4)
- Supabase migration (Phase 7)

See `/docs/research/pre-production-strategic-plan.md` for full roadmap.
