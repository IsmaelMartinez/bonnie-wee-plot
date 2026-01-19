# ADR 009: Static Content Pages Pattern

## Status
Accepted

## Date
2025-01-01 (retrospective)

## Context

Several pages in the application are primarily informational:
- Companion Planting guide
- Composting guide
- Crop Rotation guide

These pages have:
- Rich content with structured data
- Minimal user interaction
- No server-side data requirements
- SEO importance

## Decision

Implement informational pages as **self-contained static pages** with data defined inline, using `'use client'` only when interactivity is needed.

### Pattern Implementation

```typescript
// src/app/companion-planting/page.tsx
'use client'

// Data defined at module level (static)
const companionPlantingPairs = [
  {
    plant: 'Tomatoes',
    companions: ['Basil', 'Marigolds', 'Carrots'],
    benefits: 'Basil improves flavor...',
    avoid: ['Fennel', 'Brassicas']
  },
  // ... more data
]

const companionPlantingPrinciples = [
  { icon: Bug, title: 'Pest Control', description: '...' },
  // ... more data
]

// Single page component renders everything
export default function CompanionPlantingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <section>...</section>
      
      {/* Principles */}
      <section>
        {companionPlantingPrinciples.map(principle => (
          <div key={principle.title}>...</div>
        ))}
      </section>
      
      {/* Plant Pairs */}
      <section>
        {companionPlantingPairs.map(pair => (
          <div key={pair.plant}>...</div>
        ))}
      </section>
      
      {/* AI CTA */}
      <section>...</section>
    </div>
  )
}
```

### Page Structure Pattern

All static content pages follow this structure:

```
1. Header
   - Icon + Title
   - Description paragraph

2. Information Sections
   - Grid of cards
   - Lists with icons
   - Data-driven content

3. Call-to-Action
   - Link to AI Advisor (Aitor)
   - Encouraging message

4. Quick Reference
   - Summary/tips box
   - Yellow/amber highlight
```

### Why `'use client'`?

Even static pages use `'use client'` because:
1. Lucide icons are client components
2. Consistent pattern across all pages
3. Potential for future interactivity

### Build Output

```
Route (app)                     Size    First Load JS
├ ○ /companion-planting        3.95 kB    110 kB
├ ○ /composting                5.5 kB     112 kB
└ ○ /crop-rotation             3.7 kB     106 kB

○ (Static) prerendered as static content
```

## Consequences

### Positive
- **Fast page loads** - Pre-rendered at build time
- **SEO friendly** - Full content in HTML
- **Simple maintenance** - Edit data, rebuild
- **No API calls** - Content embedded in bundle
- **Consistent styling** - Same patterns across pages

### Negative
- **Large page files** - Data + UI in single file
- **No CMS** - Content changes require code deploy
- **Bundle size** - Data included in JS bundle
- **No personalization** - Same content for all users

### Content Organization

| Page | Data Items | Lines of Code |
|------|------------|---------------|
| Companion Planting | 6 pairs, 4 principles, 3 seasonal tips | ~250 |
| Composting | 3 methods, 16 ingredients, 4 troubleshooting | ~450 |
| Crop Rotation | Plant families, rotation plans, soil benefits | ~300 |

### When to Extract Data

Consider moving data to external files when:
- Data exceeds ~50 items
- Multiple pages need same data
- Content editors need to update without code access
- Data needs to be fetched dynamically

### Alternative Approaches Not Taken

1. **MDX** - Could use for content-heavy pages, but adds complexity
2. **CMS** - Overkill for static gardening guides
3. **Database** - Unnecessary for read-only content
4. **API routes** - Would add latency without benefit

### Styling Consistency

All static pages use:
- Green gradient backgrounds
- White card components
- Lucide icons with consistent sizing
- Grid layouts (2-4 columns)
- AI advisor CTA section at bottom



