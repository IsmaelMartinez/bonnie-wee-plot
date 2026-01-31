# Product Roadmap - Quick Reference

**File:** `docs/research/product-roadmap.md`
**Status:** Ready for Review
**Last Updated:** January 2026

---

## TL;DR - The Strategy

### The Problem
Current app shows ALL features (Today, This Month, Seeds, Compost, AI Advisor, Allotment) to new users → overwhelming, high abandonment.

### The Solution
**Progressive Feature Disclosure:**
- Start with 3 core features (Today, This Month, Seeds)
- Hide AI Advisor, Compost, and Allotment Layout initially
- Unlock features as users demonstrate engagement

### How Features Unlock

| Feature | Unlock Condition | Why |
|---------|-----------------|-----|
| **AI Advisor** | 3 visits OR click CTA | Users have context, ready for advanced help |
| **Compost Tracker** | 5 visits OR request | Additional value for engaged users |
| **Layout Planner** | 5 plantings OR request | Users have data to populate beds with |

---

## The 4 Phases

### Phase 1: Simplified Launch (3-4 weeks)
**Ship:** Feature gating system, simplified nav (3 items), onboarding, unlock celebrations
**Hide:** AI Advisor, Compost, Allotment Layout
**Goal:** 500 users, 50% retention, 30% unlock AI, 20% unlock Compost

### Phase 2: Feature Discovery (5-6 weeks)
**Ship:** Enhanced unlocks, notifications, feature tours, sharing
**Goal:** 60% of users unlock features, 40% return 4+ times

### Phase 3: Power Users (7-9 weeks)
**Ship:** Auth (Clerk), cloud sync (Supabase), advanced planner, weather API
**Goal:** 20% create accounts, 10% use sync

### Phase 4: Community & Scale (3-4 months)
**Ship:** Social features, mobile app, localization
**Goal:** 1,000+ MAU, network effects

---

## Implementation Priority

### Pre-Development (3-5 days)
- [ ] User interviews: Validate 3-feature approach
- [ ] Design: Unlock celebrations, progress indicators
- [ ] Refine: Finalize unlock criteria

### Phase 1 Build (15-20 working days)

**Week 1: Core Gating (5-6 days)**
1. Feature flag system (2-3 days) ← **START HERE**
2. Simplified navigation to 3 items (1 day)
3. Hide Compost/AI/Allotment routes (1 day)
4. Basic unlock logic (1-2 days)

**Week 2: Onboarding & Discovery (5-6 days)**
5. Onboarding flow (2-3 days)
6. Unlock celebration modals (1-2 days)
7. Progress indicators & CTAs (2 days)

**Week 3: Polish Core Features (5-6 days)**
8. Today dashboard empty states (2 days)
9. This Month personalization (2 days)
10. Seeds page polish (1-2 days)

**Week 4: Testing & Launch Prep (3-4 days)**
11. E2E testing unlock flows (1-2 days)
12. Analytics integration (1 day)
13. Bug fixes & refinement (1-2 days)

**Total:** 18-22 days (3.5-4.5 weeks calendar time)

---

## Key Metrics to Track

**Acquisition:**
- Unique visitors
- Onboarding completion rate (target: 70%)

**Activation:**
- Plantings added (target: 3+ per user)
- Seeds tracked (target: 15%)

**Engagement:**
- AI unlock rate (target: 30%)
- Compost unlock rate (target: 20%)
- Layout unlock rate (target: 15%)
- Return visits (target: 50% within 7 days)

**Retention:**
- 7-day retention (target: 50%)
- 30-day retention (target: 30%)

---

## What Changed from Original Plan

| Original | New Approach | Why |
|----------|-------------|-----|
| Show all 6 nav items | Show 3 core items | Reduce overwhelm by 50% |
| Compost in main nav | Hide until 5 visits | Uncertain value, validate demand |
| Allotment in main nav | Hide until unlocked | Too complex for beginners |
| AI Advisor visible | Hide until 3 visits | API key friction, needs context |
| Linear onboarding | Progressive disclosure | Earn features naturally |
| Generic metrics | Unlock rate metrics | Measure engagement depth |

---

## Risks & Mitigations

**Risk:** Users never unlock features
**Mitigation:** Low thresholds (3 visits, 5 plantings), prominent CTAs, progress bars

**Risk:** Users frustrated by "hidden" features
**Mitigation:** Clear teasers, value props, "coming soon" indicators

**Risk:** Too simple, not enough value
**Mitigation:** Phase 1 still has personalization, calendar, tracking

---

## Next Decision Points

1. **After user interviews (Week of Jan 20):**
   - Validate gating strategy
   - Adjust unlock criteria if needed
   - Finalize Phase 1 scope

2. **After Phase 1 launch (Feb 2026):**
   - Analyze unlock rates
   - A/B test criteria (3 vs 5 visits?)
   - Iterate based on data

3. **End of Q1 2026:**
   - Review metrics vs targets
   - Decide on Phase 2 timeline
   - Plan authentication approach

---

## Files in This Plan

- `docs/research/product-roadmap.md` - Full detailed roadmap (881 lines)
- `docs/research/product-roadmap-quick-reference.md` - This summary

---

## Related Documentation

- **ADR-020: Planting Detail Dialog** (`docs/adrs/020-planting-detail-dialog.md`) - Architecture decision record documenting the bottom sheet dialog pattern and UI decisions
- **AI Inventory Management** (`docs/research/ai-inventory-management.md`) - Research on enabling Aitor to insert/edit/update plantings through natural language chat

---

## Production Preparation Steps

Before implementing progressive disclosure, complete these UX improvements:

### Step 1: Plant Dialog UX Implementation (✅ COMPLETE)

**Status:** Completed in PR #68 and #69 (January 27, 2026)

**What was implemented:**
- Bottom sheet dialog pattern for mobile-first UX
- Full inline editing of planting information (dates, notes, success ratings)
- Sow method selection with conditional transplant date field
- Harvest date tracking (expected and actual)
- Companion planting visibility with good/conflict indicators
- Plant care information display (water, sun, spacing, days to harvest)
- Delete functionality with confirmation
- Full accessibility support (ARIA labels, keyboard navigation, 44px touch targets)
- Shared utility functions for code maintainability

**Related PRs:**
- PR #68: Add planting detail dialog with expanded editing capabilities
- PR #69: Fix planting dialog accessibility and state management issues

### Step 2: Section-by-Section UX Review

Review each section's components individually, then how they integrate within the section.

#### 2.1 Today (Dashboard)
**Components:** TodayDashboard, SeasonCard, TaskList, QuickActions, AIInsight, CompostAlerts
**Key Questions:**
- Is information hierarchy correct (what do users need first)?
- Do QuickActions lead to the right places?
- Is TaskList actionable or just informational?
- Does AIInsight provide value or feel like noise?
**Intra-section integration:** How do SeasonCard, TaskList, and QuickActions work together to guide daily activity?

#### 2.2 This Month (Calendar)
**Components:** Monthly calendar view, seasonal task suggestions
**Key Questions:**
- Does it answer "what should I do now?" effectively?
- Is the monthly vs seasonal information balance right?
- How does it connect to actual plantings?
**Intra-section integration:** Calendar events vs task recommendations vs planting timelines

#### 2.3 Seeds (Inventory)
**Components:** VarietyEditDialog, seed list, filtering, year selection
**Key Questions:**
- Is variety tracking intuitive?
- Is the "have seeds" / "ordered" / "none" status clear?
- How do users discover they can track seeds for future years?
**Intra-section integration:** List view vs detail editing vs year filtering

#### 2.4 Allotment (Layout & Plantings)
**Components:**
- Grid: AllotmentGrid, AllotmentMobileView, BedItem
- Forms: AddAreaForm, EditAreaForm, AddPlantingForm, PlantCombobox
- Details: BedDetailPanel, PermanentDetailPanel, InfrastructureDetailPanel, ItemDetailSwitcher
- Plantings: PlantingCard, PlantingDetailDialog, PlantingTimeline, PerennialStatusBadge
- Notes: BedNotes, CareLogSection, HarvestTracker, UnderplantingsList
- Status: SeasonStatusWidget
**Key Questions:**
- Can users easily add/edit/remove plantings?
- Is the grid vs detail panel relationship clear?
- Is mobile view (AllotmentMobileView) as capable as desktop?
- Are the different area types (beds, trees, infrastructure) handled consistently?
**Intra-section integration:** Grid selection → Detail panel → Planting cards → Detail dialog flow

#### 2.5 Compost
**Components:** Pile tracking, event logging, C:N ratio display
**Key Questions:**
- Is C:N ratio tracking useful or too technical?
- Is event logging (add greens/browns) intuitive?
- Does it provide actionable guidance?
**Intra-section integration:** Pile status vs event history vs recommendations

#### 2.6 AI Advisor
**Components:** ChatMessage, ChatInput, QuickTopics, TokenSettings, ToolCallConfirmation, LocationStatus, ApiFallbackWarning, InlineAIPrompt
**Key Questions:**
- Is the BYOK (bring your own key) flow clear?
- Are tool calls (modifying plantings) trustworthy and confirmable?
- Do QuickTopics help users get started?
- Is the inline prompt (contextual AI) useful?
**Intra-section integration:** Token setup → Chat flow → Tool confirmations → Data modifications

#### 2.7 Settings
**Components:** DataManagement (export/import/clear), ShareDialog, storage stats
**Key Questions:**
- Is export/import discoverable?
- Is the share flow (QR code, 6-digit code) intuitive?
- What else belongs here (preferences, about, help)?
- Should "About" page content move here?
**Intra-section integration:** Data management vs sharing vs app info

#### 2.8 Shared UI Components
**Components:** Dialog, SaveIndicator, Toast, StorageWarningBanner, InstallPrompt, OfflineIndicator, UnlockCelebration
**Key Questions:**
- Are dialogs consistent (bottom-sheet on mobile)?
- Is save status clear and non-intrusive?
- Are error states helpful?
**Cross-cutting:** These affect all sections - review for consistency

#### 2.9 Navigation
**Components:** Navigation (main nav bar)
**Key Questions:**
- Is the current 6-item nav overwhelming?
- Which items should be primary vs secondary?
- Mobile nav: hamburger vs bottom tabs vs current approach?

#### 2.10 About
**Components:** AboutPage (static content page with feature overview)
**Key Questions:**
- Does it effectively communicate the app's value proposition?
- Is the "BYO API Key" concept clear to new users?
- Should this content move to Settings or be accessible from onboarding?
- Is the philosophy section ("Growing with Intention") compelling?
- Do the quick action links help users discover features?
**Intra-section integration:** Feature descriptions vs navigation links vs philosophy messaging

### Step 3: Cross-Section Integration Review

After reviewing sections individually, map how they connect:

#### User Journeys to Test
- "Plan a new bed" → Allotment → Add area → Add plantings → See in Today
- "Track a harvest" → Allotment → Select planting → Log harvest → See totals
- "Check what to do" → Today → See tasks → Navigate to relevant section
- "Add seeds I bought" → Seeds → Add variety → Mark as "have" → See in Allotment when planting
- "Share with family" → Settings → Share → Receive on other device → Verify data
- "Ask for help" → AI Advisor → Ask question → Confirm tool call → See change in Allotment

#### Integration Questions
- Is terminology consistent across sections (variety vs seed, area vs bed)?
- Do navigation patterns match expectations (back buttons, breadcrumbs)?
- Is data shown consistently (same planting looks same everywhere)?
- Are empty states helpful and guide to next action?

**Goal:** Ship a polished, coherent experience before adding progressive disclosure complexity.

---

## Questions for Review

1. **Unlock criteria:** Are 3 visits / 5 plantings the right thresholds?
2. **Hidden features:** Should anything else be hidden? Shown earlier?
3. **Phase 1 scope:** Too ambitious for 4-5 weeks? Cut anything?
4. **Metrics:** Are the success targets realistic?
5. **User interviews:** What questions should we prioritize?

---

**Status:** ✅ Step 1 Complete | Ready for Step 2
**Next:** Section-by-Section UX Review (Step 2)
