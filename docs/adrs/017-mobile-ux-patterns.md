# ADR 017: Mobile UX Enhancement Patterns

## Status
Accepted

## Date
2026-01-16

## Context

Research indicates that 80% of Community Allotment users access the application while physically in their garden, typically on mobile devices. The existing interface, while functional, had several mobile UX issues that made garden-side usage frustrating. Key problems included undersized touch targets, dialogs that were awkward on small screens, and no guidance for app installation.

This ADR documents the patterns adopted during Phase 5 (Mobile UX Enhancement) to address these issues systematically.

## Decision

We adopted four complementary mobile UX patterns.

### 1. Touch Target Minimum Size

All interactive elements now meet the 44x44px minimum touch target size recommended by Apple Human Interface Guidelines and WCAG 2.1 Success Criterion 2.5.5 (Target Size). This was achieved through consistent use of `min-h-[44px] min-w-[44px]` classes combined with appropriate padding.

Affected components include button delete icons on year selector badges, PlantingCard action buttons and select dropdowns, BedNotes edit and delete buttons, BedDetailPanel action buttons, Dialog close buttons, category filter buttons in PlantSelectionDialog, and AreaTypeConverter trigger button.

### 2. Bottom Sheet Dialog Variant

The Dialog component now supports a `variant="bottom-sheet"` prop that changes presentation on mobile viewports (below 768px). Bottom sheets slide up from the screen bottom, providing a more natural mobile interaction pattern that keeps content within thumb reach and works better with virtual keyboards.

Implementation details include automatic detection of mobile viewport via resize listener, slide-up animation respecting `prefers-reduced-motion`, iOS safe area support for home indicator, drag handle visual affordance, and larger touch targets in bottom sheet mode.

### 3. Reduced Motion Support

Added comprehensive `prefers-reduced-motion` media query support in globals.css. When users have reduced motion preferences enabled, all animations complete instantly and pulse/spin animations are disabled entirely. This improves accessibility for users with vestibular disorders and reduces battery consumption on mobile.

### 4. PWA Install Prompt

Created `useInstallPrompt` hook and `InstallPrompt` component to encourage app installation after meaningful engagement. The prompt appears after the user's second visit, avoiding interrupting first-time exploration.

For Android and desktop, the component captures the `beforeinstallprompt` event and triggers native install flow. For iOS, since Safari doesn't fire the `beforeinstallprompt` event, the component displays custom instructions for the "Add to Home Screen" action via Share menu.

Users can dismiss the prompt temporarily (reappears next visit) or permanently (stored in localStorage).

## Consequences

### Positive
- Garden-side mobile experience significantly improved
- Touch targets comfortable for gloved hands
- Bottom sheets feel native on mobile
- Accessible to users with motion sensitivity
- Install prompt increases PWA adoption without being intrusive

### Negative
- Slightly larger touch targets increase visual density on desktop
- Bottom sheet detection requires client-side JavaScript
- iOS install instructions may become outdated if Apple changes UI

### Neutral
- Touch target sizes follow platform conventions (iOS/Android both use 44pt minimum)
- Install prompt state persisted in localStorage alongside other preferences

## Implementation Notes

Touch target classes can be applied via `min-h-[44px] min-w-[44px]` or `p-2.5` (padding approach for icon buttons). For buttons with text, ensure total height meets 44px through line-height plus padding.

Bottom sheet variant is opt-in: pass `variant="bottom-sheet"` to Dialog component. On desktop or when variant is "modal" (default), the dialog renders as a centered modal.

## References

- [Apple HIG - Layout - Touch Targets](https://developer.apple.com/design/human-interface-guidelines/layout#Touch-targets)
- [WCAG 2.1 Target Size (Enhanced)](https://www.w3.org/WAI/WCAG21/Understanding/target-size-enhanced.html)
- [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [web.dev - Add to Home Screen](https://web.dev/learn/pwa/installation-prompt/)
