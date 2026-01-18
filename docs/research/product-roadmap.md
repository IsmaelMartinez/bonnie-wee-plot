# Scottish Grow Guide - Product Roadmap

**Last Updated:** January 2026
**Status:** Pre-Launch Product Planning

---

## Executive Summary

Transform Scottish Grow Guide from a feature-complete garden planning app into a **focused, easy-to-adopt product** that helps Scottish gardeners succeed with a **tips-first, simplified experience**.

### Product Vision

**"Master the basics, unlock the advanced features"**

Help users get immediate value through seeds tracking, composting guidance, and seasonal tips—without overwhelming them with AI chat, complex layout planning, or advanced features they're not ready for yet.

### Key Strategic Decisions

1. **Progressive feature disclosure**: Hide AI advisor and layout planner initially
2. **Earn-your-features model**: Unlock advanced tools after demonstrating engagement
3. **Personalization without complexity**: Dynamic tips based on minimal user input
4. **Phased feature releases**: Build user base with core features, add advanced tools later
5. **Local-first, cloud-later**: Keep current localStorage model, add sync for engaged users
6. **Free + BYO API key**: No hosting costs, sustainable open-source model

---

## Feature Gating Strategy

### 🎯 Phase 1: Core Features (Always Visible)

**Navigation:**
- ✅ Today (Dashboard)
- ✅ This Month (Calendar)
- ✅ Seeds (Tracking)
- ✅ Compost (Management)
- ✅ About (Information)

**Why these?**
- Simple, focused value proposition
- No overwhelming choices
- Clear use cases
- Easy to understand
- Immediate benefit

### 🔒 Phase 1: Hidden Features (Unlock Later)

**Hidden from navigation:**
- 🔒 AI Advisor (Aitor) - Unlocks after 3+ visits or manual discovery
- 🔒 Allotment (Layout Planner) - Unlocks after 5+ plantings tracked

**Implementation:**
```typescript
// Feature flag system in localStorage
interface FeatureFlags {
  aiAdvisorUnlocked: boolean
  layoutPlannerUnlocked: boolean
  visitCount: number
  plantingsCount: number
}

// Unlock conditions
const unlockAIAdvisor = () => visitCount >= 3 || userClickedHiddenLink
const unlockLayout = () => plantingsCount >= 5 || userAsksForIt
```

**Unlock Mechanisms:**

1. **AI Advisor Unlocks When:**
   - User returns 3+ times, OR
   - User clicks "Ask Aitor" CTA in Today/This Month pages, OR
   - User explicitly searches for help/questions

2. **Layout Planner Unlocks When:**
   - User tracks 5+ different vegetables in Seeds, OR
   - User clicks "Advanced planning" teaser, OR
   - User completes Phase 1 onboarding successfully

**Discovery Breadcrumbs (Teasers):**
- Today dashboard: "💡 Wondering about your kale? Ask Aitor" → Unlocks AI
- Seeds page: "Track 3 more to unlock advanced planning" → Progress bar
- This Month: "🗺️ Want crop rotation advice? Map your beds" → Unlocks layout

---

## Current State Analysis

### ✅ What's Already Built (Strong Foundation)

| Feature | Status | Phase 1 Visibility | Unlock Condition |
|---------|--------|-------------------|------------------|
| **Seeds Tracking** | ✅ Complete | ✅ Always visible | N/A |
| **Compost Management** | ✅ Complete | ✅ Always visible | N/A |
| **This Month Calendar** | ✅ Complete | ✅ Always visible | N/A |
| **Today Dashboard** | ✅ Complete | ✅ Always visible | N/A |
| **AI Advisor (Aitor)** | ✅ Complete | 🔒 Hidden initially | 3+ visits OR CTA click |
| **Allotment Planner** | ✅ Complete | 🔒 Hidden initially | 5+ plantings OR request |

### 🔍 What Users Currently See (Problem)

**First-time visitor experience today:**
1. Lands on "Today" dashboard → Sees empty state, no plantings
2. Sees 6 navigation items → Paralyzed by choice
3. Clicks "Allotment" → Overwhelmed by grid, beds, years
4. Clicks "AI Advisor" → Confused about API keys
5. Adds a few plantings → Doesn't understand rotation/companions
6. Abandons or powers through with confusion

**What we want instead (Solution):**
1. Lands on welcome screen → "What are you growing this year?"
2. Sees 4 simple navigation items → Clear choices (Today, This Month, Seeds, Compost)
3. Adds 3-5 vegetables from seed catalog
4. Gets immediate personalized tips and monthly tasks
5. Returns 3+ times → "You've unlocked Aitor, your AI garden buddy!"
6. Tracks 5+ plants → "Ready to map your beds for rotation advice?"

---

## Product Strategy: Progressive Disclosure

### Phase 0: Foundation (✅ Mostly Complete)

**Goal:** Technical readiness for public launch

**What Exists:**
- PWA with offline support
- Sentry error tracking (needs DSN)
- Accessibility & mobile UX patterns
- Comprehensive test coverage
- Security hardening (CSP, input validation)

**What's Needed:**
- [ ] Configure production Sentry DSN
- [ ] Set up analytics (PostHog/Plausible for privacy-first tracking)
- [ ] Add conversion funnels (feature unlocks, engagement)
- [ ] Create privacy policy & cookie notice
- [ ] Set up feedback mechanism (in-app + GitHub issues)
- [ ] **Feature flag system for gating AI/Layout**

**Timeline:** 1 week (pre-launch sprint)

---

### Phase 1: Simplified Launch (MVP)

**Goal:** Help users succeed with basic tracking and tips

**Target User:**
- Scottish gardeners with existing plots/containers
- Growing 5-20 different vegetables
- Want seasonal reminders and tracking
- Beginners or casual gardeners

**Core Experience Flow:**

```
1. Welcome Screen
   ↓
2. "What are you growing this year?" (Quick Add)
   - Pick 3-5 vegetables from visual grid
   - No variety names required (optional)
   - Skip everything else
   ↓
3. → Today Dashboard (Personalized!)
   - "Your garden in January"
   - What to harvest this month (based on calendar)
   - What to sow soon (seasonal advice)
   - Care tips for your plantings
   ↓
4. → This Month Page (Filtered!)
   - Generic calendar ONLY (Scotland-wide)
   - Highlighted sections based on user's plants
   - "You're growing kale - here's what to do"
   ↓
5. → Seeds Page (Track spending)
   - Add varieties they've bought
   - Track what's planted vs planned
   - See spending stats
   ↓
6. → Compost Page (Log materials)
   - Simple pile tracking
   - Basic green/brown guidance
   - No complex C:N calculations required
   ↓
7. After 3 visits → 🎉 "You've unlocked Aitor!"
   - Celebration modal
   - Explain BYO API key or free tier
   - Add to navigation
   ↓
8. After 5 plantings → 🎉 "Ready for advanced planning?"
   - Show value prop for layout planner
   - "Get crop rotation warnings"
   - "See companion planting conflicts"
   - Add to navigation
```

**Features to Build:**

**1. Feature Gating System (2-3 days)**
- [ ] `useFeatureFlags` hook with localStorage persistence
- [ ] Analytics tracking for unlock events
- [ ] Unlock celebration modals
- [ ] Progressive navigation component
- [ ] Teaser components for locked features
- [ ] Admin override for testing (querystring ?unlock=all)

**2. Lightweight Onboarding (2-3 days)**
- [ ] Welcome screen with simple value prop
- [ ] Quick plant picker (category grid → vegetable list)
- [ ] "I'm growing..." confirmation list
- [ ] Skip to dashboard (no layout, no AI mentioned)
- [ ] Persist in `userData.myPlantings: PlantId[]`

**3. Simplified Navigation (1 day)**
- [ ] Conditional rendering based on feature flags
- [ ] 4 items initially: Today, This Month, Seeds, Compost, About
- [ ] Add AI Advisor link when unlocked
- [ ] Add Allotment link when unlocked
- [ ] Show unlock progress in footer: "Track 3 more plants to unlock planning"

**4. Simplified Today Dashboard (3-4 days)**
- [ ] Detect empty state → Show onboarding
- [ ] If `myPlantings` exists, show personalized tips:
  - "These might be ready to harvest this month" (calendar-based)
  - "Time to sow these indoors" (seasonal)
  - "Care tasks for your plantings" (generic)
- [ ] **Remove AI Insight component** (re-add when unlocked)
- [ ] Discovery CTA: "💡 Have a question? Unlock Aitor" → Tracks click
- [ ] Quick actions: Add to Seeds, Log Compost (NO layout option yet)

**5. Enhanced This Month Personalization (2-3 days)**
- [ ] Filter generic calendar by user's plantings (highlight only)
- [ ] Show variety-specific tips from seed library (if tracked)
- [ ] **Remove AI CTAs** (re-add when unlocked)
- [ ] Teaser: "Want rotation advice? Map your beds" → Unlocks layout

**6. Seeds Page Polish (1-2 days)**
- [ ] Improve empty state: "Track what you've bought/used"
- [ ] Add onboarding tooltips
- [ ] Progress indicator: "Add 3 more to unlock planning features"
- [ ] "Add to my garden" quick action → Links to Today

**7. Compost Page Simplification (1-2 days)**
- [ ] **Hide advanced fields** (C:N ratio, temperature tracking)
- [ ] Simple mode by default: "What did you add?"
- [ ] Basic greens/browns guidance
- [ ] Pre-filled templates: "Garden waste pile", "Kitchen scraps bin"
- [ ] Unlock "Advanced composting" after 3+ events logged

**8. AI Advisor (Hidden Initially) (1-2 days)**
- [ ] Remove from main navigation
- [ ] Add unlock modal/celebration
- [ ] Improve API key entry UX when unlocked
- [ ] Add "Try with free Gemini tier" option (50/day)
- [ ] Suggested prompts based on season + plantings

**9. Layout Planner (Hidden Initially) (1 day)**
- [ ] Remove from main navigation
- [ ] Add unlock modal/celebration
- [ ] "Getting Started" guide when unlocked
- [ ] Simplified first-time experience

**Total Effort:** ~18-23 days (4-5 weeks)

**Success Metrics:**
- 70% of new users add at least 3 plantings (higher than before)
- 50% return within 7 days (higher due to simplicity)
- 30% unlock AI advisor (engagement signal)
- 20% unlock layout planner (power user signal)
- 15% track seeds or compost (adoption)

---

### Phase 2: Feature Discovery & Engagement

**Goal:** Users discover and adopt advanced features naturally

**Target User:**
- Returned from Phase 1
- Checked dashboard 3+ times
- Ready for more tools

**Features to Build:**

**1. Enhanced Unlock Flows (1 week)**
- [ ] Gamified unlock celebrations with confetti
- [ ] Email notifications (if opted in): "You unlocked a new feature!"
- [ ] Feature tours after unlock (interactive walkthroughs)
- [ ] Share achievements: "I unlocked advanced planning!"

**2. AI Advisor Enhancements (1 week)**
- [ ] Conversation history saved (localStorage)
- [ ] Context builder: "I'm asking about [my kale]"
- [ ] Seasonal prompts: "Ask about January tasks"
- [ ] Image upload hints when unlocked

**3. Layout Planner Simplification (1 week)**
- [ ] Wizard: "How many beds?" → Auto-creates layout
- [ ] Drag existing plantings onto beds
- [ ] Rotation indicators activate
- [ ] Companion warnings appear
- [ ] "This is easier than you thought!" confirmation

**4. Advanced Compost Features (Unlock After 3 Events) (3-4 days)**
- [ ] C:N ratio calculator
- [ ] Temperature tracking
- [ ] Maturity predictions
- [ ] Expert tips based on pile data

**5. Notifications & Reminders (1 week)**
- [ ] PWA push notifications (opt-in)
- [ ] Monthly: "Here's what to do in February"
- [ ] Seasonal: "Time to chit potatoes!"
- [ ] Feature unlocks: "You unlocked Aitor!"

**6. Sharing & Export (3-4 days)**
- [ ] Export seed list as CSV
- [ ] Share monthly calendar as image
- [ ] "My garden in 2026" summary

**Total Effort:** ~25-30 days (5-6 weeks)

**Success Metrics:**
- 40% of Phase 1 users return 4+ times
- 60% of returning users unlock at least one feature
- 25% use AI advisor after unlock
- 15% map their layout after unlock
- 10% enable notifications

---

### Phase 3: Power Users (Monetization Readiness)

**Goal:** Serve committed gardeners who want advanced features

**Features to Build:**

**1. Authentication & Cloud Sync (2 weeks)**
- [ ] Clerk integration (email + social login)
- [ ] Supabase database setup
- [ ] Migration: "Import your local garden to cloud"
- [ ] Cross-device sync
- [ ] GDPR compliance (export, delete)

**2. Premium AI Features (1 week)**
- [ ] Server-side Gemini key (50 free queries/day)
- [ ] Multi-turn conversations with memory
- [ ] Image recognition: "What's wrong with my plant?"
- [ ] Succession planting planner (AI-generated)

**3. Advanced Planning Tools (2-3 weeks)**
- [ ] Full drag-drop plot planner (dnd-kit PRD)
- [ ] Auto-fill algorithm with companion validation
- [ ] Copy last year's plan
- [ ] Multi-year planning (2025-2030)
- [ ] Historical comparison: "How did 2025 compare to 2024?"

**4. Data Integrations (1-2 weeks)**
- [ ] Weather API (Met Office)
- [ ] Frost date predictions for postcode
- [ ] Blight alerts (Scottish-specific)
- [ ] Degree day tracking for sowing

**Total Effort:** ~35-45 days (7-9 weeks)

**Success Metrics:**
- 20% of active users create account
- 10% use cloud sync
- 5% willing to pay for premium AI (future)
- 15% use advanced planner

---

### Phase 4: Community & Scale (Growth)

**Goal:** Build network effects and sustainability

**Features to Build:**

**1. Social Features (2-3 weeks)**
- [ ] Public garden profiles
- [ ] Follow other gardeners
- [ ] Regional leaderboards (Highland, Central, Borders)
- [ ] Variety reviews & ratings
- [ ] Swap shop: Seed exchange listings

**2. Expert Content (Ongoing)**
- [ ] Monthly newsletter (curated tips)
- [ ] Video tutorials (YouTube embeds)
- [ ] Guest posts from Scottish gardeners
- [ ] RHS partnership for plant data

**3. Mobile App (3-4 months)**
- [ ] React Native version (iOS/Android)
- [ ] Camera-first workflow (snap plant → ID → advice)
- [ ] Offline-first with background sync
- [ ] App Store / Play Store launch

**4. Localization (1-2 weeks per language)**
- [ ] Scots language option
- [ ] Scottish Gaelic support
- [ ] Multi-region calendars (England, Ireland, Wales)

**Total Effort:** ~60+ days (3-4 months)

**Success Metrics:**
- 1,000+ active users
- 100+ daily active users
- 10% engagement rate (posts, reviews)
- Featured in app stores

---

## Implementation: Feature Flag System

### Technical Architecture

**Storage Schema:**
```typescript
// localStorage: 'feature-flags'
interface FeatureFlags {
  version: number
  userId: string  // Anonymous UUID

  // Tracking
  visitCount: number
  plantingsCount: number
  seedVarietiesCount: number
  compostEventsCount: number
  lastVisit: string
  firstVisit: string

  // Feature unlocks
  aiAdvisorUnlocked: boolean
  aiAdvisorUnlockedAt?: string
  layoutPlannerUnlocked: boolean
  layoutPlannerUnlockedAt?: string
  advancedCompostUnlocked: boolean

  // Manual overrides (testing)
  overrides?: {
    unlockAll?: boolean
    aiAdvisor?: boolean
    layoutPlanner?: boolean
  }
}
```

**React Hook:**
```typescript
// hooks/useFeatureFlags.ts
export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>(loadFlags)

  const incrementVisits = () => {
    const newFlags = { ...flags, visitCount: flags.visitCount + 1 }
    if (newFlags.visitCount >= 3 && !newFlags.aiAdvisorUnlocked) {
      showUnlockCelebration('AI Advisor')
      newFlags.aiAdvisorUnlocked = true
      newFlags.aiAdvisorUnlockedAt = new Date().toISOString()
    }
    saveFlags(newFlags)
    setFlags(newFlags)
  }

  const incrementPlantings = () => {
    const newFlags = { ...flags, plantingsCount: flags.plantingsCount + 1 }
    if (newFlags.plantingsCount >= 5 && !newFlags.layoutPlannerUnlocked) {
      showUnlockCelebration('Layout Planner')
      newFlags.layoutPlannerUnlocked = true
      newFlags.layoutPlannerUnlockedAt = new Date().toISOString()
    }
    saveFlags(newFlags)
    setFlags(newFlags)
  }

  const manualUnlock = (feature: 'aiAdvisor' | 'layoutPlanner') => {
    // User clicked a discovery CTA
    const newFlags = { ...flags }
    if (feature === 'aiAdvisor') {
      newFlags.aiAdvisorUnlocked = true
      newFlags.aiAdvisorUnlockedAt = new Date().toISOString()
      trackEvent('feature_manual_unlock', { feature: 'ai_advisor' })
    }
    // ... similar for layout
    saveFlags(newFlags)
    setFlags(newFlags)
  }

  return {
    flags,
    incrementVisits,
    incrementPlantings,
    manualUnlock,
    isAIAdvisorVisible: flags.aiAdvisorUnlocked || flags.overrides?.aiAdvisor,
    isLayoutPlannerVisible: flags.layoutPlannerUnlocked || flags.overrides?.layoutPlanner,
  }
}
```

**Navigation Component:**
```typescript
export function Navigation() {
  const { isAIAdvisorVisible, isLayoutPlannerVisible } = useFeatureFlags()

  return (
    <nav>
      <NavLink href="/">Today</NavLink>
      <NavLink href="/this-month">This Month</NavLink>
      <NavLink href="/seeds">Seeds</NavLink>
      <NavLink href="/compost">Compost</NavLink>

      {isAIAdvisorVisible && (
        <NavLink href="/ai-advisor" badge="New">
          AI Advisor
        </NavLink>
      )}

      {isLayoutPlannerVisible && (
        <NavLink href="/allotment" badge="New">
          Allotment
        </NavLink>
      )}

      <NavLink href="/about">About</NavLink>
    </nav>
  )
}
```

**Unlock Celebration:**
```typescript
function showUnlockCelebration(featureName: string) {
  // Show modal with confetti animation
  return (
    <Modal>
      <Confetti />
      <h2>🎉 You've unlocked {featureName}!</h2>
      <p>Keep exploring to discover more features</p>
      <Button onClick={() => router.push(featureUrl)}>
        Try it now
      </Button>
    </Modal>
  )
}
```

---

## User Journey Evolution

### First Visit (Phase 1)
```
Landing → Onboarding → Pick 3-5 crops → Today Dashboard
→ "Simple! I can do this"
→ See 4 menu items (not overwhelmed)
```

### Visit 2-3 (Phase 1)
```
Check This Month → Add seeds → Log compost
→ "This is actually useful"
→ See progress: "Track 2 more to unlock planning"
```

### Visit 4+ (Phase 2)
```
🎉 Unlock AI Advisor → Try asking a question
→ "Wow, this knows about Scotland!"
→ See "Advanced planning unlocked" teaser
```

### Week 2 (Phase 2)
```
Track 5th planting → 🎉 Unlock Layout Planner
→ Map beds in wizard
→ See rotation warnings
→ "I'm hooked, this is powerful"
```

### Month 1-3 (Phase 2-3)
```
Enable notifications → Get monthly reminders
→ Share seed list → Sign up for account
→ Sync across devices
```

### Year 1 (Phase 4)
```
Copy plan to next year → Rate varieties
→ Join regional community → Recommend to friend
```

---

## Feature Prioritization Framework

### Must-Have (Phase 1)
- ✅ Seeds tracking (always visible)
- ✅ Compost management (always visible)
- ✅ This Month calendar (always visible)
- ✅ Today dashboard (always visible)
- 🔨 Feature flag system
- 🔨 Simplified navigation (4 items)
- 🔨 Lightweight onboarding
- 🔨 Unlock celebrations

### Should-Have (Phase 2)
- 🔒 AI Advisor (hidden, unlock after 3 visits)
- 🔒 Layout Planner (hidden, unlock after 5 plantings)
- Notifications & reminders
- Feature tours

### Nice-to-Have (Phase 3+)
- Cloud sync & authentication
- Advanced AI features
- Weather integrations
- Mobile app

### Won't-Have (For Now)
- ❌ Marketplace/e-commerce
- ❌ Video hosting (use YouTube)
- ❌ Custom domains per user
- ❌ Team/multi-user accounts
- ❌ API for third-party apps

---

## Success Metrics & KPIs

### Phase 1 (Acquisition & Simplification)
- **Primary:** 500 unique visitors in first month
- **Secondary:** 150 active users (3+ sessions) - higher than before
- **Engagement:** 70% complete onboarding - higher due to simplicity
- **Retention:** 50% return within 7 days - higher due to focus
- **Unlock Rate:** 30% unlock AI Advisor, 20% unlock Layout

### Phase 2 (Activation & Discovery)
- **Primary:** 60% of returning users unlock features
- **Secondary:** 25% use AI after unlock
- **Engagement:** 40% use layout after unlock
- **Retention:** 60% return within 30 days

### Phase 3 (Revenue Readiness)
- **Primary:** 200 account sign-ups
- **Secondary:** 50 daily active users
- **Engagement:** 10% use premium AI features
- **Retention:** 60% monthly active users (MAU)

### Phase 4 (Growth)
- **Primary:** 1,000+ MAU
- **Secondary:** 100+ DAU
- **Viral:** 0.5+ K-factor (referrals per user)
- **Revenue:** £500+ MRR (if premium tier launched)

---

## Risk Mitigation

### Product Risks (Updated)

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Users never unlock features** | High | Medium | Make unlock criteria very achievable (3 visits, 5 plantings), add manual unlock CTAs |
| **Users frustrated by "missing" features** | Medium | Low | Clear progress indicators, value prop teasers, "coming soon" badges |
| **Too simple, not enough value** | High | Low | Phase 1 still has strong personalization, calendar, tracking |
| **Users don't return to unlock** | High | Medium | Notifications, email reminders, good empty states |

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| localStorage limits (5-10MB) | High | Medium | Warn at 80%, compress data, migrate to Supabase |
| Feature flag conflicts/bugs | Medium | Medium | Comprehensive testing, admin override, easy rollback |
| Browser compatibility | Medium | Low | Test on Safari, Firefox, older browsers |
| Data loss (user error) | High | Medium | Auto-export weekly, cloud backup prompt |

---

## Development Roadmap Timeline

### Q1 2026 (Jan-Mar): Foundation & Launch

**January (4 weeks)**
- Week 1: Phase 0 completion (Sentry, analytics, privacy policy, feature flags)
- Week 2-4: Phase 1 build (gating, simplified nav, onboarding, unlock flows)

**February (4 weeks)**
- Week 1: Phase 1 polish & testing (especially unlock flows)
- Week 2: Pre-launch marketing (landing page, waitlist)
- Week 3: Beta testing with 10-20 users (validate gating strategy)
- Week 4: **PUBLIC LAUNCH** 🚀

**March (4 weeks)**
- Week 1-4: Phase 2 build (enhanced unlocks, feature tours, notifications)

### Q2 2026 (Apr-Jun): Engagement & Retention

**April-May (8 weeks)**
- Continue Phase 2 features
- Iterate based on unlock analytics
- A/B test unlock criteria (3 vs 5 visits?)
- Content marketing (blog posts, videos)
- Community building (Discord, events)

**June (4 weeks)**
- Phase 3 planning
- Authentication setup (Clerk)
- Database schema finalization (Supabase)

### Q3 2026 (Jul-Sep): Power Features

**July-September (12 weeks)**
- Phase 3 build (auth, sync, advanced planner)
- AI enhancements (multi-provider, image recognition)
- Weather integrations
- Mobile app planning

### Q4 2026 (Oct-Dec): Scale Prep

**October-December (12 weeks)**
- Phase 4 exploration (community features)
- Mobile app development starts
- Premium tier design
- Year-end retrospective & 2027 planning

---

## Next Steps (Immediate Actions)

### Week of January 20, 2026

**1. Validate Feature Gating Strategy (2-3 days)**
- [ ] Interview 5-10 Scottish gardeners
- [ ] Questions:
  - "How do you feel about apps that unlock features as you use them?"
  - "Would hiding AI chat initially make the app less overwhelming?"
  - "What would motivate you to return 3+ times?"
  - "How many plants do you typically grow?"

**2. Design Feature Gating UX (2 days)**
- [ ] Wireframe unlock celebration modals
- [ ] Design progress indicators ("Track 3 more...")
- [ ] Sketch teaser CTAs in Today/This Month
- [ ] Create badge designs ("New!", "Unlocked!")

**3. Technical Prep (1 day)**
- [ ] Set up production environment
- [ ] Configure Sentry DSN
- [ ] Install analytics (PostHog trial) with unlock event tracking
- [ ] Create privacy policy (template + customize)

**4. Refine Phase 1 Scope (1 day)**
- [ ] Review this roadmap with stakeholders
- [ ] Validate unlock criteria (3 visits? 5 plantings? Adjust?)
- [ ] Lock scope for February launch

**5. Kick Off Development (1 day)**
- [ ] Create GitHub project board
- [ ] Break Phase 1 into issues (prioritize feature flags first)
- [ ] Set up CI/CD for staging
- [ ] Assign tasks (if team) or plan solo sprint

---

## Appendix: Unlock Criteria Analysis

### Why Hide AI Advisor Initially?

**Problems with showing it upfront:**
- Requires API key setup (friction)
- Users don't understand value without context
- Competes with simpler features for attention
- Intimidating for non-technical users

**Benefits of unlocking after 3 visits:**
- User has context (knows their garden data)
- Demonstrated commitment (not a drive-by user)
- Better questions (specific, not generic)
- Higher perceived value (earned reward)

**Alternative unlock criteria considered:**
- ❌ 1 visit: Too soon, no context
- ✅ 3 visits: Sweet spot (demonstrated interest)
- ❌ 5 visits: Too late, may have given up
- ✅ Manual CTA click: Good escape hatch

### Why Hide Layout Planner Initially?

**Problems with showing it upfront:**
- Complex interface (beds, years, rotation)
- Requires significant data entry
- Not useful for container gardeners
- Overwhelming for beginners

**Benefits of unlocking after 5 plantings:**
- User has invested time in app
- Has data to populate layout with
- Understands basic concepts (vegetables, seasons)
- Ready for complexity

**Alternative unlock criteria considered:**
- ❌ 3 plantings: Too soon, not enough data
- ✅ 5 plantings: Minimum for meaningful layout
- ❌ 10 plantings: Too high, may never reach
- ✅ Manual request: Good for experienced users

---

## Appendix: Simplified User Personas

### Persona 1: "Beginner Beth" (Primary Target)

**Demographics:**
- Age: 27
- Location: Glasgow
- Experience: First-time gardener

**Phase 1 Journey:**
- Day 1: Onboarding, adds 3 vegetables (tomato, lettuce, herbs)
- Day 3: Checks "This Month", logs compost
- Day 7: Returns, sees "2 more visits to unlock AI" → motivated
- Day 10: 🎉 Unlocks Aitor, asks "Why is my basil dying?"
- Week 3: Tracks 5 plants → 🎉 Unlocks layout planning
- **Result:** Engaged power user

### Persona 2: "Enthusiastic Emma" (Secondary Target)

**Demographics:**
- Age: 32
- Location: Edinburgh
- Experience: 2 years gardening

**Phase 1 Journey:**
- Day 1: Onboarding, adds 8 vegetables immediately
- Day 1: 🎉 Instantly unlocks layout (>5 plantings)
- Day 2: Maps her 5 beds, sees rotation warnings
- Day 3: 🎉 Unlocks AI Advisor (3 visits)
- Week 2: Using all features, shares seed list
- **Result:** Champion user, refers friends

### Persona 3: "Seasoned Stuart" (Edge Case)

**Demographics:**
- Age: 58
- Location: Inverness
- Experience: 20+ years

**Phase 1 Journey:**
- Day 1: Skeptical of "another app"
- Day 1: Sees simple interface → "Okay, I'll try Seeds tracking"
- Day 5: Appreciates focused experience, no bloat
- Week 2: Unlocks AI, dismisses as gimmick
- Week 4: Unlocks layout, maps 12 beds from memory
- **Result:** Adopts for tracking, ignores AI

---

## Conclusion

This roadmap transforms Scottish Grow Guide from a **feature-complete app** into a **focused, learnable product** by:

1. **Hiding complexity**: AI and layout start hidden, unlock when ready
2. **Progressive disclosure**: Features reveal as users demonstrate engagement
3. **Simplified onboarding**: 4 menu items, clear value, no overwhelm
4. **Gamified discovery**: Celebrations, progress bars, achievement unlocks
5. **Lower barriers**: No API keys, no bed mapping, just "what are you growing?"

**Next Decision Point:** After user interviews validate gating strategy (Week of Jan 20), finalize unlock criteria and commit to February launch.

**Success Looks Like:** 500 users by end of Q1, 50% retention, 30% unlock AI, 20% unlock layout, foundation for sustainable growth in Q2+.

---

**Ready to start? Next steps:**
1. Validate feature gating with user interviews
2. Design unlock celebration UX
3. Build feature flag system
4. Simplify navigation to 4 items
5. Launch in February with progressive disclosure 🚀
