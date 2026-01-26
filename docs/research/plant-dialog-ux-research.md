# Plant Dialog UX Research

**Date:** 2026-01-26
**Status:** Research Complete
**Author:** Claude (Research Agent)

## Overview

This research investigates how to implement plant dialogs that open when users click on a plant in the allotment area. The dialog should display plant information and allow editing of sow date, planting date, harvest date, and notes.

---

## 1. Competitor Analysis

### 1.1 Planter App
**Website:** [planter.garden](https://planter.garden)

**Plant Detail Features:**
- Companion and combative plant information displayed with green/red visual indicators
- Planting calendar showing when to start seeds or transplant
- Drag-and-drop interface with real-time companion warnings
- "Seed Box" section for tracking seed inventory
- Per-plant notes for tracking planting dates and observations
- Information on 100+ fruits and vegetables with thousands of varieties

**Key UX Pattern:** Grid layout shows compatibility warnings in real-time when placing plants. Users can add notes to each plant to track when they planted, along with plant info.

### 1.2 Gardenize App
**Website:** [gardenize.com](https://gardenize.com)

**Plant Detail Features:**
- Flexible "Event" function for logging all gardening activities
- Custom "activity types" linked to plants and areas
- Photo and notes for each entry
- Historic overview of garden activities
- Smart filtering to see what was done and when
- Drawing tool to annotate images

**Key UX Pattern:** Event-based logging where users create entries linked to plants. Each plant has a timeline of activities with photos.

**User Feedback:** "The UI for selecting the date planted isn't very intuitive" - suggests auto-populating plant/location details when creating events from a plant's page.

### 1.3 GrowVeg Garden Planner
**Website:** [growveg.com](https://www.growveg.com/)

**Plant Detail Features:**
- 5-year crop rotation tracking
- Succession planting schedules
- Email reminders for optimal planting times
- Personalized planting calendar based on location

### 1.4 From Seed to Spoon
**Website:** [seedtospoon.net](https://www.seedtospoon.net/)

**Plant Detail Features:**
- Notes and photos attached to specific plants or entire garden
- Personalized planting dates
- Harvest date tracking
- AI-powered chatbot for plant questions
- Progress tracking with photo logs

### 1.5 Old Farmer's Almanac Garden Planner

**2025 Updates:**
- Send items to back/front of layer
- Lock items to prevent accidental moves
- Searchable "Garden Guru" with bookmarks
- Beautiful new plant icons
- Multi-sown plant icons (clumps of onions)
- Updated Grow Guides

---

## 2. UX Best Practices for Plant Dialogs

### 2.1 Bottom Sheet Pattern (Recommended for Mobile)

**Source:** [NN/Group - Bottom Sheets Definition](https://www.nngroup.com/articles/bottom-sheet/)

**Key Benefits:**
- Provides more space than traditional dialogs (snaps to 3/4 screen edges)
- Preserves visibility of underlying information
- Feels native on mobile devices
- 25-30% higher engagement rates than traditional modals

**Design Requirements:**
1. **Support back button dismissal** - Allow standard OS navigation
2. **Include visible close button** - Don't rely solely on grab handles (swipe ambiguity)
3. **Never stack multiple sheets** - Creates confusion
4. **Use for short interactions only** - Not complex multi-step forms

**Accessibility:**
- Close buttons enable keyboard and screen reader access
- Swiping gestures are unreliable for users with dexterity limitations
- Avoid undiscoverable gestures as sole dismissal method

### 2.2 Inline Editing vs Modal Pattern

**Source:** [PatternFly Inline Edit Guidelines](https://www.patternfly.org/components/inline-edit/)

**Use Inline Editing When:**
- Making small edits to specific fields
- User needs to maintain context with surrounding data
- Editing is a simple, single-field operation

**Use Modal/Dialog When:**
- Multiple fields need editing together
- User needs stark contrast between view/edit modes
- Complex interactions or forms are involved
- Data needs validation before saving

**Mobile Consideration:** Save buttons should be at bottom of screen (fixed/floating) rather than top navigation bar for better reachability on larger devices.

### 2.3 Click-to-Edit Pattern

**Best Practice:** Tap on an item → expand details → edit inline or show bottom sheet

**Key Principles:**
1. **Minimize steps** to complete tasks
2. **Provide feedback** through animations and micro-interactions
3. **Grid/list pattern:** Tap item to view details, action buttons for editing

---

## 3. Current Codebase Analysis

### 3.1 Existing Dialog Components

**`src/components/ui/Dialog.tsx`:**
- Already supports `variant="bottom-sheet"` for mobile
- Slides up from bottom on screens < 768px
- iOS safe area support, drag handle affordance
- Focus trap, keyboard navigation, ARIA support
- Respects `prefers-reduced-motion`

**`src/components/garden-planner/PlantSelectionDialog.tsx`:**
- Full-content dialog with search and category filters
- Grid layout for plant selection
- Companion planting indicators
- AI assistant integration

**`src/components/seeds/VarietyEditDialog.tsx`:**
- Form-based editing dialog
- Plant selection combobox
- Notes textarea
- Per-year seed status tracking
- Add/Edit modes

### 3.2 Current Planting Card (`PlantingCard.tsx`)

**Current Features:**
- Displays plant name, variety, phase badge
- Sow date and expected harvest dates
- Care requirements (water, sun)
- Companion status warnings
- Success rating dropdown
- Delete button with confirmation
- Lifecycle action buttons (Mark as Sown, Transplanted, Harvest)

**Missing Features:**
- Cannot edit sow date after creation
- Cannot edit transplant date
- Cannot add/edit harvest dates manually
- Cannot edit notes after creation
- No tap-to-open detail dialog

### 3.3 Planting Data Model

**`src/types/unified-allotment.ts` - Planting Type:**
```typescript
interface Planting {
  id: string
  plantId: string
  varietyName?: string

  // Sowing information
  sowDate?: string           // Editable: when seeds were sown
  sowMethod?: SowMethod      // Editable: indoor/outdoor/transplant
  transplantDate?: string    // Editable: when planted out

  // Calculated harvest window
  expectedHarvestStart?: string
  expectedHarvestEnd?: string

  // Actual harvest tracking
  actualHarvestStart?: string   // Editable: when harvest started
  actualHarvestEnd?: string     // Editable: when harvest finished
  harvestNotes?: string         // Editable: notes about harvest

  // Outcome tracking
  success?: PlantingSuccess     // Already editable via dropdown
  notes?: string                // Editable: free-form notes

  quantity?: number
  status?: PlantingStatus       // planned/active/harvested/removed
}
```

### 3.4 Accessibility Requirements (from ADR-015)

- Touch targets: minimum 44x44px
- Semantic buttons with proper focus rings
- Keyboard navigation support
- Screen reader announcements
- Bottom sheet variant for mobile dialogs

---

## 4. Recommended Implementation

### 4.1 Dialog Structure

**Recommended Approach:** Bottom sheet dialog with tabbed sections

```
┌─────────────────────────────────────┐
│ ─── (drag handle)                   │
├─────────────────────────────────────┤
│ 🥕 Carrot                     [X]   │
│ Nantes 2 Variety                    │
├─────────────────────────────────────┤
│ [Info] [Dates] [Notes]              │  ← Tabs
├─────────────────────────────────────┤
│                                     │
│  Content varies by selected tab     │
│                                     │
├─────────────────────────────────────┤
│         [Delete Planting]           │
└─────────────────────────────────────┘
```

### 4.2 Tab Content

**Tab 1: Info (Read-only)**
- Plant details from vegetable database
- Care requirements (water, sun, spacing)
- Companion plant info
- Current lifecycle phase
- Days to harvest

**Tab 2: Dates (Editable)**
- Sow date picker
- Sow method selector
- Transplant date picker (if indoor)
- Expected harvest display (calculated)
- Actual harvest start date
- Actual harvest end date
- Success rating

**Tab 3: Notes (Editable)**
- Notes textarea
- Harvest notes textarea
- Photo attachments (future enhancement)

### 4.3 Interaction Pattern

1. **Tap on planting** in allotment grid/bed view
2. **Bottom sheet slides up** with plant details
3. **Default to Info tab** for quick reference
4. **Switch to Dates tab** to edit timing
5. **Switch to Notes tab** to add observations
6. **Changes auto-save** on field blur (with debounce)
7. **Swipe down or tap X** to dismiss

### 4.4 Alternative: Single-Page Layout

For simpler implementation, use a single scrollable layout:

```
┌─────────────────────────────────────┐
│ ─── (drag handle)                   │
├─────────────────────────────────────┤
│ 🥕 Carrot - Nantes 2          [X]   │
│ Phase: Growing                      │
├─────────────────────────────────────┤
│ PLANT INFO                          │
│ • Water: Moderate                   │
│ • Sun: Full sun                     │
│ • Companions: Onion, Leek           │
├─────────────────────────────────────┤
│ DATES                               │
│ Sow Date      [2026-03-15    ]      │
│ Sow Method    [Indoor        v]     │
│ Transplant    [2026-04-20    ]      │
│ Expected      Jun 15 - Jul 30       │
│ Harvest Start [              ]      │
│ Harvest End   [              ]      │
├─────────────────────────────────────┤
│ SUCCESS                             │
│ [Excellent] [Good] [Fair] [Poor]    │
├─────────────────────────────────────┤
│ NOTES                               │
│ ┌──────────────────────────────┐    │
│ │ Sowed in modules, good       │    │
│ │ germination rate...          │    │
│ └──────────────────────────────┘    │
├─────────────────────────────────────┤
│       [Delete Planting]             │
└─────────────────────────────────────┘
```

**Recommendation:** Start with single-page layout for MVP, add tabs if complexity grows.

### 4.5 Component Structure

```
src/components/allotment/
├── PlantingDetailDialog.tsx      ← New: Main dialog component
├── PlantingInfoSection.tsx       ← New: Read-only plant info
├── PlantingDatesForm.tsx         ← New: Date editing form
├── PlantingNotesForm.tsx         ← New: Notes editing
└── PlantingCard.tsx              ← Update: Add onClick handler
```

### 4.6 Key Implementation Details

**Opening the Dialog:**
```tsx
// In PlantingCard.tsx or parent component
const [selectedPlanting, setSelectedPlanting] = useState<Planting | null>(null)

<PlantingCard
  planting={planting}
  onClick={() => setSelectedPlanting(planting)}
  // ... other props
/>

<PlantingDetailDialog
  planting={selectedPlanting}
  isOpen={!!selectedPlanting}
  onClose={() => setSelectedPlanting(null)}
  onUpdate={(updates) => updatePlanting(areaId, selectedPlanting.id, updates)}
  onDelete={() => removePlanting(areaId, selectedPlanting.id)}
/>
```

**Auto-save Pattern:**
```tsx
// Debounced update on field change
const handleFieldChange = useDebouncedCallback(
  (field: keyof PlantingUpdate, value: string) => {
    onUpdate({ [field]: value || undefined })
  },
  500
)
```

---

## 5. Accessibility Checklist

- [ ] Dialog uses `role="dialog"` with `aria-modal="true"`
- [ ] Title linked via `aria-labelledby`
- [ ] Close button has `aria-label="Close dialog"`
- [ ] Focus trapped within dialog when open
- [ ] Escape key closes dialog
- [ ] Focus returns to trigger element on close
- [ ] Form inputs have associated labels
- [ ] Date pickers are keyboard accessible
- [ ] Touch targets meet 44x44px minimum
- [ ] Color is not sole indicator (use icons/text)

---

## 6. Future Enhancements

Based on competitor analysis:

1. **Photo attachments** - Add photos to notes (like Gardenize)
2. **Event timeline** - Show history of all changes to the planting
3. **Drawing annotations** - Mark up photos (like Gardenize)
4. **AI integration** - "Ask Aitor about this plant" button
5. **Quick actions** - Water reminder, pest alert shortcuts
6. **Comparison view** - Compare with same plant in previous years

---

## 7. Sources

### Competitor Apps
- [Planter App](https://planter.garden)
- [Gardenize](https://gardenize.com)
- [GrowVeg](https://www.growveg.com/)
- [From Seed to Spoon](https://www.seedtospoon.net/)
- [Old Farmer's Almanac Garden Planner](https://gardenplanner.almanac.com/)

### UX Resources
- [NN/Group - Bottom Sheets Definition and Guidelines](https://www.nngroup.com/articles/bottom-sheet/)
- [Material Design 3 - Bottom Sheets](https://m3.material.io/components/bottom-sheets/guidelines)
- [LogRocket - Bottom Sheets Optimized UX](https://blog.logrocket.com/ux-design/bottom-sheets-optimized-ux/)
- [LogRocket - Sheets vs Dialogs vs Snackbars](https://blog.logrocket.com/ux-design/sheets-dialogs-snackbars/)
- [PatternFly - Inline Edit Guidelines](https://www.patternfly.org/components/inline-edit/design-guidelines/)
- [Mobbin - Bottom Sheet Examples](https://mobbin.com/glossary/bottom-sheet)
- [Mobile Patterns - Detail Views](https://www.mobile-patterns.com/detail-views)

### Internal Documentation
- `docs/adrs/015-accessibility-patterns.md` - Mobile & Accessibility Patterns
- `src/components/ui/Dialog.tsx` - Existing dialog implementation
- `src/types/unified-allotment.ts` - Planting data model
