# Multi-Provider AI Integration Research: OpenAI + Gemini 2.0 Flash

## 1. Executive Summary

This research document analyzes the feasibility and implementation strategy for adding **Google Gemini 2.0 Flash** support to AItor (the AI gardening advisor), alongside the existing OpenAI integration. The goal is to provide users with provider choice and potentially offer "free credits" through Gemini's generous free tier.

### Key Findings

1. **Current State**: AItor is tightly coupled to OpenAI's API with hardcoded endpoints, models, and token validation
2. **Opportunity**: Gemini 2.0 Flash offers a substantial free tier (15 RPM, 1M tokens/day) that could provide free usage without billing
3. **Integration Path**: Google provides an OpenAI-compatible endpoint, minimizing code changes
4. **Dependency**: Full "free credits" with usage tracking requires user management (Clerk) - planned for v2/v3

### Recommendation

Implement a **two-phase approach**:
- **Phase 1 (v1.x)**: Add Gemini support with BYOK (Bring Your Own Key) model, matching OpenAI
- **Phase 2 (v2/v3)**: Integrate Clerk for user management + server-side Gemini key with per-user rate limits

---

## 2. Current Architecture Analysis

### 2.1 System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Browser (Client)                               │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │  AI Advisor Page │───▶│  Session Storage │───▶│  Settings Panel  │  │
│  │  (page.tsx)      │    │  (aitor_api_token│    │  (Token Config)  │  │
│  └────────┬─────────┘    └──────────────────┘    └──────────────────┘  │
│           │                                                              │
│           │ POST /api/ai-advisor                                         │
│           │ Headers: x-openai-token (optional)                           │
│           ▼                                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                        Next.js API Route                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │  Token Resolver  │───▶│  Build API Config│───▶│  OpenAI Fetch    │  │
│  │  (getApiKey)     │    │  (buildApiConfig)│    │  (hardcoded URL) │  │
│  └──────────────────┘    └──────────────────┘    └────────┬─────────┘  │
│                                                           │              │
└───────────────────────────────────────────────────────────┼──────────────┘
                                                            │
                                                            ▼
                                              ┌──────────────────────────┐
                                              │  OpenAI API              │
                                              │  api.openai.com/v1/      │
                                              │  chat/completions        │
                                              └──────────────────────────┘
```

### 2.2 Hardcoded OpenAI Dependencies

The current implementation in `src/app/api/ai-advisor/route.ts` has several OpenAI-specific hardcodings:

| Location | Code | Issue |
|----------|------|-------|
| Line 122 | `const apiUrl = 'https://api.openai.com/v1/chat/completions'` | Hardcoded endpoint |
| Line 198 | `const model = image ? 'gpt-4o' : 'gpt-4o-mini'` | Hardcoded models |
| Lines 111-113 | `const tokenPattern = /^[a-zA-Z0-9\-_]{20,}$/` | OpenAI-specific validation |
| Lines 220-239 | Error messages referencing "OpenAI" | Provider-specific errors |
| Line 101 | `request.headers.get('x-openai-token')` | OpenAI-named header |

### 2.3 Current Token Flow

```typescript
// Priority: User token > Environment variable
function getApiKey(request: NextRequest) {
  const envOpenAIKey = process.env.OPENAI_API_KEY           // Server default
  const userOpenAIToken = request.headers.get('x-openai-token')  // User BYOK
  return userOpenAIToken || envOpenAIKey
}
```

### 2.4 Current Request Format (OpenAI)

```typescript
// OpenAI Chat Completions format
{
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: AITOR_SYSTEM_PROMPT },
    { role: 'user', content: 'What should I plant in June?' }
  ],
  max_tokens: 1500,
  temperature: 0.7
}

// With image (Vision API)
{
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: AITOR_SYSTEM_PROMPT },
    { 
      role: 'user', 
      content: [
        { type: 'text', text: 'What is wrong with my tomato plant?' },
        { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,...', detail: 'high' } }
      ]
    }
  ]
}
```

---

## 3. Gemini API Technical Details

### 3.1 API Format Comparison

#### OpenAI Native Format

```typescript
// Endpoint
POST https://api.openai.com/v1/chat/completions

// Headers
Authorization: Bearer sk-xxx...
Content-Type: application/json

// Request Body
{
  "model": "gpt-4o-mini",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello!" }
  ],
  "max_tokens": 1500,
  "temperature": 0.7
}

// Response
{
  "choices": [{
    "message": { "role": "assistant", "content": "Hello! How can I help?" }
  }],
  "usage": { "prompt_tokens": 10, "completion_tokens": 15, "total_tokens": 25 }
}
```

#### Gemini Native Format

```typescript
// Endpoint
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=AIza...

// Headers
Content-Type: application/json

// Request Body (DIFFERENT STRUCTURE)
{
  "contents": [
    {
      "role": "user",
      "parts": [{ "text": "Hello!" }]
    }
  ],
  "systemInstruction": {
    "parts": [{ "text": "You are a helpful assistant." }]
  },
  "generationConfig": {
    "maxOutputTokens": 1500,
    "temperature": 0.7
  }
}

// Response (DIFFERENT STRUCTURE)
{
  "candidates": [{
    "content": {
      "role": "model",
      "parts": [{ "text": "Hello! How can I help?" }]
    }
  }],
  "usageMetadata": { "promptTokenCount": 10, "candidatesTokenCount": 15 }
}
```

#### Gemini OpenAI-Compatible Format (RECOMMENDED)

```typescript
// Endpoint - Note the /openai/ path segment
POST https://generativelanguage.googleapis.com/v1beta/openai/chat/completions

// Headers - Same as OpenAI!
Authorization: Bearer AIza...
Content-Type: application/json

// Request Body - IDENTICAL to OpenAI!
{
  "model": "gemini-2.0-flash-exp",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello!" }
  ],
  "max_tokens": 1500,
  "temperature": 0.7
}

// Response - IDENTICAL to OpenAI!
{
  "choices": [{
    "message": { "role": "assistant", "content": "Hello! How can I help?" }
  }],
  "usage": { "prompt_tokens": 10, "completion_tokens": 15, "total_tokens": 25 }
}
```

### 3.2 Image/Vision API Comparison

#### OpenAI Vision Format

```typescript
{
  "model": "gpt-4o",
  "messages": [{
    "role": "user",
    "content": [
      { "type": "text", "text": "What's in this image?" },
      { 
        "type": "image_url", 
        "image_url": { 
          "url": "data:image/jpeg;base64,/9j/4AAQ...",
          "detail": "high"
        }
      }
    ]
  }]
}
```

#### Gemini Native Vision Format

```typescript
{
  "contents": [{
    "role": "user",
    "parts": [
      { "text": "What's in this image?" },
      { 
        "inlineData": {
          "mimeType": "image/jpeg",
          "data": "/9j/4AAQ..."  // base64 without prefix
        }
      }
    ]
  }]
}
```

#### Gemini OpenAI-Compatible Vision Format

```typescript
// Uses SAME format as OpenAI - no changes needed!
{
  "model": "gemini-2.0-flash-exp",
  "messages": [{
    "role": "user",
    "content": [
      { "type": "text", "text": "What's in this image?" },
      { 
        "type": "image_url", 
        "image_url": { 
          "url": "data:image/jpeg;base64,/9j/4AAQ...",
          "detail": "high"
        }
      }
    ]
  }]
}
```

### 3.3 Available Gemini Models

| Model | Context Window | Best For | Multimodal |
|-------|---------------|----------|------------|
| `gemini-2.0-flash-exp` | 1M tokens | Fast, general purpose | Yes (images, video, audio) |
| `gemini-2.0-flash-thinking-exp` | 32K tokens | Complex reasoning | Yes |
| `gemini-1.5-flash` | 1M tokens | Production stable | Yes |
| `gemini-1.5-pro` | 2M tokens | Advanced tasks | Yes |

**Recommendation for AItor**: Use `gemini-2.0-flash-exp` for both text and vision (single model simplifies logic).

### 3.4 Token Format Differences

| Provider | Token Format | Example | Validation Pattern |
|----------|-------------|---------|-------------------|
| OpenAI | `sk-` prefix or `sk-proj-` | `sk-proj-abc123...` | `/^sk-[a-zA-Z0-9\-_]{20,}$/` |
| Google AI | `AIza` prefix | `AIzaSyAbc123...` | `/^AIza[a-zA-Z0-9\-_]{35,}$/` |

---

## 4. Integration Options Comparison

### Option A: Gemini OpenAI-Compatible Endpoint (Recommended)

**Approach**: Use Google's OpenAI-compatible endpoint with minimal code changes.

```typescript
// Provider configuration
const PROVIDERS = {
  openai: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    models: { text: 'gpt-4o-mini', vision: 'gpt-4o' },
    tokenPattern: /^sk-[a-zA-Z0-9\-_]{20,}$/
  },
  gemini: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    models: { text: 'gemini-2.0-flash-exp', vision: 'gemini-2.0-flash-exp' },
    tokenPattern: /^AIza[a-zA-Z0-9\-_]{35,}$/
  }
}
```

**Pros**:
- Minimal code changes (same request/response format)
- Reuse existing message building logic
- Consistent error handling
- Easy to add more providers later

**Cons**:
- Slight abstraction overhead
- May miss Gemini-specific features (grounding, code execution)

**Effort**: ~2-3 hours implementation

### Option B: Native Gemini API

**Approach**: Implement separate adapter for native Gemini API format.

```typescript
// Separate adapter needed
function buildGeminiRequest(messages: Message[], image?: ImageData) {
  return {
    contents: messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }]
    })),
    systemInstruction: {
      parts: [{ text: AITOR_SYSTEM_PROMPT }]
    },
    generationConfig: {
      maxOutputTokens: 1500,
      temperature: 0.7
    }
  }
}
```

**Pros**:
- Access to Gemini-specific features
- Potentially better performance
- Full control over API usage

**Cons**:
- Significant code duplication
- Different response parsing
- More maintenance burden
- Harder to add additional providers

**Effort**: ~6-8 hours implementation

### Option C: AI SDK (Vercel)

**Approach**: Use Vercel AI SDK which abstracts multiple providers.

```typescript
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'

const result = await generateText({
  model: provider === 'gemini' ? google('gemini-2.0-flash-exp') : openai('gpt-4o-mini'),
  messages,
  system: AITOR_SYSTEM_PROMPT
})
```

**Pros**:
- Well-maintained abstraction
- Streaming support built-in
- Growing ecosystem

**Cons**:
- New dependency (bundle size)
- Less control over raw API calls
- Learning curve

**Effort**: ~4-5 hours implementation + testing

### Recommendation Matrix

| Criteria | Option A (Compat) | Option B (Native) | Option C (SDK) |
|----------|-------------------|-------------------|----------------|
| Implementation effort | Low | High | Medium |
| Maintenance burden | Low | High | Medium |
| Feature access | Good | Full | Good |
| Future extensibility | Good | Poor | Excellent |
| Bundle size impact | None | None | +50KB |
| **Overall Score** | **8/10** | 5/10 | 7/10 |

**Recommendation**: **Option A** - Gemini's OpenAI-compatible endpoint provides the best balance of simplicity and functionality for AItor's needs.

---

## 5. Security Considerations

### 5.1 Current Security Model

| Aspect | Current Implementation | Assessment |
|--------|----------------------|------------|
| Token storage | Browser sessionStorage | Medium risk - cleared on close |
| Token transmission | HTTPS header (`x-openai-token`) | Secure |
| Server-side storage | None (pass-through) | Good - no persistence |
| Token validation | Basic regex | Minimal - format only |
| Token logging | Disabled | Good |

### 5.2 Multi-Provider Security Implications

#### New Risks

1. **Multiple token types**: Users may confuse OpenAI and Gemini tokens
2. **Token leakage**: Different providers have different security practices
3. **Validation complexity**: Each provider has different token formats
4. **Error message exposure**: Must not reveal which provider failed

#### Mitigation Strategies

```typescript
// 1. Provider-specific validation
function validateToken(provider: 'openai' | 'gemini', token: string): boolean {
  const patterns = {
    openai: /^sk-[a-zA-Z0-9\-_]{20,}$/,
    gemini: /^AIza[a-zA-Z0-9\-_]{35,}$/
  }
  return patterns[provider].test(token)
}

// 2. Generic error messages (don't reveal provider)
const GENERIC_ERRORS = {
  401: 'Invalid API token. Please check your token and try again.',
  429: 'Rate limit exceeded. Please try again later.',
  403: 'Access denied. Please verify your account has API access enabled.'
}

// 3. Separate storage keys per provider
sessionStorage.setItem('aitor_openai_token', openaiToken)
sessionStorage.setItem('aitor_gemini_token', geminiToken)
```

### 5.3 Server-Side API Key Security (For Free Tier)

When implementing server-side Gemini key for free credits:

```typescript
// Environment variables (NEVER expose to client)
GEMINI_SERVER_KEY=AIzaSyXxx...  // Server's Gemini API key for free tier

// Rate limiting per IP (basic protection)
const rateLimiter = new Map<string, { count: number, resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = rateLimiter.get(ip)
  
  if (!limit || limit.resetAt < now) {
    rateLimiter.set(ip, { count: 1, resetAt: now + 3600000 }) // 1 hour
    return true
  }
  
  if (limit.count >= 10) { // 10 requests per hour for free tier
    return false
  }
  
  limit.count++
  return true
}
```

### 5.4 Security Checklist for Implementation

- [ ] Validate tokens match expected provider format before use
- [ ] Never log API tokens (even partial)
- [ ] Use generic error messages that don't reveal provider details
- [ ] Implement rate limiting for server-side keys
- [ ] Clear tokens on explicit logout
- [ ] Add CSP headers to prevent token exfiltration
- [ ] Consider token encryption in sessionStorage (optional enhancement)

---

## 6. Cost Analysis

### 6.1 Current OpenAI Costs

| Model | Input Cost | Output Cost | Typical Query Cost |
|-------|-----------|-------------|-------------------|
| gpt-4o-mini | $0.15/1M tokens | $0.60/1M tokens | ~$0.001 |
| gpt-4o (vision) | $2.50/1M tokens | $10.00/1M tokens | ~$0.02 |

**Average cost per AItor query**: $0.001 - $0.02 depending on image inclusion

### 6.2 Gemini 2.0 Flash Pricing

| Tier | Input Cost | Output Cost | Rate Limits |
|------|-----------|-------------|-------------|
| **Free** | $0 | $0 | 15 RPM, 1M tokens/day |
| Pay-as-you-go | $0.075/1M | $0.30/1M | 1000 RPM |

**Gemini Free Tier Capacity**:
- 15 requests per minute = 900 requests per hour
- 1M tokens per day ≈ 300-500 conversations per day
- Sufficient for moderate usage community allotment app

### 6.3 Cost Comparison for Typical Usage

| Scenario | Monthly Queries | OpenAI Cost | Gemini Cost | Savings |
|----------|----------------|-------------|-------------|---------|
| Light (personal) | 100 | $0.10 - $2 | **$0** | 100% |
| Moderate (small community) | 1,000 | $1 - $20 | **$0** | 100% |
| Heavy (large community) | 10,000 | $10 - $200 | $0.75 - $3 | 95%+ |

### 6.4 Free Credits Strategy

#### Option A: Server-Side Gemini Key (No Auth)

```
User Request → Rate Limit Check (IP) → Server Gemini Key → Gemini API
                      ↓
              Reject if exceeded
```

**Pros**: Simple, no user management needed
**Cons**: IP-based limiting is gameable, no per-user tracking

**Limits**: 10 requests/hour per IP (basic protection)

#### Option B: Authenticated Free Tier (Requires Clerk)

```
User Request → Clerk Auth → User Usage Check → Server Gemini Key → Gemini API
                                  ↓
                         Reject if quota exceeded
```

**Pros**: Per-user limits, abuse prevention, upgrade path
**Cons**: Requires Clerk integration (v2/v3 dependency)

**Limits**: 50 requests/day per authenticated user

### 6.5 Recommendation

1. **Phase 1 (Now)**: BYOK only - users provide their own keys
2. **Phase 2 (With Clerk)**: Add authenticated free tier with Gemini server key

---

## 7. Recommended Implementation Approach

### 7.1 Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Browser (Client)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────────┐  │
│  │  AI Advisor Page │───▶│  Session Storage │───▶│  Settings Panel      │  │
│  │                  │    │  - provider       │    │  - Provider selector │  │
│  │                  │    │  - openai_token   │    │  - Token input       │  │
│  │                  │    │  - gemini_token   │    │  - Token help links  │  │
│  └────────┬─────────┘    └──────────────────┘    └──────────────────────┘  │
│           │                                                                  │
│           │ POST /api/ai-advisor                                             │
│           │ Headers: x-provider, x-api-token                                 │
│           ▼                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                         Next.js API Route (Enhanced)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────────┐  │
│  │  Provider Router │───▶│  Provider Config │───▶│  Unified Fetch       │  │
│  │  (getProvider)   │    │  (PROVIDERS map) │    │  (same format!)      │  │
│  └──────────────────┘    └──────────────────┘    └────────┬─────────────┘  │
│                                                           │                  │
└───────────────────────────────────────────────────────────┼──────────────────┘
                                                            │
                              ┌──────────────────────────────┼────────────────┐
                              │                              │                │
                              ▼                              ▼                │
                   ┌──────────────────┐          ┌──────────────────────┐    │
                   │  OpenAI API      │          │  Gemini API          │    │
                   │  (unchanged)     │          │  (OpenAI-compat)     │    │
                   └──────────────────┘          └──────────────────────┘    │
```

### 7.2 Code Changes Required

#### 7.2.1 New Types (`src/types/ai-provider.ts`)

```typescript
export type AIProvider = 'openai' | 'gemini'

export interface ProviderConfig {
  endpoint: string
  models: {
    text: string
    vision: string
  }
  tokenPattern: RegExp
  tokenHelp: string
}

export const PROVIDERS: Record<AIProvider, ProviderConfig> = {
  openai: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    models: { text: 'gpt-4o-mini', vision: 'gpt-4o' },
    tokenPattern: /^sk-[a-zA-Z0-9\-_]{20,}$/,
    tokenHelp: 'https://platform.openai.com/api-keys'
  },
  gemini: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    models: { text: 'gemini-2.0-flash-exp', vision: 'gemini-2.0-flash-exp' },
    tokenPattern: /^AIza[a-zA-Z0-9\-_]{35,}$/,
    tokenHelp: 'https://aistudio.google.com/app/apikey'
  }
}
```

#### 7.2.2 Updated API Route (`src/app/api/ai-advisor/route.ts`)

Key changes needed:

```typescript
// 1. Accept provider from request
const provider = (request.headers.get('x-ai-provider') || 'openai') as AIProvider
const token = request.headers.get('x-api-token')

// 2. Get provider-specific config
const config = PROVIDERS[provider]
if (!config) {
  return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
}

// 3. Validate token format for provider
if (!config.tokenPattern.test(token)) {
  return NextResponse.json({ error: 'Invalid token format for selected provider' }, { status: 400 })
}

// 4. Use provider-specific endpoint and model
const response = await fetch(config.endpoint, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: image ? config.models.vision : config.models.text,
    messages: apiMessages,
    max_tokens: 1500,
    temperature: 0.7
  })
})
```

#### 7.2.3 Updated Client (`src/app/ai-advisor/page.tsx`)

Key changes needed:

```typescript
// 1. Add provider state
const [provider, setProvider] = useState<AIProvider>('openai')

// 2. Separate token storage per provider
const openaiToken = sessionStorage.getItem('aitor_openai_token')
const geminiToken = sessionStorage.getItem('aitor_gemini_token')

// 3. Send provider in headers
const headers = {
  'Content-Type': 'application/json',
  'x-ai-provider': provider,
  'x-api-token': provider === 'openai' ? openaiToken : geminiToken
}

// 4. Add provider selector in settings
<select value={provider} onChange={(e) => setProvider(e.target.value as AIProvider)}>
  <option value="openai">OpenAI (GPT-4o)</option>
  <option value="gemini">Google Gemini 2.0 Flash</option>
</select>
```

### 7.3 Environment Variables

```bash
# .env.local - Server-side defaults (optional)
OPENAI_API_KEY=sk-xxx...           # Existing - server default for OpenAI
GEMINI_API_KEY=AIzaSyXxx...        # New - server default for Gemini
DEFAULT_AI_PROVIDER=gemini          # New - which provider to use by default
```

### 7.4 Migration Path

| Step | Change | Breaking? | Rollback Risk |
|------|--------|-----------|---------------|
| 1 | Add types and PROVIDERS config | No | None |
| 2 | Update API route to accept provider | No (backward compatible) | Low |
| 3 | Update client with provider selector | No | Low |
| 4 | Rename header from `x-openai-token` to `x-api-token` | Yes | Medium |
| 5 | Update documentation | No | None |

---

## 8. Future Roadmap: User Management with Clerk

### 8.1 Clerk Integration Dependency

The "free credits" feature with usage tracking requires user authentication. **Clerk** is the recommended solution due to:

- Easy Next.js integration
- Generous free tier (10K MAUs)
- Built-in session management
- Webhook support for usage tracking

### 8.2 Proposed Architecture (v2/v3)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Browser (Client)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────────┐  │
│  │  AI Advisor Page │───▶│  Clerk Session   │───▶│  User Dashboard      │  │
│  │                  │    │  (auth state)    │    │  - Usage stats       │  │
│  │                  │    │                  │    │  - Plan/Tier info    │  │
│  │                  │    │                  │    │  - Token management  │  │
│  └────────┬─────────┘    └──────────────────┘    └──────────────────────┘  │
│           │                                                                  │
│           │ POST /api/ai-advisor                                             │
│           │ + Clerk Session Token                                            │
│           ▼                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                         Next.js API Route (v2)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────────┐  │
│  │  Clerk Auth      │───▶│  Usage Checker   │───▶│  Provider Router     │  │
│  │  (getAuth)       │    │  (quotas/limits) │    │  (BYOK or server)    │  │
│  └──────────────────┘    └──────────────────┘    └────────┬─────────────┘  │
│                                                           │                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  User Tiers:                                                          │  │
│  │  - Anonymous: No free credits (BYOK only)                             │  │
│  │  - Free (authenticated): 50 queries/day with server Gemini key        │  │
│  │  - Pro (future): Unlimited with user's own keys                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Implementation Steps for v2/v3

1. **Add Clerk dependency**
   ```bash
   npm install @clerk/nextjs
   ```

2. **Configure Clerk middleware** (`middleware.ts`)
   ```typescript
   import { clerkMiddleware } from '@clerk/nextjs/server'
   export default clerkMiddleware()
   ```

3. **Add usage tracking table** (could use Clerk metadata or external DB)
   ```typescript
   interface UserUsage {
     clerkUserId: string
     dailyQueries: number
     lastQueryDate: string
     tier: 'free' | 'pro'
   }
   ```

4. **Update API route for authenticated free tier**
   ```typescript
   import { auth } from '@clerk/nextjs/server'
   
   export async function POST(request: NextRequest) {
     const { userId } = await auth()
     
     if (userId) {
       // Authenticated user - check quota and use server key if under limit
       const usage = await getUserUsage(userId)
       if (usage.dailyQueries < 50) {
         // Use server's Gemini key for free tier
         return handleWithServerKey(request, 'gemini')
       }
     }
     
     // Not authenticated or over quota - require BYOK
     return handleWithUserKey(request)
   }
   ```

### 8.4 Timeline Estimate

| Phase | Features | Estimated Effort | Dependency |
|-------|----------|------------------|------------|
| v1.x | Multi-provider BYOK | 1-2 days | None |
| v2.0 | Clerk integration | 2-3 days | Clerk setup |
| v2.1 | Free tier with server Gemini key | 1-2 days | v2.0 |
| v3.0 | Usage dashboard & upgrade flow | 3-5 days | v2.1 |

---

## 9. Appendix

### A. Environment Variable Reference

```bash
# Current (v1)
OPENAI_API_KEY=sk-xxx              # Server default OpenAI key

# New (v1.x - Multi-provider)
OPENAI_API_KEY=sk-xxx              # Server default OpenAI key
GEMINI_API_KEY=AIzaSyXxx           # Server default Gemini key  
DEFAULT_AI_PROVIDER=gemini         # Default provider selection

# Future (v2 - Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
```

### B. API Token Help URLs

| Provider | Get API Key | Documentation |
|----------|-------------|---------------|
| OpenAI | https://platform.openai.com/api-keys | https://platform.openai.com/docs |
| Google AI | https://aistudio.google.com/app/apikey | https://ai.google.dev/docs |

### C. Rate Limit Comparison

| Provider | Free Tier | Paid Tier |
|----------|-----------|-----------|
| OpenAI | None (requires billing) | 500-10K RPM depending on tier |
| Gemini | 15 RPM, 1M tokens/day | 1000 RPM |

### D. References

- [Google AI Gemini API Documentation](https://ai.google.dev/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Clerk Next.js Integration](https://clerk.com/docs/quickstarts/nextjs)
- [ADR 005: AI Integration Pattern](../adrs/005-ai-integration-pattern.md)

---

## 10. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2024-12-18 | Use Gemini OpenAI-compatible endpoint | Minimizes code changes while enabling Gemini support |
| 2024-12-18 | Defer free credits to v2/v3 | Requires Clerk for proper usage tracking |
| 2024-12-18 | BYOK model for both providers in v1 | Maintains current security model |
| 2024-12-18 | Single model for Gemini (text + vision) | Gemini 2.0 Flash handles both, simplifies logic |

---

*Document created: December 18, 2024*  
*Last updated: December 18, 2024*  
*Author: AI-assisted research for Community Allotment project*

