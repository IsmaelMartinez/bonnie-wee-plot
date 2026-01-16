# ADR 016: Accessibility Patterns for Interactive Components

## Status
Accepted

## Date
2026-01-16

## Context

The Community Allotment application had significant accessibility barriers identified during the pre-production strategic plan review. The AllotmentGrid component was described as "div soup" with no keyboard navigation, making core functionality inaccessible to screen reader users. Phase 4 of the strategic plan required implementing critical accessibility fixes across grid components, forms, and the chat interface.

Key issues identified included non-semantic HTML (clickable divs instead of buttons), missing ARIA attributes, no keyboard navigation, and no way for screen readers to understand interactive content.

## Decision

We adopted a consistent set of accessibility patterns across all interactive components in the application. These patterns draw from WAI-ARIA Authoring Practices and focus on practical implementation for React components.

### Pattern 1: Semantic Buttons for Interactive Elements

All clickable elements are now semantic `<button>` elements instead of divs with click handlers. Buttons provide built-in keyboard support (Enter and Space activation), proper focus management, and correct role announcement to screen readers.

Implementation includes focus ring styling (`focus:ring-2 focus:ring-offset-2 focus:ring-green-500`), minimum touch targets (`min-h-[44px] min-w-[44px]`), and aria-label for buttons without visible text.

### Pattern 2: ARIA Grid Pattern for Complex Layouts

The AllotmentGrid implements the ARIA grid pattern with `role="grid"` on the container, `role="gridcell"` on each cell wrapper, and keyboard navigation via arrow keys, Home, and End.

Each grid item includes a descriptive aria-label with the item name, planting count, selection state, and available keyboard shortcuts. We use `aria-pressed` (not `aria-selected`) for toggle buttons within grid cells, as `aria-selected` is only valid for option/tab roles.

Roving tabindex pattern ensures only one item is focusable at a time (`tabIndex={index === focusedIndex ? 0 : -1}`), allowing arrow keys to manage navigation within the grid.

### Pattern 3: Keyboard Repositioning Alternative

Drag-and-drop operations are inaccessible to keyboard users. We implemented a keyboard alternative where pressing "M" on a focused grid item enters reposition mode (when editing is enabled). In reposition mode, arrow keys move the item one grid unit at a time and Enter or Escape confirms the new position.

Visual feedback includes a blue ring and a reposition indicator icon. Screen readers receive announcements via `aria-live="assertive"` when entering and exiting reposition mode.

### Pattern 4: Live Regions for Dynamic Content

Chat interfaces use `role="log"` with `aria-live="polite"` and `aria-relevant="additions"` to announce new messages without interrupting the user. Loading states use `role="status"` with screen reader-only text describing what is happening.

### Pattern 5: Form Accessibility

Form inputs include `aria-describedby` linking to help text and error messages. The token input in TokenSettings references both the help text and privacy notice, ensuring screen reader users receive complete context.

Toggle buttons (like show/hide password) use `aria-pressed` state and descriptive aria-labels that change based on current state.

### Pattern 6: Section Structure with aria-labelledby

Grouped content uses semantic `<section>` elements with headings linked via `aria-labelledby`. The AllotmentMobileView groups areas by type (rotation beds, trees, etc.), with each section having a proper heading that labels the group for screen readers.

Lists of items use `<ul>` with `role="list"` and `<li>` elements for proper list semantics.

## Consequences

### Positive
- Screen reader users can now navigate and interact with the allotment grid
- Keyboard users have full access to all interactive functionality including repositioning
- Chat messages are announced automatically without manual refresh
- Form inputs provide complete context through linked descriptions
- Mobile touch targets meet the 44x44px minimum accessibility guideline

### Negative
- Additional complexity in component state management (focus index, reposition mode)
- Performance consideration: aria-live can cause layout thrashing if overused
- Increased testing surface area for keyboard interactions

### Neutral
- Some visual styling adjustments needed for focus indicators
- Documentation and developer training required for maintaining patterns

## Implementation Files

The following files were modified to implement these accessibility patterns:

- `/src/components/allotment/AllotmentGrid.tsx` - Grid pattern, keyboard navigation, reposition mode
- `/src/components/allotment/AllotmentMobileView.tsx` - Section structure, list semantics, buttons
- `/src/app/ai-advisor/page.tsx` - Live region for chat messages
- `/src/components/ai-advisor/ChatMessage.tsx` - Message article structure, role labels
- `/src/components/ai-advisor/TokenSettings.tsx` - Form accessibility, aria-describedby

## Testing

Accessibility should be tested using:
- Keyboard-only navigation (Tab, Arrow keys, Enter, Escape)
- Screen reader (VoiceOver on macOS, NVDA on Windows)
- Browser accessibility inspector (Chrome DevTools Accessibility tab)
- Automated testing with axe-core (recommended for CI)

## References

- [WAI-ARIA Authoring Practices - Grid Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)
- [MDN Web Docs - ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [WebAIM - Keyboard Accessibility](https://webaim.org/techniques/keyboard/)
- [Inclusive Components - Toggle Buttons](https://inclusive-components.design/toggle-button/)
