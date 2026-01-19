# Phase 1 Implementation Estimate

**Goal:** Ultra-focused MVP with 3 core features + progressive unlock system
**Timeline:** 15-20 working days (3-4 weeks calendar time)

---

## Time Breakdown by Week

### Pre-Development (3-5 days)
Optional but recommended for validation:
- User interviews (2-3 days)
- Design mockups for unlocks (1-2 days)
- Finalize unlock criteria

**Can skip this to start faster, adjust later based on analytics**

---

### Week 1: Core Gating System (5-6 days)

**Day 1-3: Feature Flag System (2-3 days)**
- Create `useFeatureFlags` hook
- localStorage persistence
- Visit counting, planting counting
- Unlock logic (3 visits → AI, 5 visits → Compost, 5 plantings → Layout)
- Admin override for testing (?unlock=all)

**Day 4: Hide Routes (1 day)**
- Remove AI/Compost/Allotment from navigation
- Add route guards (redirect if not unlocked)
- Update navigation component conditional rendering

**Day 5-6: Basic Unlock Celebrations (1-2 days)**
- Unlock modal components
- Confetti animations
- "New!" badges on navigation
- Analytics tracking for unlocks

---

### Week 2: Onboarding & Discovery (5-6 days)

**Day 7-9: Onboarding Flow (2-3 days)**
- Welcome screen with value prop
- Plant picker (category → vegetable selection)
- "I'm growing..." confirmation
- Persist to userData.myPlantings
- Skip everything else (no layout, no API keys)

**Day 10-11: Progress Indicators (1-2 days)**
- Footer progress tracker: "Visit 2 more times to unlock AI"
- Progress bars for plantings: "Add 3 more to unlock layout"
- CTA teasers throughout app

**Day 12: Testing Unlock Flows (1 day)**
- Test all unlock conditions
- Verify modals appear correctly
- Check navigation updates

---

### Week 3: Polish Core 3 Features (5-6 days)

**Day 13-14: Today Dashboard (2 days)**
- Empty state detection → redirect to onboarding
- Personalized tips based on myPlantings
- Remove AI Insight component (show after unlock)
- Discovery CTA: "💡 Have a question? Unlock Aitor"
- Simplified quick actions (Seeds only)

**Day 15-16: This Month Personalization (2 days)**
- Filter calendar by user's plantings (highlights)
- Variety-specific tips from seed library
- Remove AI CTAs (re-add when unlocked)
- Layout teaser: "Want rotation advice?"

**Day 17-18: Seeds Page Polish (1-2 days)**
- Improved empty state
- Onboarding tooltips
- Progress indicator for layout unlock
- "Add to my garden" quick action

---

### Week 4: Testing & Launch Prep (3-4 days)

**Day 19-20: E2E Testing (1-2 days)**
- Test onboarding → adding plantings → unlocks
- Test all 3 unlock scenarios
- Browser compatibility (Safari, Firefox)
- Mobile testing

**Day 21: Analytics Integration (1 day)**
- PostHog or Plausible setup
- Track unlock events
- Track onboarding completion
- Track feature usage

**Day 22: Polish & Bug Fixes (1-2 days)**
- Fix issues from testing
- Performance optimization
- Final accessibility review
- Deployment preparation

---

## Total Time: 18-22 Working Days

**Best Case:** 18 days (3.5 weeks)
- Minimal bugs
- No scope creep
- Designs already clear

**Realistic:** 20 days (4 weeks)
- Some iteration needed
- Testing reveals issues
- Design adjustments

**Conservative:** 22 days (4.5 weeks)
- Multiple revisions
- Unforeseen complexity
- Accessibility/browser issues

---

## What's NOT Included (Can Add Later)

**Phase 1 excludes:**
- ❌ Advanced AI features (multi-turn, image upload polish)
- ❌ Compost simplification (already built, just hidden)
- ❌ Layout planner improvements (already built, just hidden)
- ❌ Push notifications
- ❌ Feature tours
- ❌ Sharing/export features
- ❌ Email notifications for unlocks

**These can be added in Phase 2 based on user feedback**

---

## Risks & Buffers

### Technical Risks (Low)
- Feature flag logic bugs → +1-2 days
- Route guard edge cases → +0.5-1 day
- Browser compatibility → +0.5-1 day

### Design Risks (Medium)
- Unlock celebrations need iteration → +1-2 days
- Progress indicators unclear → +0.5-1 day
- Onboarding flow confusing → +1-2 days

### Scope Risks (High)
- "Just one more feature..." → +3-5 days
- Over-engineering unlock system → +2-3 days
- Perfect is enemy of done → +5-10 days

**Mitigation:** Strict scope discipline, ship MVP, iterate in Phase 2

---

## Parallelization Opportunities

Can work on simultaneously (if team > 1):
1. **Frontend:** Onboarding flow + Today/This Month polish
2. **Backend/Logic:** Feature flag system + route guards
3. **Design:** Unlock celebrations + progress indicators

**Solo developer:** Follow weeks sequentially, ~4 weeks total

---

## Launch Readiness Checklist

Before going live:
- [ ] All 3 unlock scenarios tested
- [ ] Analytics tracking unlocks
- [ ] Onboarding flow smooth (< 60 seconds)
- [ ] Empty states handled gracefully
- [ ] Mobile experience tested
- [ ] Accessibility verified
- [ ] Privacy policy updated
- [ ] Sentry error tracking active
- [ ] Performance acceptable (< 2s load)
- [ ] 5-10 beta testers validated

---

## Post-Launch Monitoring (First 2 Weeks)

**Track daily:**
- Onboarding completion rate (target: 70%)
- Unlock rates (AI 30%, Compost 20%, Layout 15%)
- 7-day retention (target: 50%)
- Error rates (Sentry)
- Performance (Core Web Vitals)

**Iterate based on data:**
- If unlock rate < 10%: Lower thresholds or improve CTAs
- If onboarding completion < 50%: Simplify flow
- If retention < 30%: Add more personalization

---

## Conclusion

**Realistic Estimate: 3-4 weeks (20 working days)**

This is an aggressive but achievable timeline for an ultra-focused MVP:
- 3 core features (Today, This Month, Seeds)
- 3 hidden features (AI, Compost, Layout)
- Simple unlock system
- Basic onboarding

The key is **ruthless scope discipline** - ship the minimum, learn from users, iterate in Phase 2.
