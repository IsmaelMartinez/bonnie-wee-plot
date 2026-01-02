# Planting Assistant Planning Analysis

## 1. Executive Summary

This document captures the multi-persona analysis and planning process used to design the planting assistant feature (ADR 012). The original proposal for AI-powered planting suggestions was systematically challenged by four personas, leading to a simpler, more focused implementation.

### Key Outcome

The multi-persona debate reduced scope from ~200 lines of new code across 3 files + API changes to ~50 lines of enhancements using existing infrastructure.

### Process Value

This analysis demonstrates the value of structured debate before implementation:
- Avoided over-engineering (AI suggestions redundant with existing features)
- Identified simpler alternatives (datalist, rotation.ts logic)
- Surfaced higher-value features for future consideration

---

## 2. Original Proposal

### Tier 1: Variety Dropdown
Full integration of `useVarieties` hook into AddPlantingForm, replacing freeform text with a dropdown showing varieties from seed library, grouped by year, with "have seeds" indicators.

### Tier 2: AI Planning Button
New `PlanningAssistant` component in bed sidebar, calling a modified AI advisor API with `mode: 'suggest'` to return structured JSON planting recommendations.

### Estimated Scope
- 3 files modified/created
- ~200 lines of new code
- New API contract for structured responses
- New React component

---

## 3. Multi-Persona Debate

### 3.1 Gardener Persona

Evaluated practical gardening value.

**Key Points:**
- Tier 1 (variety suggestions) is genuinely useful - saves checking seed library separately
- Tier 2 (AI suggestions) is premature - rotation indicator already shows guidance
- Missing features matter more: "copy last year's plan", succession sowing reminders, shopping list
- Concern about AI making too many decisions (variety, date, notes) in "one-click add"

**Verdict:** Build Tier 1, defer Tier 2

### 3.2 Architect Persona

Evaluated technical design and complexity.

**Key Points:**
- API `mode` parameter violates single responsibility - changes response format unpredictably
- `rotation.ts` already has 785 lines including `generateBedSuggestionFromData()` and `getVegetablesForRotationGroup()`
- Rule-based suggestions would be faster, cheaper, deterministic
- Adding `useVarieties` hook to allotment page adds complexity; could use static data or props instead
- Simpler alternative: `<datalist>` for autocomplete (~20 lines vs ~100+ lines)

**Verdict:** Use datalist, leverage existing rotation.ts, skip AI API changes

### 3.3 UX Persona

Evaluated user experience and interaction patterns.

**Key Points:**
- Dropdown may add friction vs. freeform for users who know what they want
- AI button requires API key prerequisite - creates dead-end for most users
- Cognitive overload with three input modalities (dropdown, freeform, AI)
- Need graceful fallback for empty seed libraries
- Should test variety autocomplete in isolation before adding AI

**Verdict:** Test lightweight autocomplete first, validate before adding complexity

### 3.4 Skeptic Persona

Challenged whether feature should be built at all.

**Key Points:**
- Usage frequency: ~30 plantings/year - is dropdown worth building?
- Aitor chat already answers "what should I plant in bed A?"
- Rotation logic already suggests vegetables - no AI needed
- Zero users will configure API keys for inline suggestions
- Simpler: just show link "View your pea varieties" when selecting peas

**Verdict:** Implement minimal viable feature, defer AI entirely

---

## 4. Debate Synthesis

### Consensus Points

1. **Tier 2 (AI) should be dropped** - Redundant with existing Aitor chat and rotation logic
2. **Tier 1 should be simplified** - Datalist instead of full dropdown integration
3. **Leverage existing code** - rotation.ts has suggested vegetables, use it
4. **Test incrementally** - Spikes to validate UX before investing more

### Disagreement Points

1. **Whether even Tier 1 is worth it** - Skeptic challenged the 30/year usage, but Gardener valued the convenience
2. **Static vs dynamic variety data** - Architect suggested static for simplicity, but this misses real-time edits

### Resolution

Implement three focused spikes:
1. Datalist autocomplete (static data, minimal code)
2. Enhanced rotation indicator (surface existing data)
3. Seeds page link (connect workflows)

---

## 5. Implementation Outcome

### What Was Built

**Spike 1: Variety Autocomplete**
- Added `<datalist>` to variety input in AddPlantingForm
- ~15 lines, uses static `myVarieties` data
- Native browser autocomplete, no new hooks

**Spike 2: Enhanced Rotation Indicator**
- Added vegetable suggestions to rotation guide
- ~10 lines, uses existing `getVegetablesForRotationGroup()`
- Shows 3-4 example vegetables for suggested rotation group

**Spike 3: Seeds Page Link**
- Added conditional link when vegetable selected with matching varieties
- ~10 lines in allotment page
- ~15 lines for URL param handling in seeds page

### What Was Not Built

- New `PlanningAssistant` component
- New `useVarieties` integration in allotment page
- API `mode: 'suggest'` parameter
- Structured JSON response format
- One-click add from AI suggestions

### Lines of Code

- Original proposal: ~200 lines
- Actual implementation: ~50 lines
- Reduction: 75%

---

## 6. Future Considerations

### Higher-Value Features (from debate)

1. **Copy Last Year's Plan** - Button to clone previous year's plantings to current bed
2. **Succession Sowing Reminders** - "You planted peas here in March, time for next sowing?"
3. **Seed Shopping List** - "Based on 2026 plan vs seeds you have, order these"

### Deferred AI Integration

If AI suggestions are revisited:
- Use slider panel pattern (see: slider-ai-panel-investigation.md)
- Context injection from current page state
- Chat-based interaction rather than button-click suggestions
- Leverage existing Aitor persona and rate limiting

### Potential Upgrades

1. Switch from static `myVarieties` to `useVarieties` hook for real-time data
2. Add "have seeds" indicator to datalist options (requires custom styling)
3. Pre-select variety if only one match exists

---

## 7. Process Lessons

### What Worked

1. **Four distinct personas** - Each brought different concerns that wouldn't surface in single review
2. **Adversarial skeptic** - Forced justification of basic assumptions
3. **Concrete alternatives** - Personas suggested specific simpler solutions
4. **Synthesis phase** - Finding consensus across disagreements

### What Could Improve

1. **Earlier debate** - Could have run before detailed planning
2. **User input** - Personas are simulated; real user feedback would validate
3. **Quantitative data** - Usage metrics would inform skeptic's concerns

### Recommended for Future Features

Run multi-persona debate for:
- Features adding new API endpoints
- Features adding new hooks or state management
- Features with unclear user value
- Features that could be solved multiple ways

Skip debate for:
- Bug fixes
- Clear requirements with obvious implementation
- Performance optimizations
- Refactoring

---

## 8. Appendix: Persona Prompts

### Gardener Prompt
"You are a practical allotment gardener in Scotland. Evaluate whether this feature will actually help gardeners plan their planting."

### Architect Prompt
"You are a senior software architect. Review the technical design for complexity, maintainability, and over-engineering."

### UX Prompt
"You are a UX designer. Evaluate user experience, interaction patterns, and cognitive load."

### Skeptic Prompt
"You are the devil's advocate. Find reasons NOT to build this feature and propose simpler alternatives."

---

## 9. References

- ADR 012: Planting Assistant Integration
- src/lib/rotation.ts - Existing rotation logic
- src/app/ai-advisor/page.tsx - Existing Aitor integration
- docs/research/slider-ai-panel-investigation.md - Future AI panel pattern
