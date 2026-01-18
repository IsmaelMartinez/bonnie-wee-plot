# Research: AI-Powered Inventory Management via Chat

**Research Date:** 2026-01-18
**Objective:** Explore how to enable Aitor (AI advisor) to insert/edit/update plantings through natural language chat interface

---

## Executive Summary

This research explores implementing chat-based inventory management for the Scottish Grow Guide, allowing users to manage their garden plantings through natural language conversations with Aitor. The recommended approach uses **OpenAI's Function Calling API** (now called "Tools API") to enable structured actions while maintaining conversational UX.

**Key Findings:**
- ✅ OpenAI's Tools API is mature and well-suited for this use case
- ✅ Current architecture already supports the needed CRUD operations
- ✅ Implementation requires API route modifications and UI feedback components
- ⚠️ User confirmation flow is critical for data safety
- ⚠️ Error handling and validation need careful design

---

## Current Architecture Analysis

### 1. AI Advisor (`src/app/api/ai-advisor/route.ts`)

**Current Flow:**
```
User Input → API Route → OpenAI Chat Completions → Text Response → User
```

**Capabilities:**
- Uses OpenAI `gpt-4o-mini` for text, `gpt-4o` for vision
- Includes allotment context in system prompt (read-only)
- Supports user-provided API tokens (BYO key)
- No function calling currently implemented

### 2. Data Model (`src/types/unified-allotment.ts`)

**Key Types:**
```typescript
interface Planting {
  id: string
  plantId: string              // Reference to vegetable database
  varietyName?: string
  sowDate?: string             // ISO date
  transplantDate?: string
  harvestDate?: string
  success?: PlantingSuccess
  notes?: string
  quantity?: number
}

interface Area {
  id: string                   // e.g., 'bed-a', 'apple-north'
  name: string
  kind: AreaKind              // 'rotation-bed', 'perennial-bed', 'tree', etc.
  canHavePlantings: boolean
  rotationGroup?: RotationGroup
  // ... more fields
}
```

### 3. State Management (`src/hooks/useAllotment.ts`)

**Available Operations:**
```typescript
// CRUD operations for plantings
addPlanting(areaId: string, planting: NewPlanting): void
updatePlanting(areaId: string, plantingId: string, updates: PlantingUpdate): void
removePlanting(areaId: string, plantingId: string): void
getPlantings(areaId: string): Planting[]

// Area operations
getArea(id: string): Area | undefined
getAreasByKind(kind: AreaKind): Area[]
getAllAreas(): Area[]
```

**Integration Point:** Hook already provides all necessary operations, backed by localStorage with debounced saves and multi-tab sync.

---

## OpenAI Function Calling Research

### API Evolution (2025-2026)

The OpenAI API has evolved:
- **Deprecated:** `functions` and `function_call` parameters
- **Current:** `tools` and `tool_choice` parameters
- **New:** Responses API with multi-tool agentic capabilities

### How Function Calling Works

1. **Define Tools in API Request**
```typescript
{
  model: "gpt-4o-mini",
  messages: [...],
  tools: [
    {
      type: "function",
      function: {
        name: "add_planting",
        description: "Add a new plant to a specific bed or area in the garden",
        parameters: {
          type: "object",
          properties: {
            areaId: { type: "string", description: "The bed/area ID (e.g., 'bed-a')" },
            plantId: { type: "string", description: "Plant identifier from database" },
            varietyName: { type: "string", description: "Specific variety name" },
            sowDate: { type: "string", description: "Sowing date in YYYY-MM-DD format" }
          },
          required: ["areaId", "plantId"]
        }
      }
    }
  ],
  tool_choice: "auto" // or "required" or specific tool
}
```

2. **Model Returns Function Call**
```typescript
{
  choices: [{
    message: {
      role: "assistant",
      content: null,  // May be null if only calling function
      tool_calls: [{
        id: "call_abc123",
        type: "function",
        function: {
          name: "add_planting",
          arguments: '{"areaId":"bed-a","plantId":"tomato","varietyName":"San Marzano","sowDate":"2026-03-15"}'
        }
      }]
    }
  }]
}
```

3. **Execute Function & Return Result**
```typescript
// Server executes the function
const result = addPlanting("bed-a", { plantId: "tomato", ... })

// Return result to model
{
  role: "tool",
  tool_call_id: "call_abc123",
  content: JSON.stringify({ success: true, plantingId: "p123" })
}
```

4. **Model Generates User-Facing Response**
```
"I've added San Marzano tomatoes to Bed A with a sowing date of March 15, 2026!"
```

### Best Practices from Research

**Function Descriptions (Critical!):**
- Front-load critical rules at the beginning
- Include when function should/shouldn't be used
- Add few-shot examples for complex parameters
- Be explicit about prerequisites (e.g., "only call if bed exists")

**Developer Prompt Guidance:**
- Set clear proactiveness boundaries
- Outline explicit ordering for multi-step operations
- Establish agent role and capabilities

**Error Handling:**
- Use `strict: true` mode for schema adherence
- Validate arguments before execution
- Return errors to model with context
- Instruct model: "Do NOT promise to call a function later. If required, emit it now."

**Parallel Function Calls:**
- Modern models support multiple simultaneous calls
- Reduces round trips for batch operations
- Example: "Add tomatoes to bed A and basil to bed B"

---

## Recommended Implementation Approach

### Phase 1: Core Function Calling (MVP)

**1.1 Define Tool Schema**

Create `src/lib/ai-tools-schema.ts`:

```typescript
export const PLANTING_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "add_planting",
      description: "Add a new plant to a bed or area. Only call this when the user explicitly wants to add a plant. Confirm the bed/area exists before calling. Include sowing date if mentioned.",
      parameters: {
        type: "object",
        properties: {
          areaId: {
            type: "string",
            description: "The bed or area ID where plant will be added (e.g., 'bed-a', 'bed-b1'). Must be a valid existing area."
          },
          plantId: {
            type: "string",
            description: "Plant identifier from the vegetable database (e.g., 'tomato', 'carrot', 'lettuce')"
          },
          varietyName: {
            type: "string",
            description: "Specific variety name if mentioned (e.g., 'San Marzano', 'Nantes 2')"
          },
          sowDate: {
            type: "string",
            description: "Sowing date in YYYY-MM-DD format. Use current year if not specified."
          },
          quantity: {
            type: "number",
            description: "Number of plants or seeds if mentioned"
          },
          notes: {
            type: "string",
            description: "Any additional notes about this planting"
          }
        },
        required: ["areaId", "plantId"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "update_planting",
      description: "Update an existing planting's information. Only call when user wants to modify existing plant details. Do not use for adding new plants.",
      parameters: {
        type: "object",
        properties: {
          areaId: { type: "string", description: "The bed/area containing the planting" },
          plantId: { type: "string", description: "Which plant to update (search by plant type)" },
          updates: {
            type: "object",
            properties: {
              varietyName: { type: "string" },
              sowDate: { type: "string", description: "YYYY-MM-DD format" },
              transplantDate: { type: "string", description: "YYYY-MM-DD format" },
              harvestDate: { type: "string", description: "YYYY-MM-DD format" },
              success: {
                type: "string",
                enum: ["excellent", "good", "fair", "poor", "failed"],
                description: "How well the planting performed"
              },
              notes: { type: "string" },
              quantity: { type: "number" }
            }
          }
        },
        required: ["areaId", "plantId", "updates"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "remove_planting",
      description: "Remove a plant from a bed. Only use when user explicitly wants to delete/remove a planting. This is destructive and cannot be undone.",
      parameters: {
        type: "object",
        properties: {
          areaId: { type: "string", description: "The bed/area ID" },
          plantId: { type: "string", description: "Which plant to remove" }
        },
        required: ["areaId", "plantId"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "list_areas",
      description: "Get a list of all beds and areas in the garden to help users know where they can plant",
      parameters: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: ["rotation-bed", "perennial-bed", "tree", "berry", "herb", "infrastructure", "other"],
            description: "Optional filter by area type"
          }
        }
      }
    }
  }
]
```

**1.2 Update API Route**

Modify `src/app/api/ai-advisor/route.ts`:

```typescript
import { PLANTING_TOOLS } from '@/lib/ai-tools-schema'

export async function POST(request: NextRequest) {
  // ... existing validation ...

  // Add tools to API request
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: apiMessages,
      tools: PLANTING_TOOLS,           // ← ADD THIS
      tool_choice: "auto",              // ← ADD THIS
      max_tokens: 1500,
      temperature: 0.7,
      // ... other params
    }),
  })

  const data = await response.json()
  const message = data.choices[0]?.message

  // Check if model wants to call a function
  if (message.tool_calls && message.tool_calls.length > 0) {
    // Return tool calls to client for execution
    return NextResponse.json({
      type: 'tool_calls',
      tool_calls: message.tool_calls,
      requires_confirmation: true  // Flag for UI confirmation
    })
  }

  // Regular text response
  return NextResponse.json({
    type: 'text',
    response: message.content,
    usage: data.usage
  })
}
```

**1.3 Create Tool Execution Service**

Create `src/services/ai-tool-executor.ts`:

```typescript
import { AllotmentData, NewPlanting } from '@/types/unified-allotment'
import {
  addPlanting as storageAddPlanting,
  updatePlanting as storageUpdatePlanting,
  removePlanting as storageRemovePlanting,
  getAreaById,
  getPlantingsForArea
} from '@/services/allotment-storage'

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string // JSON string
  }
}

export interface ToolResult {
  tool_call_id: string
  success: boolean
  result?: unknown
  error?: string
}

export async function executeToolCall(
  toolCall: ToolCall,
  allotmentData: AllotmentData,
  currentYear: number
): Promise<{ updatedData: AllotmentData; result: ToolResult }> {
  const { id, function: func } = toolCall
  const args = JSON.parse(func.arguments)

  try {
    switch (func.name) {
      case 'add_planting': {
        // Validate area exists
        const area = getAreaById(allotmentData, args.areaId)
        if (!area) {
          throw new Error(`Area '${args.areaId}' not found`)
        }
        if (!area.canHavePlantings) {
          throw new Error(`Area '${args.areaId}' cannot have plantings`)
        }

        // Create planting
        const planting: NewPlanting = {
          plantId: args.plantId,
          varietyName: args.varietyName,
          sowDate: args.sowDate,
          quantity: args.quantity,
          notes: args.notes
        }

        const updatedData = storageAddPlanting(
          allotmentData,
          currentYear,
          args.areaId,
          planting
        )

        return {
          updatedData,
          result: {
            tool_call_id: id,
            success: true,
            result: {
              message: `Added ${args.plantId} to ${args.areaId}`,
              planting
            }
          }
        }
      }

      case 'update_planting': {
        // Find the planting to update
        const plantings = getPlantingsForArea(allotmentData, currentYear, args.areaId)
        const planting = plantings.find(p => p.plantId === args.plantId)

        if (!planting) {
          throw new Error(`Planting '${args.plantId}' not found in ${args.areaId}`)
        }

        const updatedData = storageUpdatePlanting(
          allotmentData,
          currentYear,
          args.areaId,
          planting.id,
          args.updates
        )

        return {
          updatedData,
          result: {
            tool_call_id: id,
            success: true,
            result: {
              message: `Updated ${args.plantId} in ${args.areaId}`,
              updates: args.updates
            }
          }
        }
      }

      case 'remove_planting': {
        const plantings = getPlantingsForArea(allotmentData, currentYear, args.areaId)
        const planting = plantings.find(p => p.plantId === args.plantId)

        if (!planting) {
          throw new Error(`Planting '${args.plantId}' not found in ${args.areaId}`)
        }

        const updatedData = storageRemovePlanting(
          allotmentData,
          currentYear,
          args.areaId,
          planting.id
        )

        return {
          updatedData,
          result: {
            tool_call_id: id,
            success: true,
            result: { message: `Removed ${args.plantId} from ${args.areaId}` }
          }
        }
      }

      case 'list_areas': {
        const areas = args.kind
          ? allotmentData.layout.areas.filter(a => a.kind === args.kind)
          : allotmentData.layout.areas

        return {
          updatedData: allotmentData, // No changes
          result: {
            tool_call_id: id,
            success: true,
            result: {
              areas: areas.map(a => ({
                id: a.id,
                name: a.name,
                kind: a.kind,
                canHavePlantings: a.canHavePlantings
              }))
            }
          }
        }
      }

      default:
        throw new Error(`Unknown function: ${func.name}`)
    }
  } catch (error) {
    return {
      updatedData: allotmentData, // No changes on error
      result: {
        tool_call_id: id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
```

**1.4 Update Frontend (`src/app/ai-advisor/page.tsx`)**

```typescript
// Add state for pending tool calls
const [pendingToolCalls, setPendingToolCalls] = useState<ToolCall[] | null>(null)

// Modify handleSubmit to handle tool calls
const handleSubmit = async (query: string, image?: File) => {
  // ... existing message handling ...

  try {
    const data = await callOpenAI({ /* ... */ })

    // Check if response contains tool calls
    if (data.type === 'tool_calls') {
      setPendingToolCalls(data.tool_calls)

      // Add assistant message explaining what it wants to do
      const explanationMessage: ExtendedChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'd like to make the following changes to your garden:\n\n${formatToolCallsForUser(data.tool_calls)}\n\nShall I proceed?`
      }
      setMessages(prev => [...prev, explanationMessage])
      return // Wait for user confirmation
    }

    // Regular text response
    const aiResponse: ExtendedChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: data.response
    }
    setMessages(prev => [...prev, aiResponse])

  } catch (error) {
    // ... error handling ...
  }
}

// Add confirmation handler
const handleConfirmToolCalls = async (approved: boolean) => {
  if (!pendingToolCalls) return

  if (!approved) {
    // User declined
    const declineMessage: ExtendedChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: "No problem! I won't make those changes. What else can I help with?"
    }
    setMessages(prev => [...prev, declineMessage])
    setPendingToolCalls(null)
    return
  }

  // User approved - execute tools
  try {
    const results: ToolResult[] = []
    let currentData = allotmentData!

    for (const toolCall of pendingToolCalls) {
      const { updatedData, result } = await executeToolCall(
        toolCall,
        currentData,
        selectedYear
      )
      currentData = updatedData
      results.push(result)
    }

    // Save updated data (triggers useAllotment hook update)
    saveAllotmentData(currentData)

    // Continue conversation with results
    const successMessage: ExtendedChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: "✅ Done! I've updated your garden records. Anything else you'd like to add?"
    }
    setMessages(prev => [...prev, successMessage])
    setPendingToolCalls(null)

  } catch (error) {
    const errorMessage: ExtendedChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `⚠️ Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
    setMessages(prev => [...prev, errorMessage])
    setPendingToolCalls(null)
  }
}
```

**1.5 Create Confirmation UI Component**

Create `src/components/ai-advisor/ToolCallConfirmation.tsx`:

```typescript
interface Props {
  toolCalls: ToolCall[]
  onConfirm: (approved: boolean) => void
}

export function ToolCallConfirmation({ toolCalls, onConfirm }: Props) {
  return (
    <div className="zen-card p-4 border-zen-water-200 bg-zen-water-50">
      <div className="flex items-start gap-3 mb-3">
        <AlertCircle className="w-5 h-5 text-zen-water-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-zen-ink-800 mb-2">
            Confirm Changes
          </h3>
          <div className="space-y-2 text-sm text-zen-ink-700">
            {toolCalls.map((call, i) => (
              <div key={call.id} className="flex items-start gap-2">
                <span className="text-zen-stone-400">•</span>
                <span>{formatToolCallForUser(call)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={() => onConfirm(false)}
          className="px-4 py-2 text-zen-stone-600 hover:bg-zen-stone-100 rounded-zen"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(true)}
          className="px-4 py-2 bg-zen-moss-500 text-white hover:bg-zen-moss-600 rounded-zen"
        >
          Confirm Changes
        </button>
      </div>
    </div>
  )
}

function formatToolCallForUser(call: ToolCall): string {
  const args = JSON.parse(call.function.arguments)

  switch (call.function.name) {
    case 'add_planting':
      return `Add ${args.varietyName || args.plantId} to ${args.areaId}${args.sowDate ? ` (sowing: ${args.sowDate})` : ''}`
    case 'update_planting':
      return `Update ${args.plantId} in ${args.areaId}`
    case 'remove_planting':
      return `Remove ${args.plantId} from ${args.areaId}`
    default:
      return `Execute ${call.function.name}`
  }
}
```

### Phase 2: Enhanced Features

**2.1 Smart Plant ID Resolution**

Add fuzzy matching for plant names:

```typescript
import { searchVegetables } from '@/lib/vegetable-database'

function resolvePlantId(userInput: string): string | null {
  // Try exact match first
  const exact = getVegetableById(userInput.toLowerCase())
  if (exact) return exact.id

  // Fuzzy search
  const results = searchVegetables(userInput)
  if (results.length === 1) return results[0].id

  // Multiple matches - need clarification
  if (results.length > 1) {
    throw new Error(`Multiple plants match "${userInput}": ${results.map(r => r.name).join(', ')}. Please be more specific.`)
  }

  throw new Error(`Plant "${userInput}" not found in database`)
}
```

**2.2 Batch Operations**

Support multiple operations in one message:

```
User: "I planted tomatoes in bed A, basil in bed B, and carrots in bed C on March 15th"

→ Model returns 3 parallel add_planting calls
→ UI shows all 3 in confirmation dialog
→ Execute all on approval
```

**2.3 Conversational Context**

Maintain planting context across conversation:

```
User: "I planted tomatoes in bed A"
Aitor: [adds tomatoes, remembers context]

User: "Actually make it San Marzano variety"
Aitor: [updates the tomato planting with variety name]

User: "And add a note that it's from saved seeds"
Aitor: [updates notes field]
```

**2.4 Proactive Suggestions**

Enhanced system prompt:

```typescript
const ENHANCED_SYSTEM_PROMPT = `
...existing prompt...

🔧 TOOL USAGE GUIDELINES:

When users mention planting, sowing, or adding plants:
- Offer to add it to their records: "Would you like me to add that to your garden plan?"
- Confirm bed/area location before adding
- Use today's date if not specified
- Ask for variety name if it seems like a specific cultivar

When users ask "what did I plant in bed A?":
- Use list_areas and current context to answer
- Don't make changes unless explicitly requested

ALWAYS confirm destructive actions (remove_planting) with explicit user approval.
`
```

### Phase 3: Advanced Features (Future)

**3.1 Natural Language Date Parsing**

```typescript
import { parseDate } from 'chrono-node'

function parseUserDate(input: string): string {
  // "last week" → "2026-01-11"
  // "yesterday" → "2026-01-17"
  // "March 15th" → "2026-03-15"
  const parsed = parseDate(input)
  return parsed.toISOString().split('T')[0]
}
```

**3.2 Bulk Import from Photos**

```
User: [uploads photo of handwritten garden journal]
Aitor: "I can see you've noted planting dates for several crops. Would you like me to add these to your digital records?"
```

**3.3 Variety Sync Integration**

Link with variety management:

```typescript
// When adding a planting, auto-create variety if needed
if (!varietyExists(plantId, varietyName)) {
  suggestAddingToVarietyLibrary(plantId, varietyName)
}
```

**3.4 Rotation Validation**

Check rotation rules before adding:

```typescript
function validateRotation(areaId: string, plantId: string, year: number): ValidationResult {
  const history = getRotationHistory(areaId)
  const plant = getVegetableById(plantId)
  const currentGroup = plant.rotationGroup

  // Check if same group was in this bed recently
  const recentGroups = history.slice(-3).map(h => h.group)
  if (recentGroups.includes(currentGroup)) {
    return {
      valid: false,
      warning: `⚠️ ${plant.name} is in the ${currentGroup} group, which was recently in this bed. Consider rotating to a different group.`
    }
  }

  return { valid: true }
}
```

---

## Security & Safety Considerations

### 1. Data Validation

**Client-Side:**
- Validate tool call arguments match expected schema
- Check area IDs exist before execution
- Verify plant IDs are in database

**Server-Side:**
- Use Zod schemas for strict validation
- Sanitize all user inputs
- Rate limit function calls separately from chat

### 2. User Consent

**Critical Principle:** Never modify data without explicit user confirmation

**Confirmation Flow:**
```
1. AI suggests action → Show preview
2. User approves → Execute & save
3. User declines → Cancel gracefully
```

**Exceptions:** Read-only operations (list_areas) don't need confirmation

### 3. Undo Capability

Consider adding undo for recent AI actions:

```typescript
interface ActionHistory {
  timestamp: string
  action: 'add' | 'update' | 'remove'
  data: { before: unknown; after: unknown }
  undoable: boolean
}

// Store last 10 actions
const [actionHistory, setActionHistory] = useState<ActionHistory[]>([])

function undo(actionId: string) {
  // Restore previous state
}
```

### 4. Audit Trail

Log all AI-initiated changes:

```typescript
interface AuditLog {
  timestamp: string
  action: string
  args: unknown
  result: 'success' | 'error'
  userApproved: boolean
}

// Stored in localStorage or sent to analytics
```

---

## UX Considerations

### 1. Progressive Disclosure

**Level 1: Passive Assistant (Default)**
- Answers questions, provides advice
- Doesn't suggest adding to records
- User must explicitly say "add this to my garden"

**Level 2: Proactive Helper**
- Offers to add plantings when mentioned
- "Would you like me to add that to your records?"

**Level 3: Autonomous Agent (Opt-in)**
- Automatically adds obvious plantings
- Still requires confirmation for removals

### 2. Feedback & Transparency

**Show What's Happening:**
```
[Confirmation Dialog]
✓ Adding San Marzano tomatoes to Bed A
✓ Sowing date: March 15, 2026
✓ Quantity: 12 plants

[Approve] [Decline]
```

**After Execution:**
```
Aitor: "✅ Done! I've added 12 San Marzano tomato plants to Bed A with
a sowing date of March 15th. You can see them in your Garden Planner."

[View in Planner →]
```

### 3. Error Recovery

**Graceful Failures:**
```
Aitor: "⚠️ I couldn't add those tomatoes to Bed C because that bed doesn't
exist in your layout. Did you mean Bed A, B, or D?"

[Bed A] [Bed B] [Bed D] [Cancel]
```

### 4. Mobile Experience

- Large touch targets for approve/decline buttons
- Swipe gestures for undo
- Voice input for hands-free garden logging

---

## Implementation Roadmap

### Milestone 1: Basic Function Calling (1-2 days)
- [ ] Create tool schema definitions
- [ ] Update API route to support tools
- [ ] Implement tool executor service
- [ ] Add confirmation UI component
- [ ] Basic error handling

**Deliverable:** Users can add plantings via chat with confirmation

### Milestone 2: CRUD Operations (1 day)
- [ ] Implement update_planting
- [ ] Implement remove_planting
- [ ] Add list_areas helper
- [ ] Enhanced validation

**Deliverable:** Full CRUD via chat

### Milestone 3: UX Polish (1-2 days)
- [ ] Batch operations support
- [ ] Better error messages
- [ ] Loading states for tool execution
- [ ] Success animations
- [ ] Link to garden planner from confirmations

**Deliverable:** Production-ready UX

### Milestone 4: Smart Features (2-3 days)
- [ ] Fuzzy plant name matching
- [ ] Natural date parsing
- [ ] Rotation validation warnings
- [ ] Variety sync integration
- [ ] Undo capability

**Deliverable:** Intelligent assistant

### Milestone 5: Advanced (Future)
- [ ] Photo-based bulk import
- [ ] Voice commands
- [ ] Automated reminders
- [ ] Multi-language support

---

## Testing Strategy

### Unit Tests

```typescript
describe('AI Tool Executor', () => {
  it('should add planting to valid area', () => {
    const data = mockAllotmentData()
    const result = executeToolCall({
      function: { name: 'add_planting', arguments: '{"areaId":"bed-a","plantId":"tomato"}' }
    }, data, 2026)

    expect(result.success).toBe(true)
    expect(result.updatedData.seasons[0].areas[0].plantings).toHaveLength(1)
  })

  it('should reject planting to non-existent area', () => {
    const data = mockAllotmentData()
    const result = executeToolCall({
      function: { name: 'add_planting', arguments: '{"areaId":"bed-z","plantId":"tomato"}' }
    }, data, 2026)

    expect(result.success).toBe(false)
    expect(result.error).toContain('not found')
  })
})
```

### Integration Tests

```typescript
describe('AI Chat Function Calling', () => {
  it('should complete add planting flow', async () => {
    const { getByRole, getByText } = render(<AIAdvisorPage />)

    // Send message
    await userEvent.type(getByRole('textbox'), 'Add tomatoes to bed A')
    await userEvent.click(getByText('Send'))

    // Wait for confirmation dialog
    await waitFor(() => {
      expect(getByText(/Confirm Changes/i)).toBeInTheDocument()
    })

    // Approve
    await userEvent.click(getByText('Confirm Changes'))

    // Verify success message
    await waitFor(() => {
      expect(getByText(/Done! I've added/i)).toBeInTheDocument()
    })
  })
})
```

### E2E Tests (Playwright)

```typescript
test('AI assistant adds planting via chat', async ({ page }) => {
  await page.goto('/ai-advisor')

  // Enter OpenAI token
  await page.click('[aria-label="Configure API Token"]')
  await page.fill('input[type="password"]', process.env.OPENAI_TOKEN!)
  await page.click('text=Save Token')

  // Send chat message
  await page.fill('textarea', 'Add San Marzano tomatoes to bed A, sowing date March 15')
  await page.click('text=Send')

  // Wait for AI response with confirmation
  await page.waitForSelector('text=Confirm Changes')

  // Approve changes
  await page.click('text=Confirm Changes')

  // Verify success
  await expect(page.locator('text=Done! I\'ve added')).toBeVisible()

  // Verify in garden planner
  await page.goto('/garden-planner')
  await expect(page.locator('text=San Marzano')).toBeVisible()
})
```

---

## Cost & Performance Considerations

### API Costs

**Current:** ~$0.15 per 1M tokens (gpt-4o-mini)

**With Function Calling:**
- Tool definitions add ~500 tokens per request
- Tool results add ~200 tokens per function
- Multi-turn conversations for confirmations

**Estimated Impact:** +30% token usage

**Mitigation:**
- Use concise tool descriptions
- Batch multiple operations
- Cache tool schemas in context

### Performance

**Latency:**
- Function call request: ~2-3s (same as current)
- Tool execution: <100ms (local)
- Confirmation flow: +user interaction time

**Optimization:**
- Execute read-only tools immediately
- Show optimistic UI for approved actions
- Pre-validate arguments before API call

---

## Alternative Approaches Considered

### 1. ❌ Regex/NLP Parsing (Without LLM Function Calling)

**Approach:** Parse user messages with regex patterns

**Pros:**
- No additional API costs
- Faster response
- Full control over logic

**Cons:**
- Brittle, breaks on variations
- Can't handle complex/ambiguous input
- Requires extensive pattern library
- Poor user experience with failures

**Verdict:** Not recommended for natural language interface

### 2. ❌ Structured Forms with AI Prefill

**Approach:** AI suggests values, user fills form

**Pros:**
- Clear data entry
- Easy validation
- No ambiguity

**Cons:**
- Defeats purpose of natural language
- Extra clicks/friction
- Not conversational

**Verdict:** Better as fallback for complex edits

### 3. ✅ Hybrid: LLM Function Calling + Manual Forms

**Approach:** Use function calling for simple operations, forms for complex ones

**Example:**
- "Add tomatoes" → Function call ✓
- "Update all beds with new rotation" → "Let me open the planner for you" + link

**Verdict:** Best of both worlds (Recommended)

### 4. ⚠️ Assistants API with Built-in Tools

**Approach:** Use OpenAI Assistants API instead of Chat Completions

**Pros:**
- Manages conversation state server-side
- Built-in code interpreter
- File handling

**Cons:**
- More complex API
- Higher cost
- Less control over flow
- Requires separate storage

**Verdict:** Overkill for this use case

---

## Research Sources

### OpenAI Function Calling
- [Function calling | OpenAI API](https://platform.openai.com/docs/guides/function-calling)
- [Using tools | OpenAI API](https://platform.openai.com/docs/guides/tools)
- [o3/o4-mini Function Calling Guide | OpenAI Cookbook](https://cookbook.openai.com/examples/o-series/o3o4-mini_prompting_guide)
- [Tool Calling Using the OpenAI Python SDK](https://medium.com/@laurentkubaski/openai-tool-calling-using-the-python-sdk-full-example-with-best-practices-29af7c651f08)

### Natural Language CRUD Patterns
- [CRUD with Natural Language Processing using Microsoft.Extensions.AI](https://dev.to/baraneetharan/crud-with-natural-language-processing-using-microsoftextensionsai-417o)
- [5 Best AI Chatbot Builders in 2026](https://emergent.sh/learn/best-ai-chatbot-builders)
- [The best AI chatbots in 2026 | Zapier](https://zapier.com/blog/best-ai-chatbot/)

---

## Next Steps

1. **Validate Approach:** Review this research with team/stakeholders
2. **Prototype:** Build Milestone 1 (basic function calling)
3. **User Testing:** Test with real gardeners for UX feedback
4. **Iterate:** Refine based on feedback
5. **Scale:** Add advanced features as needed

---

## Questions for Discussion

1. **Confirmation Level:** Should we require confirmation for all operations, or allow "auto-approve" for additions only?

2. **Error Handling:** How should we handle ambiguous requests like "add tomatoes" when user has multiple tomato varieties?

3. **Undo Window:** Should we provide undo for AI actions? If so, for how long?

4. **Mobile Voice:** Is voice input a priority for this feature?

5. **Privacy:** Should we allow users to opt-out of AI data modifications entirely?

6. **Audit Trail:** Should we show a log of all AI-made changes in the UI?

---

## Conclusion

Implementing chat-based inventory management is **technically feasible** and **architecturally sound** given the current codebase structure. The recommended approach using OpenAI's Function Calling API provides a good balance of:

✅ **Natural UX** - Conversational interface
✅ **Safety** - Explicit user confirmation
✅ **Flexibility** - Extensible tool system
✅ **Maintainability** - Leverages existing CRUD operations

**Recommended Start:** Implement Milestone 1 as a prototype to validate the approach, then iterate based on real user feedback.

The key success factor will be **UX design** - making the confirmation flow feel natural and trustworthy, not disruptive or confusing.
