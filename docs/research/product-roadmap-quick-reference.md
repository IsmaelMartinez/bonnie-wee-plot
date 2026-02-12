# Product Roadmap - Quick Reference

**Status:** Steps 1-3 Complete — App ready for user testing
**Last Updated:** February 2026

---

## Background

This document originally described a progressive disclosure strategy where features were hidden behind unlock conditions. That system was implemented and later removed (PR #163) as it was confusing and interfered with testing. All features are now directly accessible in the navigation.

The valuable part of this document is the UX review checklist below, which remains relevant for ongoing polish work.

---

## Production Preparation Steps

### Step 1: Plant Dialog UX Implementation (COMPLETE)

Completed in PR #68 and #69 (January 27, 2026). Bottom sheet dialog pattern for mobile-first UX, full inline editing of planting information, sow method selection, harvest date tracking, companion planting visibility, plant care information display, delete with confirmation, and full accessibility support.

### Step 2: Section-by-Section UX Review (COMPLETE)

Completed across PRs #151, #153, #167, #169, #171, #180-188. Each section reviewed individually and then for cross-section integration. Below is the original checklist (kept as reference for future reviews).

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
**Intra-section integration:** Grid selection -> Detail panel -> Planting cards -> Detail dialog flow

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
**Intra-section integration:** Token setup -> Chat flow -> Tool confirmations -> Data modifications

#### 2.7 Settings
**Components:** DataManagement (export/import/clear), ShareDialog, storage stats
**Key Questions:**
- Is export/import discoverable?
- Is the share flow (QR code, 6-digit code) intuitive?
- What else belongs here (preferences, about, help)?
- Should "About" page content move here?
**Intra-section integration:** Data management vs sharing vs app info

#### 2.8 Shared UI Components
**Components:** Dialog, SaveIndicator, Toast, StorageWarningBanner, InstallPrompt, OfflineIndicator
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

### Step 3: Cross-Section Integration Review (COMPLETE)

Completed in PRs #180-188. User journeys tested and cross-section navigation links added.

#### User Journeys to Test
- "Plan a new bed" -> Allotment -> Add area -> Add plantings -> See in Today
- "Track a harvest" -> Allotment -> Select planting -> Log harvest -> See totals
- "Check what to do" -> Today -> See tasks -> Navigate to relevant section
- "Add seeds I bought" -> Seeds -> Add variety -> Mark as "have" -> See in Allotment when planting
- "Share with family" -> Settings -> Share -> Receive on other device -> Verify data
- "Ask for help" -> AI Advisor -> Ask question -> Confirm tool call -> See change in Allotment

#### Integration Questions
- Is terminology consistent across sections (variety vs seed, area vs bed)?
- Do navigation patterns match expectations (back buttons, breadcrumbs)?
- Is data shown consistently (same planting looks same everywhere)?
- Are empty states helpful and guide to next action?

**Goal:** Ship a polished, coherent experience.

---

## Related Documentation

- **ADR-020: Planting Detail Dialog** (`docs/adrs/020-planting-detail-dialog.md`) - Architecture decision record documenting the bottom sheet dialog pattern and UI decisions
- **AI Inventory Function Calling** (`docs/adrs/022-ai-inventory-function-calling.md`) - ADR documenting the AI tool calling architecture (fully implemented)

---

**Status:** All Steps Complete | Ready for User Testing
**Next:** Gather user feedback to inform future development priorities
