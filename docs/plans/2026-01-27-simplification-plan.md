# Simplification Plan: Compost & This Month Pages

**Date:** January 27, 2026
**Status:** Ready for Review
**Goal:** Reduce complexity while maintaining user value

---

## Executive Summary

After auditing the Compost (863 lines) and This Month (680 lines) pages, this document outlines specific simplification options for each. The goal is to reduce cognitive load for users while preserving the core value proposition.

---

## Part 1: Compost Page Simplification

### Current State Analysis

The Compost page is a comprehensive tracking system with:

1. **6 System Types**: hot-compost, hotbin, cold-compost, tumbler, bokashi, worm-bin
2. **Thermal Status Calculation**: Hot vs Cold based on temperature readings and activity
3. **Event Logging**: turn, water, check-temp, harvest, other (with temperature tracking)
4. **Material Input Tracking**: green/brown/other classification with quantity
5. **Pile Status Management**: active → maturing → ready → applied
6. **Care Tips System**: Per-system-type tips with turning frequency, ideal temps
7. **Stats Dashboard**: Counts by status

**Lines of Code:** 863
**Components:** 3 dialogs (add pile, log input, log event) + 1 confirm dialog
**State Variables:** 14 useState hooks
**External Dependencies:** useCompost hook, compost types

### User Concerns Identified

1. "Too detailed for most gardeners" - C:N ratio tracking and temperature monitoring are advanced features
2. Event logging creates overhead without clear benefit for casual users
3. Care tips are helpful but could be overwhelming

### Simplification Options

#### Option A: Minimal Compost (Recommended)

**Keep:**
- Pile name and system type
- Simple status (active/ready/applied)
- Basic "Add Material" logging (just material name, no green/brown classification)

**Remove:**
- Thermal status calculation and display
- Temperature tracking
- Green/brown/other input classification
- Event logging (turn, water, check-temp)
- Care tips section
- Timeline and age display
- Stats dashboard

**Result:** ~200-250 lines, focused on "Do I have compost? Is it ready?"

**Implementation:**
```
Before: "Your compost is 45 days old, thermal status HOT, last turned 3 days ago"
After: "Compost Pile 1: Ready to use" or "Compost Pile 1: Still cooking"
```

#### Option B: Simplified but Educational

**Keep:**
- Pile name and system type
- Status management (active/maturing/ready/applied)
- Care tips (collapsed by default)
- Basic material logging

**Remove:**
- Thermal status calculation
- Temperature tracking
- Green/brown classification
- Event logging
- Stats dashboard

**Result:** ~350-400 lines, maintains educational value without overhead

#### Option C: Hide for Phase 2+

**Action:** Remove from "More" menu entirely, re-evaluate after Phase 1 launch

**Rationale:**
- Compost tracking may not be a core user need
- Let Phase 1 metrics determine if users request this feature
- Focus development energy on core features

### Recommendation

**Option C (Hide for Phase 2+)** is recommended for Phase 1 launch:

1. Most users don't need detailed compost tracking
2. The feature adds cognitive load without clear value validation
3. If users request it, we can bring it back with Option A or B
4. Allows us to focus on polishing core features

If hiding is not acceptable, **Option A (Minimal Compost)** provides the simplest viable version.

---

## Part 2: This Month Page Simplification

### Current State Analysis

The This Month page provides seasonal guidance with:

1. **Month Selector**: 12-month navigation
2. **Month Overview**: Emoji, description, weather expectations
3. **Generic Tasks Grid**:
   - What to Sow (indoors/outdoors)
   - Plant Out
   - Ready to Harvest
   - Key Tasks
4. **Personalized Section** (if user has plantings):
   - Planting count and area count
   - Ready to harvest predictions
   - Calendar view with UnifiedCalendar
5. **Tree & Perennial Maintenance**: Personalized and generic tasks
6. **Expert Tips**: Composting, Crop Rotation, Companions, Organic
7. **Weather & Tip Callouts**
8. **AI Advisor CTA**

**Lines of Code:** 680
**Components:** 6 sub-components (MonthButton, TaskList, TipCard, PersonalizedPlanting, MaintenanceCard, main page)
**External Dependencies:** useAllotment, scotland-calendar data

### User Concerns Identified

1. "Overly detailed calendar view" - Users may not need full 12-month navigation
2. Information density is high - many sections compete for attention
3. Unclear primary action - what should users DO on this page?

### Simplification Options

#### Option A: Focus on Current Month + Actions

**Keep:**
- Current month auto-focus (already implemented)
- Generic tasks grid (sow, plant, harvest, key tasks)
- Personalized "Your Garden This Month" section
- Weather expectations

**Remove:**
- Expert Tips section (composting, rotation, companions, organic)
- Tree & Perennial generic maintenance (keep personalized only)
- Soil Care featured section
- AI Advisor CTA (redundant - accessible via nav)

**Result:** ~450-500 lines, focused on "what to do this month"

#### Option B: Weekly Focus View

**Transform the page to answer "What should I do THIS WEEK?"**

**Keep:**
- Single week view (current week of the month)
- Top 3-5 priority tasks
- Personalized harvest alerts

**Remove:**
- Month selector (or minimize to current/next month only)
- Expert tips
- Generic task lists
- Tree/perennial section

**Result:** ~250-300 lines, extremely focused

#### Option C: Keep Current but Improve Hierarchy

**Keep everything but reorganize:**

1. Move "Your Garden This Month" to TOP (personalization first)
2. Collapse "Expert Tips" by default
3. Collapse "All Trees & Perennials Care" by default
4. Keep Month selector but highlight current month more prominently

**Result:** Same code, better UX through visual hierarchy

### Recommendation

**Option C (Keep but Improve Hierarchy)** is recommended:

1. The page actually provides good value - the issue is presentation, not content
2. Personalization should be prominent for users with data
3. Generic content (expert tips, tree care) should be secondary/collapsed
4. Month selector is useful for planning ahead

**Specific Changes:**
1. Move personalized section to the very top
2. Add "Show More" collapsed sections for Expert Tips and generic Tree Care
3. Simplify the header - remove the generic subtitle
4. Consider removing the AI CTA (redundant with navigation)

---

## Implementation Priority

### Immediate (Pre-Phase 1)

1. **Delete plan-history folder** ✅ Done
2. **Compost page decision**: Hide for Phase 2+ OR implement Option A
3. **This Month page**: Implement Option C (hierarchy improvements)

### Phase 1 Launch

4. Monitor metrics:
   - Do users visit This Month page?
   - Do users request Compost functionality?
   - What actions do users take on This Month?

### Post-Phase 1

5. Bring back Compost (simplified) if users request it
6. Further optimize This Month based on usage data

---

## Files Affected

### If Hiding Compost (Option C):

1. `src/components/Navigation.tsx` - Remove from moreLinks
2. `src/app/compost/page.tsx` - Could delete or keep for future
3. `src/hooks/useCompost.ts` - Keep for future
4. `src/types/compost.ts` - Keep for future

### If Simplifying Compost (Option A):

1. `src/app/compost/page.tsx` - Major rewrite (~600 lines removed)
2. `src/hooks/useCompost.ts` - Simplify
3. `src/types/compost.ts` - Remove unused types

### This Month Hierarchy Changes (Option C):

1. `src/app/this-month/page.tsx` - Reorder sections, add collapse states
2. No type/hook changes needed

---

## Decision Required

Before proceeding, please confirm:

1. **Compost page**:
   - [ ] Option A: Minimal (keep basic tracking)
   - [ ] Option B: Educational (simplified but with tips)
   - [ ] Option C: Hide for Phase 2+ (recommended)

2. **This Month page**:
   - [ ] Option A: Focus on actions (remove expert tips)
   - [ ] Option B: Weekly view (major redesign)
   - [ ] Option C: Improve hierarchy (recommended)

---

**Status:** Ready for decision
**Next Step:** Implement approved simplifications
