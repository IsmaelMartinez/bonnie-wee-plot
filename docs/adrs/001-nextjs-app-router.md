# ADR 001: Use Next.js App Router Architecture

## Status
Accepted

## Date
2025-01-01 (retrospective)

## Context

The Bonnie Wee Plot application needed a modern web framework that could support:
- Server-side rendering for SEO and initial page load performance
- API routes for backend functionality
- File-based routing for simplicity
- React ecosystem compatibility
- Static generation where appropriate

## Decision

We chose **Next.js 15 with the App Router** as the application framework.

### Key Implementation Details

```
src/
├── app/                    # App Router directory
│   ├── layout.tsx         # Root layout with Navigation
│   ├── page.tsx           # Home page
│   ├── globals.css        # Global styles
│   ├── ai-advisor/
│   │   └── page.tsx
│   ├── companion-planting/
│   │   └── page.tsx
│   ├── composting/
│   │   └── page.tsx
│   ├── crop-rotation/
│   │   └── page.tsx
│   ├── garden-planner/
│   │   └── page.tsx
│   └── api/               # API Route Handlers
│       └── ai-advisor/
```

### Pattern Usage

1. **Client Components**: Most pages use `'use client'` directive for interactivity
2. **API Routes**: Server-side logic in `route.ts` files using Route Handlers
3. **Layouts**: Shared navigation via root `layout.tsx`
4. **Static Generation**: Information pages (composting, companion-planting) are statically generated

## Consequences

### Positive
- **File-based routing** simplifies navigation structure
- **Built-in API routes** eliminate need for separate backend
- **React Server Components** available for future optimization
- **Automatic code splitting** improves performance
- **TypeScript support** out of the box
- **Hot Module Replacement** speeds up development

### Negative
- **Learning curve** for developers unfamiliar with App Router
- **`'use client'` directive** required for most interactive pages
- **Complexity** of understanding server vs client component boundaries

### Neutral
- Locked into Next.js ecosystem and Vercel deployment patterns
- Need to stay updated with Next.js releases (currently on v15)

## References

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)



