# ADR 004: AI Integration via Proxy API Pattern

## Status
Accepted

## Date
2025-01-01 (retrospective)

## Context

The application includes an AI gardening advisor (Aitor) that uses OpenAI's API. Key considerations:
- API keys should not be exposed to the client
- Support both server-configured and user-provided API keys
- Handle rate limiting and errors gracefully
- Support image analysis for plant diagnosis
- Provide context-aware responses (location, season)

## Decision

Implement a **proxy API pattern** where the client calls our Next.js API route, which then calls OpenAI.

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Client        │     │   Next.js API   │     │   OpenAI API    │
│   (Browser)     │────▶│   /api/ai-advisor│────▶│   GPT-4/GPT-4o  │
│                 │◀────│                 │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │
         │ x-openai-token header (optional)
         ▼
    User-provided or
    Server-configured key
```

### Implementation

```typescript
// src/app/api/ai-advisor/route.ts

// API key priority: User token > Environment variable
function getApiKey(request: NextRequest) {
  const envOpenAIKey = process.env.OPENAI_API_KEY
  const userOpenAIToken = request.headers.get('x-openai-token')
  return userOpenAIToken || envOpenAIKey
}

// System prompt defines Aitor's personality
const AITOR_SYSTEM_PROMPT = `You are Aitor, an expert gardening assistant...`

// Handle image analysis with GPT-4 Vision
if (image && image.data) {
  userMessage.content = [
    { type: 'text', text: message },
    { type: 'image_url', image_url: { url: `data:${image.type};base64,${image.data}` } }
  ]
}

// Model selection based on content
const model = image ? 'gpt-4o' : 'gpt-4o-mini'
```

### Client-Side Token Storage

```typescript
// Session storage for user-provided tokens (secure, temporary)
sessionStorage.setItem('aitor_api_token', token)
const storedToken = sessionStorage.getItem('aitor_api_token')

// Added to request headers
headers['x-openai-token'] = storedToken
```

### Context Enhancement

```typescript
// Location and time context added to messages
const enhancedQuery = `[CONTEXT: User is located in ${location}, 
  current local time: ${time}]\n\n${query}`
```

## Consequences

### Positive
- **API key security** - Keys never exposed in client code
- **Flexibility** - Works with server or user-provided keys
- **Centralized prompt** - System prompt maintained in one place
- **Error handling** - Server can provide friendly error messages
- **Usage tracking** - Can log/monitor API usage
- **Future extensibility** - Easy to add other AI providers

### Negative
- **Added latency** - Extra hop through our server
- **Server costs** - Our server processes all AI requests
- **Dependency** - Relies on OpenAI API availability
- **Cost management** - Need to handle billing for server key usage

### Security Considerations

1. **User tokens stored in sessionStorage** - Cleared on browser close
2. **Token validation** - Basic format check before use
3. **No token persistence** - User re-enters token each session
4. **Error messages sanitized** - Don't leak API details to client

### Model Usage

| Scenario | Model | Reason |
|----------|-------|--------|
| Text only | gpt-4o-mini | Faster, cheaper for text |
| With image | gpt-4o | Vision capability needed |

### Rate Limiting Strategy

Currently relies on OpenAI's rate limits. Future consideration:
- Implement server-side rate limiting per IP
- Add queue for high-traffic periods
- Cache common responses










