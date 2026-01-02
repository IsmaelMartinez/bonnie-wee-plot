# Slider AI Panel Investigation

## 1. Executive Summary

This document investigates replacing the current standalone AI advisor page (`/ai-advisor`) with a slide-out panel accessible from any page, similar to patterns used in Cursor, Codeium, GitHub Copilot Chat, and other AI-assisted tools.

### Key Insight

The current full-page AI advisor creates context-switching friction. When a user is planning a bed and wants AI suggestions, they must navigate away from the allotment page, losing their planning context. A slider panel would allow contextual AI assistance without leaving the current workflow.

### Recommendation

Investigate implementing a slide-out panel that:
- Is accessible via a persistent button/icon on all pages
- Receives context from the current page (selected bed, plantings, rotation state)
- Allows quick questions without full navigation
- Can be dismissed to return to the exact state user left

---

## 2. Problem Statement

### Current State
- AI advisor "Aitor" lives at `/ai-advisor` as a dedicated page
- User must navigate away from allotment/seeds pages to ask questions
- Context is passed via `allotmentContext` string built on the AI page
- Rate limiting and API key management are page-specific

### Pain Points
1. Context switching breaks planning flow
2. User loses visual context of their beds/plantings when asking questions
3. Cannot reference what they're looking at while chatting
4. Full page reload required to return to planning

### Desired State
- Slide-out panel accessible from any page via icon or keyboard shortcut
- Panel overlays current page (doesn't navigate away)
- Context automatically injected based on current page state
- Dismissable to return to exact workflow state

---

## 3. Reference Implementations

### 3.1 Cursor IDE
- Right panel slides in from edge
- Receives file/selection context automatically
- Can reference code being viewed
- Cmd+L to toggle

### 3.2 GitHub Copilot Chat
- Side panel in VS Code
- Context includes open file, selection, workspace
- Persists across file navigation

### 3.3 Codeium
- Inline suggestions + chat panel hybrid
- Panel can be docked or floating
- Keyboard shortcut driven

### 3.4 Common Patterns
- Slide from right edge (not modal)
- Semi-transparent or solid background
- Maintains scroll position of main content
- Can be resized
- Keyboard shortcut to toggle
- Context injection from current view

---

## 4. Technical Considerations

### 4.1 Architecture Options

**Option A: Global Layout Component**
```tsx
// app/layout.tsx
<body>
  <Navigation />
  {children}
  <AitorSliderPanel />  // Always mounted, conditionally visible
</body>
```

Pros: Single instance, shared state, simple toggle
Cons: All pages must provide context interface

**Option B: Portal-based Panel**
```tsx
// components/ai-advisor/AitorPanel.tsx
// Rendered via React Portal to body
// Each page mounts with own context
```

Pros: Context naturally scoped to page
Cons: Multiple instances possible, state management complexity

**Option C: Context Provider + Panel**
```tsx
// providers/AitorPanelProvider.tsx
// Provides: openPanel(context), closePanel(), isOpen
// Panel component subscribes to context
```

Pros: Clean separation, explicit context passing
Cons: More boilerplate

### 4.2 Context Injection

Current `allotmentContext` building (ai-advisor/page.tsx:70-120) would need to be:
1. Extracted to a shared utility
2. Made page-agnostic (handle allotment, seeds, this-month contexts)
3. Called when panel opens with current page state

```typescript
interface PanelContext {
  page: 'allotment' | 'seeds' | 'this-month' | 'other'
  allotmentData?: AllotmentData
  selectedBed?: PhysicalBedId
  selectedYear?: number
  varietyData?: VarietyData
  // ... other page-specific context
}
```

### 4.3 State Persistence

- Chat history: Should persist across panel open/close within session
- API key: Already in sessionStorage (works)
- Rate limiting: Already global (works)
- Panel open state: Session-only or persist preference?

### 4.4 Accessibility Considerations

- Focus trap when panel open
- Escape key to close
- Screen reader announcements
- Keyboard shortcut discoverability
- Touch gestures for mobile (swipe to close)

---

## 5. Implementation Phases

### Phase 1: Research Spike
- Build minimal slide panel component
- Test with static content
- Validate animation/transition performance
- Test on mobile viewport

### Phase 2: Context Extraction
- Extract allotmentContext builder to shared utility
- Create context interface for each page type
- Add context hooks to relevant pages

### Phase 3: Panel Integration
- Implement AitorSliderPanel component
- Wire to existing ChatInput/ChatMessage components
- Add global toggle mechanism (icon + keyboard)
- Handle mobile responsiveness

### Phase 4: Polish
- Animation refinement
- Error states
- Empty states
- Onboarding/discovery

---

## 6. Open Questions

1. **Mobile behavior**: Should panel be full-screen on mobile, or bottom sheet?
2. **Keyboard shortcut**: What's the right trigger? Cmd+Shift+A? Cmd+K?
3. **Multi-page context**: Can panel maintain conversation when user navigates between pages?
4. **Offline handling**: What happens if API unavailable mid-conversation?
5. **Token management**: Should panel have its own settings, or link to existing settings page?

---

## 7. Dependencies

- No new libraries required (can use Tailwind for animations)
- May benefit from Headless UI Dialog/Transition for accessibility
- Existing ChatInput, ChatMessage, LocationStatus components can be reused

---

## 8. Risks

1. **Performance**: Panel always mounted may impact bundle size
2. **Context complexity**: Different pages have different context shapes
3. **Mobile UX**: Small screens may not work well with overlay
4. **Focus management**: Complex with multiple interactive areas

---

## 9. Success Metrics

- Time to first AI interaction (should decrease)
- Context switches to AI page (should trend to zero)
- User engagement with AI features (should increase)
- Task completion with AI assistance (track if possible)

---

## 10. Next Steps

1. Create lightweight prototype with fixed content
2. User test the interaction pattern
3. If validated, proceed with full implementation
4. Consider A/B test between page and panel approaches
