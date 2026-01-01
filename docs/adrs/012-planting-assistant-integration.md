# ADR 012: Planting Assistant Integration

## Status
Accepted (2026-01-01)

## Date
2026-01-01

## Context

After implementing year-aware seed tracking (ADR 011), users needed a way to connect their seed library with the planting workflow. The original proposal included an AI-powered suggestion feature, but multi-persona analysis revealed this was over-engineered.

### Multi-Persona Analysis Findings

Four perspectives analyzed the feature proposal:

1. Gardener: AI suggestions are premature when rotation indicators already show guidance. More valuable: "copy last year's plan", succession sowing.

2. Architect: Existing `rotation.ts` (785 lines) already has `getVegetablesForRotationGroup()`. Rule-based suggestions are faster and deterministic. AI adds API complexity for minimal gain.

3. UX: AI requires API key (near-zero adoption). Test variety autocomplete alone before adding complexity.

4. Skeptic: ~30 plantings/year - is this worth building? Aitor chat already answers "what should I plant?" questions.

## Decision

Implemented three lightweight spikes instead of a full AI integration:

### Spike 1: Variety Autocomplete (datalist)

Added HTML `<datalist>` to the variety input in AddPlantingForm. When user selects a vegetable, matching varieties from their seed library appear as autocomplete suggestions.

Uses static `myVarieties` data for simplicity. Native browser autocomplete, no new hooks.

### Spike 2: Enhanced Rotation Indicator

Added specific vegetable suggestions to the existing rotation indicator in the bed sidebar. Uses `getVegetablesForRotationGroup()` to show 3-4 example vegetables for the suggested rotation group.

Example: "2025: Legumes -> 2026: Brassicas. Consider: Cabbage, Broccoli, Brussels Sprouts, Kale"

### Spike 3: Seeds Page Link

When user selects a vegetable with matching varieties, shows a link: "View your 3 pea varieties ->" that opens the Seeds page filtered to that vegetable.

Added URL param handling (`?vegetable=peas`) to Seeds page to auto-expand the relevant group.

## Implementation

### Files Modified

`src/app/allotment/page.tsx`:
- Added `getVegetablesForRotationGroup` import from rotation.ts
- Added `matchingVarieties` computation in AddPlantingForm
- Added `<datalist id="variety-suggestions">` to variety input
- Added conditional Seeds page link with Package icon
- Enhanced rotation indicator with vegetable suggestions

`src/app/seeds/page.tsx`:
- Added `useSearchParams` import and vegetable filter handling
- Added `useEffect` to auto-expand filtered vegetable group

### Lines Changed
~50 lines total across both files

## Consequences

### Positive
- Zero new dependencies or hooks
- Uses existing rotation.ts logic (no AI calls needed)
- Native browser autocomplete (accessibility, performance)
- Validates UX before investing in more complex solutions
- No API key dependency for core planning features

### Negative
- Uses static myVarieties data (doesn't reflect real-time localStorage edits)
- Datalist styling is browser-dependent
- No AI-powered creative suggestions

### Future Considerations
- Could upgrade to useVarieties hook for real-time variety data
- Could add "Copy last year's plan" button (higher value per debate)
- Could add succession sowing reminders
- AI suggestions remain available via Aitor chat
