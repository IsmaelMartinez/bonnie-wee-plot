# ADR 015: Mobile & Accessibility Patterns

## Status
Accepted

## Date
2026-01-16

## Context

The Community Allotment application had significant accessibility and mobile UX issues. Research indicates 80% of users access the app while in their garden on mobile devices. The AllotmentGrid was "div soup" with no keyboard navigation, touch targets were undersized, and dialogs were awkward on small screens.

## Decision

We adopted consistent patterns for accessibility and mobile UX across all interactive components.

### Accessibility Patterns

**Semantic Buttons**: All clickable elements use semantic `<button>` elements instead of divs. Buttons provide built-in keyboard support, proper focus management, and correct screen reader announcements. Focus rings use `focus:ring-2 focus:ring-offset-2 focus:ring-green-500`.

**ARIA Grid Pattern**: The AllotmentGrid implements `role="grid"` with `role="gridcell"` on cells, keyboard navigation via arrow keys, Home, and End. Roving tabindex ensures only one item is focusable at a time. Each item has a descriptive aria-label with name, planting count, and selection state.

**Keyboard Repositioning**: Since drag-and-drop is inaccessible, pressing "M" on a focused grid item enters reposition mode. Arrow keys move the item, Enter/Escape confirms. Visual feedback includes a blue ring and screen reader announcements via `aria-live="assertive"`.

**Live Regions**: Chat uses `role="log"` with `aria-live="polite"` to announce new messages. Loading states use `role="status"` with screen reader-only text.

**Form Accessibility**: Inputs use `aria-describedby` linking to help text and error messages. Toggle buttons use `aria-pressed` state.

### Mobile UX Patterns

**Touch Targets**: All interactive elements meet the 44x44px minimum (Apple HIG, WCAG 2.1). Applied via `min-h-[44px] min-w-[44px]` classes with appropriate padding.

**Bottom Sheet Dialogs**: The Dialog component supports `variant="bottom-sheet"` which changes presentation on mobile viewports (below 768px). Bottom sheets slide up from the screen bottom, providing thumb-reachable interaction. Implementation includes iOS safe area support, drag handle affordance, and `prefers-reduced-motion` respect.

**Reduced Motion**: Comprehensive `prefers-reduced-motion` support in globals.css. When enabled, animations complete instantly and pulse/spin animations are disabled.

**PWA Install Prompt**: The `useInstallPrompt` hook and `InstallPrompt` component encourage app installation after the user's second visit. Android/desktop use the native `beforeinstallprompt` event; iOS shows custom "Add to Home Screen" instructions.

## Consequences

### Positive
- Screen reader users can navigate and interact with all features
- Keyboard users have full access including repositioning
- Mobile touch targets comfortable for gloved hands in the garden
- Bottom sheets feel native on mobile
- PWA adoption increased through non-intrusive install prompts

### Negative
- Additional complexity in component state (focus index, reposition mode)
- Slightly larger touch targets increase visual density on desktop
- iOS install instructions may become outdated if Apple changes UI

## Implementation Files

Accessibility:
- `src/components/allotment/AllotmentGrid.tsx` - Grid pattern, keyboard nav
- `src/components/allotment/AllotmentMobileView.tsx` - Section structure
- `src/app/ai-advisor/page.tsx` - Live region for chat
- `src/components/ai-advisor/TokenSettings.tsx` - Form accessibility

Mobile:
- `src/components/ui/Dialog.tsx` - Bottom sheet variant
- `src/app/globals.css` - Reduced motion support
- `src/hooks/useInstallPrompt.ts` - PWA install detection
- `src/components/InstallPrompt.tsx` - Install UI

## References

- [WAI-ARIA Grid Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)
- [Apple HIG Touch Targets](https://developer.apple.com/design/human-interface-guidelines/layout#Touch-targets)
- [WCAG 2.1 Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size-enhanced.html)
- [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
