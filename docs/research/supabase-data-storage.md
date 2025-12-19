# Research: Supabase Data Storage Integration

## Status
Research / Under Consideration

## Date
2025-12-18

## Overview

This document explores adding Supabase as a backend database solution for the Community Allotment application. The primary goal is to enable persistent, cloud-based storage for garden planner data with the flexibility to expand to other data types in the future. This would replace or augment the current localStorage-based approach.

---

## Current Architecture

### How Data is Stored Today

| Feature | Storage Method | Key | Persistence |
|---------|---------------|-----|-------------|
| Garden Plans | `localStorage` | `garden-planner-data` | Until browser data cleared |
| Grid Plots & Cells | `localStorage` | Part of `garden-planner-data` | Until browser data cleared |
| Rotation History | `localStorage` | Part of `garden-planner-data` | Until browser data cleared |
| AI Chat History | React state | N/A | Until page refresh |
| API Tokens | `sessionStorage` | `aitor_api_token` | Until tab closed |

**Key Insight**: All user data lives in the browser. The application follows a no-database architecture (ADR-004), which has known limitations around cross-device sync and data durability.

### Current Data Structure

The garden planner stores the following data types:

```typescript
interface GardenPlannerData {
  version: number                    // Schema version for migrations
  currentPlanId: string | null       // Currently selected plan
  plans: GardenPlan[]                // Array of garden plans
  rotationHistory: RotationHistory[] // Crop rotation tracking
}

interface GardenPlan {
  id: string
  name: string
  description?: string
  year: number
  createdAt: string
  updatedAt: string
  vegetables: PlannedVegetable[]    // Planned vegetables with dates/status
  plots: GardenPlot[]               // Garden beds/areas (including GridPlot)
  customVegetables: Vegetable[]     // User-created vegetables
}
```

**Estimated Data Size**: ~10-100KB per user depending on garden complexity.

---

## What is Supabase?

Supabase is an open-source Backend-as-a-Service (BaaS) platform, often described as an "open-source Firebase alternative." It provides:

- **PostgreSQL Database**: A fully managed, scalable relational database
- **Authentication**: User management with email/password and social logins
- **Real-time Subscriptions**: Live data sync using PostgreSQL's LISTEN/NOTIFY
- **File Storage**: S3-compatible object storage with CDN
- **Edge Functions**: Serverless TypeScript functions
- **Row Level Security (RLS)**: Fine-grained access control at the database level

### Why Supabase Over Other Options?

| Feature | Supabase | Firebase | PlanetScale | Neon |
|---------|----------|----------|-------------|------|
| Database Type | PostgreSQL | NoSQL (Firestore) | MySQL | PostgreSQL |
| Open Source | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| Self-Hostable | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| Real-time | ✅ Built-in | ✅ Built-in | ❌ No | ❌ No |
| Auth Included | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| SQL Support | ✅ Full SQL | ❌ NoSQL queries | ✅ Full SQL | ✅ Full SQL |
| Next.js Integration | ✅ Excellent | ✅ Good | ✅ Good | ✅ Good |
| Free Tier | ✅ Generous | ✅ Generous | ✅ Limited | ✅ Generous |

**Key Advantage**: Supabase combines authentication, database, and real-time features in one platform with excellent Next.js support.

---

## Supabase Free Tier Analysis

### What's Included (Free Plan)

**Database**
- 500 MB database storage
- Unlimited API requests
- 50 MB file storage
- 1 GB bandwidth per month
- 50,000 monthly active users (auth)
- 500 Edge Function invocations/month

**Authentication**
- Email/password authentication
- Social providers (Google, GitHub, Apple, etc.)
- Magic link authentication
- Phone authentication (SMS)
- Multi-factor authentication (TOTP)

**Real-time**
- Up to 200 concurrent connections
- Unlimited messages

**Limitations (Free Tier)**
- Project paused after 1 week of inactivity
- 2 free projects maximum
- No daily backups (point-in-time recovery)
- Shared compute resources
- Community support only

### Pricing Comparison

| Tier | Cost | Database | Storage | Key Differences |
|------|------|----------|---------|-----------------|
| Free | $0 | 500 MB | 1 GB | Pauses after inactivity, 2 projects |
| Pro | $25/mo | 8 GB | 100 GB | No pausing, daily backups, email support |
| Team | $599/mo | 8 GB+ | 100 GB+ | Priority support, SOC2, SSO |

**For This Project**: The free tier is sufficient. Even with thousands of users, garden data typically occupies <100 KB per user. 500 MB could support ~5,000+ active users.

---

## Proposed Database Schema

### Tables

```sql
-- ============================================================
-- REFERENCE DATA (Shared across all users)
-- ============================================================

-- Master vegetable database (currently ~60 vegetables)
-- This replaces the static TypeScript file: src/lib/vegetable-database.ts
CREATE TABLE vegetables (
  id TEXT PRIMARY KEY,                    -- e.g., 'lettuce', 'carrots', 'tomatoes'
  name TEXT NOT NULL,
  category TEXT NOT NULL,                 -- 'leafy-greens', 'root-vegetables', etc.
  description TEXT,
  
  -- Planting information (stored as JSONB for flexibility)
  planting JSONB NOT NULL,
  -- Example: {
  --   "sowIndoorsMonths": [3, 4],
  --   "sowOutdoorsMonths": [5, 6, 7, 8],
  --   "transplantMonths": [5, 6, 7, 8],
  --   "harvestMonths": [6, 7, 8, 9, 10],
  --   "daysToHarvest": { "min": 45, "max": 75 }
  -- }
  
  -- Care requirements (stored as JSONB for flexibility)
  care JSONB NOT NULL,
  -- Example: {
  --   "sun": "partial-shade",
  --   "water": "moderate",
  --   "spacing": { "between": 25, "rows": 30 },
  --   "depth": 1,
  --   "difficulty": "beginner",
  --   "tips": ["Sow little and often...", ...]
  -- }
  
  companion_plants TEXT[],                -- Array of vegetable names
  avoid_plants TEXT[],                    -- Array of vegetable names
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for category filtering
CREATE INDEX idx_vegetables_category ON vegetables(category);

-- ============================================================
-- USER DATA
-- ============================================================

-- Users table (synced with Supabase Auth)
-- Note: Supabase auto-creates auth.users, we extend with public profile
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garden Plans
CREATE TABLE garden_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garden Plots (beds/areas within a plan)
CREATE TABLE garden_plots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES garden_plans(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  width DECIMAL(5,2) NOT NULL,
  length DECIMAL(5,2) NOT NULL,
  color TEXT DEFAULT '#22c55e',
  sort_order INTEGER DEFAULT 0,
  -- Grid plot fields (nullable for non-grid plots)
  grid_rows INTEGER,
  grid_cols INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plot Cells (for grid-based plots)
CREATE TABLE plot_cells (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plot_id UUID REFERENCES garden_plots(id) ON DELETE CASCADE NOT NULL,
  row_num INTEGER NOT NULL,
  col_num INTEGER NOT NULL,
  vegetable_id TEXT REFERENCES vegetables(id) ON DELETE SET NULL,
  planted_year INTEGER,
  UNIQUE(plot_id, row_num, col_num)
);

-- Planned Vegetables (vegetables added to a plan)
CREATE TABLE planned_vegetables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES garden_plans(id) ON DELETE CASCADE NOT NULL,
  vegetable_id TEXT REFERENCES vegetables(id) NOT NULL,
  plot_id UUID REFERENCES garden_plots(id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'sown', 'transplanted', 'growing', 'harvesting', 'complete')),
  planned_sow_date DATE,
  planned_transplant_date DATE,
  expected_harvest_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rotation History (tracks what was planted in previous years for crop rotation)
-- Purpose: Allows users to see what rotation group was in each plot in past years,
-- helping them follow the recommended 4-year rotation cycle
CREATE TABLE rotation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plot_id UUID REFERENCES garden_plots(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  rotation_group TEXT NOT NULL,           -- 'brassicas', 'legumes', 'roots', etc.
  vegetables TEXT[],                      -- Array of vegetable IDs planted that year
  UNIQUE(plot_id, year)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_garden_plans_user ON garden_plans(user_id);
CREATE INDEX idx_garden_plots_plan ON garden_plots(plan_id);
CREATE INDEX idx_planned_vegetables_plan ON planned_vegetables(plan_id);
CREATE INDEX idx_rotation_history_plot ON rotation_history(plot_id);
CREATE INDEX idx_rotation_history_year ON rotation_history(year);

-- ============================================================
-- FUTURE ITERATIONS (not implemented now)
-- ============================================================
-- Custom Vegetables: Allow users to add their own vegetables
-- This would extend the master vegetables table with user-specific entries
-- Deferred to keep initial implementation simpler
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE vegetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE plot_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_vegetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotation_history ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- REFERENCE DATA POLICIES (Public read access)
-- ============================================================

-- Everyone can read the vegetables database (including anonymous users)
CREATE POLICY "Vegetables are publicly readable" ON vegetables
  FOR SELECT USING (true);

-- Only admins can modify vegetables (managed via service role key)
-- No INSERT/UPDATE/DELETE policies for regular users

-- ============================================================
-- USER DATA POLICIES (Private to each user)
-- ============================================================

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own plans" ON garden_plans
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage plots in own plans" ON garden_plots
  FOR ALL USING (
    plan_id IN (SELECT id FROM garden_plans WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage cells in own plots" ON plot_cells
  FOR ALL USING (
    plot_id IN (
      SELECT gp.id FROM garden_plots gp
      JOIN garden_plans p ON gp.plan_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage vegetables in own plans" ON planned_vegetables
  FOR ALL USING (
    plan_id IN (SELECT id FROM garden_plans WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage rotation history for own plots" ON rotation_history
  FOR ALL USING (
    plot_id IN (
      SELECT gp.id FROM garden_plots gp
      JOIN garden_plans p ON gp.plan_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
```

---

## Integration Architecture Options

### Option A: Full Migration to Supabase

**How it works**: Replace localStorage entirely with Supabase database. All data stored in cloud.

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                          │
├─────────────────────────────────────────────────────────────┤
│  React Components → Supabase Client → Supabase Cloud        │
│                                                             │
│  No localStorage for garden data                            │
└─────────────────────────────────────────────────────────────┘
```

**Pros**:
- Simplest architecture
- Single source of truth
- Cross-device sync out of the box
- Real-time collaboration possible

**Cons**:
- Requires authentication (no anonymous use)
- Requires internet connection
- Breaking change for existing users

### Option B: Hybrid with Auth-Gated Cloud Sync

**How it works**: Anonymous users continue with localStorage. Authenticated users sync to Supabase.

```
┌─────────────────────────────────────────────────────────────┐
│                     ANONYMOUS USER                           │
├─────────────────────────────────────────────────────────────┤
│  Full access to all features                                │
│  Garden data saved in localStorage                          │
│  Prompted to sign up to enable cloud sync                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (User signs up)
┌─────────────────────────────────────────────────────────────┐
│                   AUTHENTICATED USER                         │
├─────────────────────────────────────────────────────────────┤
│  Garden data synced to Supabase                             │
│  localStorage used as cache/offline fallback                │
│  Cross-device access enabled                                │
│  Import prompt: "Import your existing garden?"              │
└─────────────────────────────────────────────────────────────┘
```

**Pros**:
- Preserves free anonymous experience
- Gradual migration path
- Offline capability maintained
- Best of both worlds

**Cons**:
- More complex implementation
- Two storage mechanisms to maintain
- Potential sync conflicts

### Option C: Supabase with localStorage Cache

**How it works**: Primary storage in Supabase, localStorage as offline cache with sync.

```
┌─────────────────────────────────────────────────────────────┐
│                       DATA FLOW                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [User Action] → [localStorage Write] → [Supabase Sync]    │
│                          ↓                                  │
│                   [Optimistic UI]                           │
│                          ↓                                  │
│  [Page Load] ← [Merge Strategy] ← [Supabase Read]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Pros**:
- Fast local operations
- Works offline
- Automatic sync when online

**Cons**:
- Complex conflict resolution
- Eventually consistent
- Higher implementation effort

**Recommendation**: **Option B** - Hybrid approach provides the best balance of user experience, flexibility, and implementation simplicity.

---

## Technical Integration

### Required Packages

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Server-side only
```

### Client Setup

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### Files That Would Need Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `src/lib/supabase/client.ts` | New | Browser Supabase client |
| `src/lib/supabase/server.ts` | New | Server Supabase client |
| `src/lib/supabase/middleware.ts` | New | Session refresh middleware |
| `src/lib/garden-storage.ts` | Modify | Add Supabase storage functions |
| `src/app/layout.tsx` | Modify | Wrap with auth provider |
| `src/app/garden-planner/page.tsx` | Modify | Use auth-aware storage |
| `src/components/Navigation.tsx` | Modify | Add auth buttons |
| `src/app/auth/callback/route.ts` | New | OAuth callback handler |
| `src/app/login/page.tsx` | New | Login page |
| `src/middleware.ts` | New | Session management |
| `package.json` | Modify | Add dependencies |

### Storage Abstraction Layer

```typescript
// src/lib/garden-storage-unified.ts
import { createClient } from '@/lib/supabase/client'
import { loadGardenData, saveGardenData } from './garden-storage'

export interface StorageProvider {
  load(): Promise<GardenPlannerData>
  save(data: GardenPlannerData): Promise<boolean>
  isAuthenticated(): boolean
}

// Local storage provider (existing behavior)
class LocalStorageProvider implements StorageProvider {
  load() { return Promise.resolve(loadGardenData()) }
  save(data) { return Promise.resolve(saveGardenData(data)) }
  isAuthenticated() { return false }
}

// Supabase provider (new)
class SupabaseStorageProvider implements StorageProvider {
  private supabase = createClient()
  
  async load(): Promise<GardenPlannerData> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    
    const { data: plans } = await this.supabase
      .from('garden_plans')
      .select(`
        *,
        garden_plots (
          *,
          plot_cells (*)
        ),
        planned_vegetables (*)
      `)
      .order('created_at', { ascending: false })
    
    return transformToGardenPlannerData(plans)
  }
  
  async save(data: GardenPlannerData): Promise<boolean> {
    // Implement upsert logic
    // ...
    return true
  }
  
  isAuthenticated() { return true }
}

// Factory function
export function getStorageProvider(isAuthenticated: boolean): StorageProvider {
  return isAuthenticated 
    ? new SupabaseStorageProvider()
    : new LocalStorageProvider()
}
```

---

## Data Migration: Vegetables Database

The current vegetable database lives in `src/lib/vegetable-database.ts` with ~60 vegetables. This needs to be migrated to Supabase.

### Seeding Script

```typescript
// scripts/seed-vegetables.ts
import { createClient } from '@supabase/supabase-js'
import { vegetables } from '../src/lib/vegetable-database'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for seeding
)

async function seedVegetables() {
  console.log(`Seeding ${vegetables.length} vegetables...`)
  
  const vegRecords = vegetables.map(v => ({
    id: v.id,
    name: v.name,
    category: v.category,
    description: v.description,
    planting: v.planting,           // JSONB column
    care: v.care,                   // JSONB column
    companion_plants: v.companionPlants,
    avoid_plants: v.avoidPlants
  }))
  
  const { error } = await supabase
    .from('vegetables')
    .upsert(vegRecords, { onConflict: 'id' })
  
  if (error) {
    console.error('Error seeding vegetables:', error)
    process.exit(1)
  }
  
  console.log('✅ Vegetables seeded successfully!')
}

seedVegetables()
```

### Benefits of Database-Stored Vegetables

| Aspect | Static TypeScript File | Supabase Table |
|--------|----------------------|----------------|
| Updates | Requires code deploy | Update in dashboard |
| Versioning | Git history | Audit trail possible |
| Regional Variants | Hardcoded for Scotland | Could add region column |
| Community Contributions | Pull requests only | Admin panel possible |
| API Access | Build-time only | Real-time queries |
| Size Impact | Bundled in JS (~50KB) | Fetched on demand |

---

## Migration Strategy

### Phase 1: Add Supabase Infrastructure (Week 1)

1. Set up Supabase project
2. Create database schema (including vegetables table)
3. Run vegetables seeding script
4. Configure RLS policies
5. Add Supabase client libraries
6. Create auth pages (login/signup)

### Phase 2: Implement Hybrid Storage (Week 2)

1. Create storage abstraction layer
2. Implement Supabase storage provider
3. Add localStorage → Supabase migration flow
4. Test both user paths (anonymous & authenticated)

### Phase 3: UI Integration (Week 3)

1. Add auth buttons to navigation
2. Create account management UI
3. Add sync status indicators
4. Implement "Import existing data" flow
5. Add data export feature for backup

### Phase 4: Testing & Documentation (Week 4)

1. End-to-end testing
2. Update documentation
3. User communication about new feature
4. Monitor for issues

---

## Pros and Cons Summary

### Advantages of Adding Supabase

| Benefit | Impact | Notes |
|---------|--------|-------|
| Cross-device sync | High | Access gardens from any device |
| Data durability | High | No more losing data when clearing browser |
| PostgreSQL power | High | Complex queries, relationships, integrity |
| Real-time possible | Medium | Future: collaborative garden planning |
| Auth included | High | No need for separate auth provider |
| Free tier sufficient | High | 500 MB handles thousands of users |
| Open source | Medium | Can self-host if needed |
| Type safety | Medium | Supabase generates TypeScript types |

### Disadvantages and Risks

| Concern | Severity | Mitigation |
|---------|----------|------------|
| Internet required | Medium | Offline fallback with localStorage |
| Service dependency | Medium | Open source, can self-host |
| Project pausing (free) | Low | Pro plan ($25/mo) if issue |
| Migration complexity | Medium | Phased approach, abstraction layer |
| Learning curve | Low | Excellent documentation |
| Privacy considerations | Medium | Clear privacy policy, optional auth |
| Breaking existing users | Medium | Keep localStorage, make auth optional |

---

## Comparison with Clerk Research

The [Clerk research document](./clerk-user-management.md) explored using Clerk's user metadata for storage. Here's how Supabase compares:

| Aspect | Clerk Metadata | Supabase |
|--------|---------------|----------|
| Storage Limit | ~1 MB per user | 500 MB total (free) |
| Query Capability | Key-value only | Full SQL |
| Relationships | Manual | Native foreign keys |
| Real-time | Not available | Built-in |
| Auth | Included | Included |
| Cost | Free to 10k MAU | Free to 500 MB |
| Complexity | Lower | Higher |
| Flexibility | Lower | Higher |

**Recommendation**: If choosing between the two:
- **Clerk metadata**: Simple, limited, fast to implement
- **Supabase**: Powerful, flexible, better long-term investment

**Best of both**: Use Clerk for auth + Supabase for data (if authentication UX is priority)

---

## Future Expansion Possibilities

With Supabase in place, future features become easier:

1. **Custom Vegetables (Deferred from initial implementation)**
   - Users can add their own vegetable varieties
   - Personal planting notes and care tips
   - Share custom vegetables with community
   - Regional variants for different climates

2. **Community Features**
   - Share garden plans publicly
   - Browse and clone others' plans
   - Garden tips/advice forum

3. **Collaboration**
   - Real-time collaborative planning
   - Family/household shared gardens
   - Allotment community groups

4. **Analytics**
   - Track harvest yields over years
   - Success rate by vegetable
   - Community-wide planting trends

5. **Rich Media**
   - Garden photos (Supabase Storage)
   - Progress timeline with images
   - Visual garden diary

6. **Integrations**
   - Weather API data storage
   - IoT sensor data (soil moisture, etc.)
   - Calendar sync exports

---

## Questions to Resolve Before Implementation

1. **Privacy Policy**: What data is collected? How is it used?

2. **Account Deletion**: What's the GDPR-compliant deletion flow?

3. **Existing Users**: How do we communicate the new cloud sync feature?

4. **Offline Handling**: Detailed sync conflict resolution strategy?

5. **Auth Method**: Email only? Social logins? Which providers?

6. **Migration Deadline**: Force migration from localStorage eventually?

7. **Free Tier Pausing**: Accept risk or start with Pro tier?

---

## Estimated Effort

| Task | Effort | Dependencies |
|------|--------|--------------|
| Supabase project setup | 2-3 hours | None |
| Database schema creation | 3-4 hours | Project setup |
| Vegetables seeding script | 2-3 hours | Schema |
| RLS policies implementation | 2-3 hours | Schema |
| Supabase client integration | 2-3 hours | Project setup |
| Auth pages (login/signup) | 4-6 hours | Client integration |
| Storage abstraction layer | 4-6 hours | Client integration |
| Refactor to use DB vegetables | 3-4 hours | Client integration |
| Garden planner integration | 6-8 hours | Storage layer |
| Migration flow (localStorage → Supabase) | 4-6 hours | Planner integration |
| Navigation auth UI | 2-3 hours | Auth pages |
| Testing (unit + e2e) | 4-6 hours | All above |
| Documentation updates | 2-3 hours | All above |

**Total Estimate**: 41-58 hours of development work (~1.5-2 weeks)

---

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Pricing](https://supabase.com/pricing)
- [Supabase Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [ADR-004: No Database Architecture](../adrs/004-no-database-architecture.md)
- [ADR-002: Data Persistence Strategy](../adrs/002-data-persistence-strategy.md)
- [Clerk User Management Research](./clerk-user-management.md)

---

## Decision

**Pending** - This document is for research and discussion purposes. A decision to proceed should consider:

1. User demand for cross-device sync and data durability
2. Available development time (~1-2 weeks)
3. Willingness to introduce database infrastructure
4. Privacy and data handling implications
5. Whether to use Supabase auth or combine with Clerk

### Recommendation

**Proceed with Supabase** using Option B (Hybrid with Auth-Gated Cloud Sync):

- Maintains current free anonymous experience
- Adds optional cloud sync for users who want it
- PostgreSQL provides solid foundation for future features
- Free tier is generous for community project scale
- Better long-term flexibility than Clerk metadata approach

