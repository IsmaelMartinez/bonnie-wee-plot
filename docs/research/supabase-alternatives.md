# Supabase Alternatives Research

Date: 2026-04-06

## Context

Bonnie Wee Plot currently uses Supabase as its cloud persistence layer. The usage is remarkably simple: a single `allotments` table storing one JSONB document per user, with Clerk JWT-based RLS. The three operations are fetch, upsert, and delete. There is no use of Supabase Auth (Clerk handles that), no Realtime subscriptions, no Edge Functions, and no file storage. The entire Supabase footprint is essentially a key-value store with row-level security.

The free-tier Supabase project has paused due to inactivity (DNS stopped resolving for `tjgxszrzhumzgmtizmqr.supabase.co`), which breaks cloud sync for logged-in users. This is a known limitation: Supabase pauses free projects after 7 days without API requests.

The question: is Supabase the right tool for this job, or is there a free (or cheaper) alternative that better fits the actual usage pattern?

### Portfolio Context

The repo-butler portfolio includes 14 repositories, two of which use Supabase: bonnie-wee-plot and betis-escocia. The betis-escocia site (a Real Betis supporters club website) has already hit Supabase free-tier limits that prevent integration tests from running. Both repos are Gold-tier health.

A Supabase Pro plan costs $25/month per organisation. Multiple projects within one Pro organisation share MAU, storage, and egress quotas, but each project requires its own compute instance (starting at ~$10/month extra). So running both repos under one Pro org would cost roughly $35/month. That's $420/year for what amounts to a few KB of JSONB per user in one project and some match/trivia data in the other.

### What We Actually Use

From bonnie-wee-plot's perspective, the Supabase dependency surface is:

- `sql/001-allotments.sql`: one table, four RLS policies, one index
- `src/lib/supabase/client.ts`: creates authenticated Supabase clients using Clerk JWTs
- `src/lib/supabase/sync.ts`: three functions (fetchRemote, pushToRemote, deleteRemote)
- `src/app/api/account/route.ts`: GDPR export/delete endpoints
- `src/hooks/useSyncedStorage.ts`: sync orchestration hook

The data model is one row per user containing a JSONB blob. A typical allotment document is probably 10-50 KB. There are currently zero paying users.

---

## Multi-Persona Analysis

### The Pragmatist (DevOps Engineer)

The pausing problem is the immediate pain point. Supabase pauses free projects after 7 days of inactivity, which means any hobby project without steady traffic will periodically go dark. There are workarounds (GitHub Actions that ping the project every few days), but they're band-aids. The real question is whether to keep working around a platform whose free tier is designed for projects with regular traffic, or switch to something that stays alive without intervention.

The migration effort for bonnie-wee-plot would be small because the Supabase surface area is so thin. Three functions in sync.ts, one SQL table, and a client module. Any alternative that offers authenticated CRUD on a document store could replace this in a day or two. The sync hook itself doesn't need to change at all, only the transport layer beneath it.

For betis-escocia, the situation is more complex since it likely uses more Supabase features (tables for matches, trivia, contacts, RSVPs based on the file structure). Migrating that would be a separate, larger effort. So the decision for these two repos might diverge.

### The Architect (System Designer)

Looking at the actual requirements, bonnie-wee-plot needs: authenticated writes (one user can only access their own document), a single JSON document per user, basic CRUD (read, upsert, delete), and GDPR compliance (export + deletion). That's it. No queries across users, no joins, no aggregations, no real-time subscriptions.

This is essentially a cloud key-value store with authentication. Using a full Postgres database with RLS, connection pooling, and a feature-rich SDK is massive overkill. The alternatives fall into a few categories:

**Option A: Vercel-native storage (KV or Blob)**
Vercel deprecated its managed Postgres and KV in late 2024, pushing users to Neon and Upstash directly. However, Vercel Blob ($0.023/GB-month) is still active and would work. The app is already deployed on Vercel, so this keeps the infrastructure footprint minimal. A per-user JSON blob stored via the Vercel Blob API would work, but you'd need to build your own auth layer on top since Blob doesn't have RLS. Since the API routes already authenticate via Clerk, this is straightforward: the API route checks auth, then reads/writes the blob.

**Option B: Cloudflare D1**
A serverless SQLite database on Cloudflare's edge. The free tier offers 5 million reads and 100K writes daily, 500 MB per database, and 10 databases. No pausing policy. This is generous for a hobby project. However, bonnie-wee-plot is a Next.js app on Vercel, not Cloudflare Workers, so you'd need to access D1 via Cloudflare's REST API rather than native bindings. That adds latency and complexity. D1 makes more sense if you're already on Cloudflare Workers.

**Option C: Turso (libSQL)**
A serverless SQLite-compatible database. The free tier is extremely generous: 100 databases, 5 GB storage, 500 million rows read per month, 10 million rows written. No pausing policy mentioned. It's designed for edge applications and supports HTTP-based access from anywhere. The `@libsql/client` npm package provides a clean HTTP client. You'd create a simple table similar to the current Supabase schema and use Clerk JWTs for auth at the API route level (since Turso doesn't have built-in RLS, but you'd enforce auth in your Next.js API routes).

**Option D: Neon (Serverless Postgres)**
A serverless Postgres that scales to zero. Free tier: 0.5 GB storage per project, 100 projects, compute scales to zero after 5 minutes of inactivity. Crucially, unlike Supabase, Neon doesn't pause the project entirely or stop DNS. It just scales compute to zero and wakes up on the next query (with a cold start of ~500ms). This means your project stays accessible. The free compute budget is 100 CU-hours per month, which is plenty for a hobby project. Since it's actual Postgres, the migration would be trivial: same SQL schema, same query patterns, just a different client library (`@neondatabase/serverless`). However, you'd lose Supabase's RLS-via-JWT integration and would need to enforce auth at the API route level instead.

**Option E: Firebase Firestore**
Free tier includes 50K reads, 20K writes, and 1 GB storage per day. No pausing. Google's track record with free tiers is generally stable. The NoSQL document model actually fits the use case well (one document per user). However, introducing the Firebase SDK adds significant bundle weight, and the developer experience for a Next.js app is less natural than the SQL-based alternatives. The Firestore client library is also quite large.

**Option F: API routes + Upstash Redis**
The app already uses Upstash Redis for the share feature. Upstash's free tier offers 256 MB storage and 500K commands/month with no pausing. You could store each user's allotment as a Redis hash or JSON string keyed by user ID. The data fits easily (50 KB per user, and even 1000 users would only use ~50 MB). Auth would be handled at the API route level via Clerk, same as the current architecture. This has the advantage of zero new dependencies since Upstash is already configured.

**Option G: Keep Supabase, just prevent pausing**
Set up a GitHub Actions cron job to ping the Supabase project every 5 days. This is the lowest-effort option and keeps everything working as-is. The downside is that it's a workaround, not a solution, and you're still paying attention to a free tier that's designed to push you toward the $25/month plan.

### The Economist (Cost Analyst)

Let me lay out the real costs for each option, assuming near-zero traffic (hobby project, maybe 1-5 users):

| Option | Monthly Cost | Pauses? | Migration Effort | New Dependencies |
|--------|-------------|---------|-----------------|-----------------|
| Supabase Free (status quo + ping workaround) | $0 | Yes, needs workaround | None | None |
| Supabase Pro (shared org with betis-escocia) | $25-35 | No | None | None |
| Upstash Redis (already configured) | $0 | No | Small (swap sync.ts) | None |
| Turso | $0 | No | Small (swap sync.ts + client) | @libsql/client |
| Neon | $0 | No (scales to zero) | Small (swap sync.ts + client) | @neondatabase/serverless |
| Cloudflare D1 | $0 | No | Medium (REST API + client) | None (HTTP fetch) |
| Firebase Firestore | $0 | No | Medium (new SDK, data model) | firebase SDK (~200KB) |
| Vercel Blob | ~$0 | No | Small (swap sync.ts) | @vercel/blob |

The $25-35/month for Supabase Pro is hard to justify for two hobby projects with near-zero users. That's the price of a modest VPS where you could run Postgres, Redis, and anything else you need. The portfolio has 14 repos, but only two use Supabase, and neither generates revenue.

For bonnie-wee-plot specifically, the Upstash Redis option stands out because it requires zero new dependencies (already in the project for the share feature), zero cost, and the migration is contained to swapping the sync transport layer. The free tier's 256 MB and 500K commands are more than sufficient for this use case.

### The Security-Minded Reviewer

A few security considerations worth noting across the options:

Supabase's RLS provides database-level access control, which is defence in depth. If you move to a system without RLS (Upstash, Turso, Neon without RLS), you're relying entirely on your API route middleware to enforce that users can only access their own data. The current codebase already does this (Clerk's `auth()` extracts the userId, and the sync functions scope queries to that userId), so the practical risk is low. But it's one fewer layer.

For GDPR compliance, any alternative must support complete data deletion. Upstash Redis supports `DEL`, Turso and Neon support `DELETE FROM`, Firestore supports `doc.delete()`. All viable.

Data residency: Supabase lets you pick a region. Upstash, Turso, and Neon also support region selection. For a UK-focused gardening app, keeping data in the EU is preferable.

### The User Advocate (Product Perspective)

From a user's perspective, the main thing that matters is that their data is there when they open the app. The current Supabase setup fails this when the project pauses. Any alternative that doesn't pause wins on the most important metric: reliability.

The sync architecture in bonnie-wee-plot is already well designed for this change. localStorage is the primary store, cloud sync is an async overlay, and the hook gracefully handles sync failures by falling back to local data. Swapping the cloud backend is purely a plumbing change that users would never notice, except that their data would stop disappearing when the project pauses.

---

## Recommendation

**Short term (immediate)**: Unpause the Supabase project to restore sync for any existing users. This takes 2 minutes in the Supabase dashboard.

**Medium term (next sprint)**: Migrate bonnie-wee-plot's cloud sync from Supabase to Upstash Redis. The rationale:

- Upstash is already a dependency (used for the share feature), so there are no new accounts, no new SDK dependencies, and no new environment variables beyond what's already configured.
- The free tier (256 MB, 500K commands/month) is more than sufficient. Even with 1000 users at 50 KB each, that's only 50 MB.
- No pausing policy. The project stays alive.
- The migration surface is small: replace `src/lib/supabase/client.ts` and `src/lib/supabase/sync.ts` with Upstash equivalents, update the account API route, and remove the `@supabase/supabase-js` dependency.
- Auth enforcement stays at the API route level via Clerk, which is how it already works in practice (the Supabase RLS is a second layer but Clerk is the primary gate).

**For betis-escocia**: Evaluate separately. That project likely uses more Supabase features and may need a different solution. If it only needs a database for matches/trivia, Turso or Neon might be better fits since they offer relational query capabilities. Do not pay $25/month for Supabase Pro to cover both projects unless the betis-escocia requirements genuinely need it.

**Do not**: Pay $25/month for Supabase Pro for hobby projects with no revenue and no users. That money is better spent elsewhere (or not spent at all).

---

## Sources

- [Supabase Pricing](https://supabase.com/pricing)
- [Supabase Billing FAQ](https://supabase.com/docs/guides/platform/billing-faq)
- [Supabase Organisation-Based Billing](https://supabase.com/blog/organization-based-billing)
- [Turso Pricing](https://turso.tech/pricing)
- [Neon Pricing](https://neon.com/pricing)
- [Cloudflare D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [Upstash Pricing](https://upstash.com/pricing)
- [Firebase Pricing](https://firebase.google.com/pricing)
- [Vercel Pricing](https://vercel.com/pricing)
