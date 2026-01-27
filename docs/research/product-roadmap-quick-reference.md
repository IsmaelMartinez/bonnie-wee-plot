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

Review each app section in isolation to identify issues and improvements:

| Section | Purpose | Key Questions |
|---------|---------|---------------|
| **Today** | Daily dashboard | What actions do users take most? Is the information hierarchy correct? |
| **This Month** | Seasonal calendar | Does it answer "what should I do now?" effectively? |
| **Seeds** | Seed inventory & catalog | Is variety tracking intuitive? How does it connect to plantings? |
| **Allotment** | Garden layout & plantings | Can users easily add/edit plants? How does grid interact with bed details? |
| **Compost** | Pile tracking | Is the C:N ratio tracking useful? Event logging UX? |
| **AI Advisor** | Chat with Aitor | Should it be able to modify data (see AI inventory research)? |

### Step 3: Holistic UX Review

After reviewing sections individually, map the user journey across sections:
- Identify friction points in cross-section workflows
- Ensure consistent patterns and terminology
- Validate navigation and information architecture
- Test complete user scenarios (e.g., "plan a new bed" → "track harvest")

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
