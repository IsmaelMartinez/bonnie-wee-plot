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
- Start with 4 simple features (Today, This Month, Seeds, Compost)
- Hide AI Advisor and Allotment Layout initially
- Unlock features as users demonstrate engagement

### How Features Unlock

| Feature | Unlock Condition | Why |
|---------|-----------------|-----|
| **AI Advisor** | 3 visits OR click CTA | Users have context, ready for advanced help |
| **Layout Planner** | 5 plantings OR request | Users have data to populate beds with |
| **Advanced Compost** | 3 compost events | Ready for C:N ratios, temp tracking |

---

## The 4 Phases

### Phase 1: Simplified Launch (4-5 weeks)
**Ship:** Feature gating system, simplified nav (4 items), onboarding, unlock celebrations
**Hide:** AI Advisor, Allotment Layout
**Goal:** 500 users, 50% retention, 30% unlock rate

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

### Week 1 (Before coding)
- [ ] User interviews: Validate feature gating strategy
- [ ] Design: Unlock celebrations, progress indicators
- [ ] Refine: Adjust unlock criteria based on feedback

### Week 2-5 (Phase 1 build)
1. Feature flag system (2-3 days) ← **START HERE**
2. Simplified navigation (1 day)
3. Onboarding flow (2-3 days)
4. Unlock celebrations (1-2 days)
5. Progress indicators & CTAs (1-2 days)
6. Today/This Month polish (3-4 days)
7. Seeds/Compost simplification (2-3 days)
8. Testing & refinement (3-4 days)

---

## Key Metrics to Track

**Acquisition:**
- Unique visitors
- Onboarding completion rate (target: 70%)

**Activation:**
- Plantings added (target: 3+ per user)
- Seeds tracked (target: 10%)
- Compost events (target: 10%)

**Engagement:**
- AI unlock rate (target: 30%)
- Layout unlock rate (target: 20%)
- Return visits (target: 50% within 7 days)

**Retention:**
- 7-day retention (target: 50%)
- 30-day retention (target: 30%)

---

## What Changed from Original Plan

| Original | New Approach | Why |
|----------|-------------|-----|
| Show all 6 nav items | Show 4 core items | Reduce overwhelm |
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

## Questions for Review

1. **Unlock criteria:** Are 3 visits / 5 plantings the right thresholds?
2. **Hidden features:** Should anything else be hidden? Shown earlier?
3. **Phase 1 scope:** Too ambitious for 4-5 weeks? Cut anything?
4. **Metrics:** Are the success targets realistic?
5. **User interviews:** What questions should we prioritize?

---

**Status:** ✅ Ready for review and feedback
**Next:** User interviews to validate strategy
