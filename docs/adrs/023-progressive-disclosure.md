# ADR 023: Progressive Feature Disclosure

## Status
Accepted

## Date
2026-01-28

## Context

New users faced a complex interface with many features (AI Advisor, Compost tracking, Allotment layout editor) that could be overwhelming before they understood the core value proposition.

## Decision

Implement progressive disclosure: start users with 3 primary navigation items (Today, This Month, Seeds) and unlock additional features based on engagement.

### Unlock Conditions

- **AI Advisor**: 3 visits OR 1 planting OR manual unlock
- **Compost**: 5 visits OR 1 harvest recorded OR manual unlock
- **Allotment Layout**: 5 plantings OR manual unlock

### Key Components

- `src/lib/feature-flags.ts` - Unlock logic and engagement tracking
- `src/hooks/useFeatureFlags.ts` - React hook with celebration detection
- `src/components/ui/UnlockCelebration.tsx` - Educational unlock modals
- Navigation shows locked features with progress bars and "Unlock now" CTAs

### Design Principles

1. **Low thresholds**: Features unlock quickly with normal usage
2. **Manual override**: Users can always click "Unlock now" to skip waiting
3. **Educational, not gamified**: Celebration modals explain features, not achievements
4. **Visible progress**: Users see how close they are to unlocking

## Consequences

### Positive
- Simpler first experience for new users
- Features revealed when contextually relevant
- Experienced users can unlock everything immediately

### Negative
- Extra state management for engagement tracking
- Potential confusion if users don't notice the More menu

## Related
- ADR 022: AI Inventory Function Calling
- PR #91: Onboarding wizard
- PR #92: Feature flags and unlock system
