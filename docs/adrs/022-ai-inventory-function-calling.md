# ADR 022: AI Advisor Extension with Function Calling for Inventory Management

## Status
Accepted

## Date
2026-01-28

## Context

The AI Advisor ("Aitor") currently provides read-only gardening advice. Users can ask questions and get context-aware responses based on their allotment data, but cannot modify their data through the chat interface.

During the architecture audit, we identified this as a key decision point:

**Option A: Keep Read-Only**
- Aitor remains a pure advisory assistant
- Users manually enter plantings in the Allotment page
- Lower complexity, no data corruption risk
- Natural language planning stays in the chat, execution in traditional UI

**Option B: Extend with Function Calling**
- Enable Aitor to add/update/remove plantings via chat
- More conversational workflow ("Add 3 tomato plants to Bed B")
- Requires user confirmation before data modifications
- Builds toward AI-first interaction model

## Decision

**Chosen: Option B - Extend AI Advisor with Function Calling**

### Rationale

1. **User Value**: Natural language is faster for planning than clicking through forms. A gardener can say "I want to plant peas, broad beans, and lettuce in Bed A this year" instead of opening multiple dialogs.

2. **Existing Infrastructure**: The AI advisor already receives allotment context (ADR 004). Adding function calling is an incremental extension, not a fundamental architecture change.

3. **Safety Model**: User confirmation before any data modification prevents accidental changes. This is similar to how voice assistants handle sensitive actions.

4. **Progressive Disclosure Alignment**: AI capabilities can be revealed as users become more comfortable with the app, supporting the Phase 1 onboarding strategy.

### Implementation Plan

#### Phase 1: Core Tools (Week 2)
- `add_planting` - Add a new planting to an area
- `update_planting` - Modify existing planting (variety, dates, notes)
- `remove_planting` - Delete a planting
- `list_areas` - Query current allotment structure

#### Phase 2: Enhanced Operations (Week 3)
- Batch operations (multiple plantings in one request)
- Copy from previous year
- Suggested plantings based on rotation

### API Changes

```typescript
// New tools parameter in AI advisor route
const tools = [
  {
    type: 'function',
    function: {
      name: 'add_planting',
      description: 'Add a new planting to an area',
      parameters: {
        type: 'object',
        properties: {
          areaId: { type: 'string', description: 'The area/bed ID' },
          plantId: { type: 'string', description: 'The plant/vegetable ID' },
          varietyName: { type: 'string', description: 'Optional variety name' },
          sowMethod: { enum: ['indoor', 'outdoor', 'transplant-purchased'] },
          sowDate: { type: 'string', format: 'date' }
        },
        required: ['areaId', 'plantId']
      }
    }
  }
  // ... more tools
]
```

### Confirmation Flow

```
User: "Add tomatoes to Bed A"
Aitor: "I'll add tomatoes to Bed A. Please confirm:"
       [Card showing: Bed A, Tomato, No variety specified, No date set]
       [Confirm] [Cancel]
User: [Clicks Confirm]
Aitor: "Done! I've added tomatoes to Bed A. Would you like to specify a variety or sow date?"
```

### Files to Create/Modify

New files:
- `src/lib/ai-tools-schema.ts` - Tool definitions with Zod validation
- `src/services/ai-tool-executor.ts` - Execute confirmed tool calls
- `src/components/ai-advisor/ToolCallConfirmation.tsx` - Confirmation UI

Modified files:
- `src/app/api/ai-advisor/route.ts` - Add tools parameter support
- `src/components/ai-advisor/ChatInterface.tsx` - Handle tool call responses

## Consequences

### Positive
- More natural, conversational planning workflow
- Reduces friction for adding plantings
- AI can suggest and execute in one flow
- Foundation for more advanced AI features (photo → planting, voice)

### Negative
- Increased complexity in AI advisor route
- Risk of unexpected data modifications (mitigated by confirmation)
- Dependency on OpenAI function calling API
- Need comprehensive undo capability

### Security Considerations

1. **Confirmation Required**: All data-modifying operations require explicit user confirmation
2. **Validation**: Tool inputs validated with Zod before execution
3. **Audit Trail**: Tool calls logged for debugging
4. **Rollback**: Future: implement undo for recent AI operations

### Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| AI misunderstands request | Show preview card with parsed values before execution |
| Accidental bulk modifications | Limit batch size, require confirmation for each |
| Data corruption | Validate all inputs, run in transaction-like manner |
| User confusion about what AI can do | Clear capability indicators in UI |

## References

- ADR 004: AI Integration via Proxy API Pattern
- ADR 011: Planting Assistant Integration
- Acceleration Plan: docs/plans/2026-01-28-acceleration-plan.md
- OpenAI Function Calling: https://platform.openai.com/docs/guides/function-calling
