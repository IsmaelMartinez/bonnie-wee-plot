# ADR 021: Planting Detail Dialog

**Date:** 2026-01-26
**Status:** Accepted

## Context

Users need to view and edit planting details (dates, notes, success rating) after initial creation. The existing PlantingCard showed limited info with inline controls that cluttered the UI.

## Decision

Implement a tap-to-open detail dialog using the existing bottom sheet pattern:

1. **Single-page scrollable layout** - All fields visible without tabs (simpler than tabbed approach)
2. **Bottom sheet on mobile** - Uses existing `Dialog` with `variant="bottom-sheet"`
3. **Auto-save on blur** - Changes save immediately when field loses focus
4. **Simplified card** - PlantingCard now shows info only; actions moved to dialog

## Editable Fields

- Sow date, sow method, transplant date
- Actual harvest start/end dates
- Success rating (excellent/good/fair/poor)
- General notes, harvest notes

## Consequences

- **Cleaner card UI** - Removed success dropdown and delete button from PlantingCard
- **Consistent pattern** - Matches existing VarietyEditDialog interaction model
- **Mobile-first** - Bottom sheet provides native-feeling experience on phones
