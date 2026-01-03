# Personal Allotment Assistant Redesign

This document captures the multi-persona analysis and debate for transitioning from "Community Allotment" to a "Personal Allotment Assistant" with deep knowledge of crop rotation, composting, tree pruning, no-dig, and back-to-eden methodologies.

Core principle: Make it simple (sophisticated complexity under effortless interface).

---

## Persona Synthesis

Five perspectives analyzed the codebase: Designer, Product Manager, UX Specialist, Frontend Developer, and Architect. Their analyses converged on several themes while diverging on implementation priorities.

### Points of Agreement

All personas identified the same core issues: the AI advisor (Aitor) is isolated rather than integrated, the homepage is static marketing rather than actionable dashboard, static guide pages duplicate embedded functionality, and the data model needs extension for new methodologies.

### Points of Tension

The debate surfaced three key tensions:

**AI Strategy**: PM suggests removing Aitor CTAs if keeping it gated; UX wants free tier to prove value; Designer wants ambient integration. The question: invest in making Aitor central, or deprioritize it?

**Feature Scope**: PM advocates killing three guide pages immediately; Architect wants to add composting, soil health, and event logging. The question: simplify first, or expand to new domains?

**Technical Debt vs New Features**: Frontend Dev identified ~150 lines of duplicate hook code and type system cruft; Architect wants new data structures. The question: clean up or build forward?

---

## Debate Rounds

### Round 1: The Core Experience

The personas converge on a single insight: the app surfaces data, but should surface guidance. The user doesn't want to see all their beds; they want to know what to do today.

**Decision**: Replace the marketing homepage with a contextual "Today" dashboard. The app already computes seasonal phases, problem beds, and maintenance tasks. Surface them at the entry point.

**Designer**: "Show only what matters today. Weather app, not spreadsheet."
**PM**: "This kills the need for separate This Month page. Consolidate."
**UX**: "Returning users should never ask 'where was I?' First-timers should never ask 'where do I start?'"

### Round 2: The AI Question

Aitor is the most divisive feature. It requires BYO API key (friction), lives on a separate page (isolation), but has the deepest potential for the "wise gardening mentor" vision.

**Decision**: Keep Aitor, but make it ambient rather than destination. Surface AI-generated suggestions inline where decisions happen: bed selection, planting, rotation. Don't require the full chat interface for common questions.

**Architect**: "The context injection pattern already works. Extend it to more touchpoints."
**UX**: "QuickTopics should be dynamic based on actual allotment state, not generic."
**PM**: "Consider a limited free tier via proxy. Three queries per session proves value, then ask for key."

### Round 3: Methodology Extension

The pivot introduces new domains: composting, pruning, no-dig, back-to-eden. How do we add these without bloat?

**Decision**: Don't add new pages. Extend the data model and surface methodology in context. Composting guidance appears when preparing beds. Pruning reminders appear in the Today dashboard. No-dig tips surface when creating beds.

**Architect**: "Add bed soil-method field. Add compost pile tracking. Add event log for maintenance. Let the Today dashboard pull from all sources."
**PM**: "Kill the static Composting, Companion Planting, and Crop Rotation guide pages. Embed the knowledge contextually."
**Designer**: "Progressive disclosure. Show no-dig tips only to users who've marked beds as no-dig."

---

## Final Recommendations

### Priority 1: Contextual Dashboard (Week 1-2)

Replace the marketing homepage with a Today view. Display: current seasonal phase, beds needing attention, upcoming maintenance tasks, one AI-suggested action. The Year selector and full allotment grid move to /allotment.

Implementation: The data exists (getTasksForMonth, getProblemBeds, SEASONAL_PHASES). Build a new page.tsx that synthesizes these into a focused view.

### Priority 2: Ambient AI Integration (Week 2-3)

Remove Aitor as a destination page. Instead, add contextual AI prompts:
- Empty bed selected: "What should I plant here?" button that opens inline chat
- Rotation conflict: "Why is this a problem?" link that gets AI explanation
- Today dashboard: One AI-generated insight based on allotment state

Keep full chat interface accessible from nav, but make inline answers the primary path.

### Priority 3: Data Model Extension (Week 3-4)

Add to AllotmentData:
- `beds[].soilMethod`: 'traditional' | 'no-dig' | 'back-to-eden'
- `composting`: { piles: CompostPile[], inputs: CompostInput[] }
- `gardenEvents`: unified event log for pruning, feeding, amendments

Merge variety storage into unified model. This enables the Today dashboard to show composting tasks, pruning reminders, and planting suggestions from one data source.

### Priority 4: Kill Static Guides (Week 4)

Remove /composting, /companion-planting, /crop-rotation pages. The knowledge they contain should surface contextually:
- Rotation guidance: already appears in PlantSelectionDialog
- Companion warnings: already appear when adding plants
- Composting tips: surface in bed preparation flow

This reduces navigation complexity from 9 routes to 6: Home (Today), Allotment, Seeds, History, AI Chat, About.

### Priority 5: Technical Cleanup (Ongoing)

- Extract usePersistedStorage<T> hook from useAllotment/useVarieties
- Consolidate type system (deprecate garden-planner.ts legacy types)
- Refactor PlantSelectionDialog to use shared Dialog component
- Move to feature-folder structure for new domains

---

## Decision Summary

| Question | Decision |
|----------|----------|
| Homepage purpose | Contextual "Today" dashboard, not marketing |
| AI advisor approach | Ambient integration, not destination page |
| New methodology support | Data model extension, not new pages |
| Static guides | Kill and embed contextually |
| Technical debt | Address incrementally during feature work |

---

## Success Metrics

The redesign succeeds if:
- New users complete first planting within 5 minutes
- Returning users see relevant action on first screen
- Zero clicks required to answer "what should I do today?"
- AI provides value without BYO key (limited free tier)
- Composting/pruning/no-dig knowledge surfaces without dedicated pages

---

## What We're Not Doing

- Multi-device sync (localStorage-only architecture stays)
- Mobile app (responsive web is sufficient)
- User accounts (personal assistant, not SaaS)
- Premium tiers (BYO key model stays, but with free limited tier)
- Weather API integration (out of scope)

---

## Architecture Vision

```
┌─────────────────────────────────────────────────────┐
│                   Today Dashboard                    │
│  ┌─────────────┐ ┌─────────────┐ ┌───────────────┐  │
│  │ Season Info │ │ Beds Status │ │ AI Suggestion │  │
│  └─────────────┘ └─────────────┘ └───────────────┘  │
│  ┌─────────────────────────────────────────────────┐│
│  │              Today's Tasks                       ││
│  │ • Prune apple tree (Back to Eden bed)           ││
│  │ • Turn compost pile #1 (5 days since last)      ││
│  │ • Plant brassicas in Bed B (rotation suggests)  ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│              Unified Data Model                      │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌───────┐ │
│  │ Allotment│ │ Composting│ │ Events Log│ │ Seeds │ │
│  │  + Beds  │ │  + Piles  │ │ + Pruning │ │ Inv.  │ │
│  │  + Soil  │ │  + Inputs │ │ + Feeding │ │       │ │
│  └──────────┘ └──────────┘ └───────────┘ └───────┘ │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│              AI Context Layer                        │
│  Injects allotment state, compost status,           │
│  maintenance history into prompts for               │
│  personalized, contextual advice                    │
└─────────────────────────────────────────────────────┘
```

This architecture makes sophisticated gardening knowledge feel effortless: the complexity lives in the data model and AI context layer; the user sees only what they need, when they need it.
