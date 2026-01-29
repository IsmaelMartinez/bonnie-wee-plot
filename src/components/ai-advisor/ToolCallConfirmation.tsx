/**
 * ToolCallConfirmation Component
 *
 * Displays pending AI tool calls and allows the user to approve or decline them.
 * Shows a preview of what changes the AI wants to make to the garden data.
 * Handles plant disambiguation when AI uses a generic plant name like "tomatoes".
 */

'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, Check, X, Loader2, HelpCircle } from 'lucide-react'
import { ToolCall, formatToolCallForUser, requiresConfirmation } from '@/lib/ai-tools-schema'
import { getVegetableById } from '@/lib/vegetable-database'
import { checkPlantDisambiguation, PlantSuggestion } from '@/services/ai-tool-executor'

interface ToolCallConfirmationProps {
  /** The tool calls pending confirmation */
  toolCalls: ToolCall[]
  /** Called when user approves or declines */
  onConfirm: (approved: boolean) => void
  /** Called when user selects a plant from disambiguation options */
  onPlantSelected?: (toolCallId: string, selectedPlantId: string) => void
  /** Whether the tool calls are currently being executed */
  isExecuting?: boolean
}

interface DisambiguationInfo {
  toolCallId: string
  originalInput: string
  suggestions: PlantSuggestion[]
}

/**
 * Check if a tool call needs plant disambiguation
 */
function getDisambiguationNeeded(toolCall: ToolCall): DisambiguationInfo | null {
  try {
    const args = JSON.parse(toolCall.function.arguments)
    if (!args.plantId) return null

    const result = checkPlantDisambiguation(args.plantId)
    if (result.needsDisambiguation && result.suggestions && result.suggestions.length > 0) {
      return {
        toolCallId: toolCall.id,
        originalInput: result.originalInput,
        suggestions: result.suggestions,
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Main confirmation dialog for AI tool calls
 */
export function ToolCallConfirmation({
  toolCalls,
  onConfirm,
  onPlantSelected,
  isExecuting = false,
}: ToolCallConfirmationProps) {
  const [disambiguations, setDisambiguations] = useState<DisambiguationInfo[]>([])

  // Check for disambiguation needs when tool calls change
  useEffect(() => {
    const needed: DisambiguationInfo[] = []
    for (const tc of toolCalls) {
      const info = getDisambiguationNeeded(tc)
      if (info) needed.push(info)
    }
    setDisambiguations(needed)
  }, [toolCalls])

  // Filter to only tool calls that require confirmation
  const confirmableCalls = toolCalls.filter(tc =>
    requiresConfirmation(tc.function.name)
  )

  if (confirmableCalls.length === 0) {
    return null
  }

  // If disambiguation needed, show that UI first
  if (disambiguations.length > 0 && onPlantSelected) {
    const firstDisambig = disambiguations[0]
    return (
      <PlantDisambiguation
        originalInput={firstDisambig.originalInput}
        suggestions={firstDisambig.suggestions}
        onSelect={(plantId) => onPlantSelected(firstDisambig.toolCallId, plantId)}
        onCancel={() => onConfirm(false)}
      />
    )
  }

  const isBatchOperation = confirmableCalls.length > 1

  return (
    <div
      className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-3"
      role="alertdialog"
      aria-labelledby="tool-confirm-title"
      aria-describedby="tool-confirm-desc"
    >
      <div className="flex items-start gap-3 mb-3">
        {isExecuting ? (
          <Loader2
            className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 animate-spin"
            aria-hidden="true"
          />
        ) : (
          <AlertCircle
            className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
        )}
        <div className="flex-1">
          <h3
            id="tool-confirm-title"
            className="font-medium text-gray-800 mb-2"
          >
            {isExecuting ? 'Applying Changes...' : 'Confirm Changes'}
          </h3>
          <p
            id="tool-confirm-desc"
            className="text-sm text-gray-600 mb-3"
          >
            {isExecuting
              ? `Updating your garden records (${confirmableCalls.length} ${isBatchOperation ? 'changes' : 'change'})...`
              : `Aitor would like to make the following ${isBatchOperation ? `${confirmableCalls.length} changes` : 'change'} to your garden:`}
          </p>
          <div className={`space-y-2 ${isExecuting ? 'opacity-60' : ''}`} role="list" aria-label="Proposed changes">
            {confirmableCalls.map((call, index) => (
              <ToolCallItem
                key={call.id}
                toolCall={call}
                isExecuting={isExecuting}
                index={index}
                total={confirmableCalls.length}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end mt-4">
        <button
          onClick={() => onConfirm(false)}
          disabled={isExecuting}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Decline changes"
        >
          <X className="w-4 h-4" aria-hidden="true" />
          Cancel
        </button>
        <button
          onClick={() => onConfirm(true)}
          disabled={isExecuting}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Approve changes"
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Applying...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" aria-hidden="true" />
              {isBatchOperation ? `Confirm All (${confirmableCalls.length})` : 'Confirm'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

interface ToolCallItemProps {
  toolCall: ToolCall
  isExecuting?: boolean
  index?: number
  total?: number
}

/**
 * Individual tool call item in the confirmation list
 */
function ToolCallItem({ toolCall, isExecuting = false, index = 0, total = 1 }: ToolCallItemProps) {
  const details = getToolCallDetails(toolCall)

  return (
    <div
      className={`flex items-start gap-2 text-sm text-gray-700 bg-white p-2 rounded border transition-all ${
        isExecuting ? 'border-amber-300' : 'border-amber-100'
      }`}
      role="listitem"
    >
      {isExecuting ? (
        <Loader2 className="w-4 h-4 text-amber-500 flex-shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        <span className="text-amber-500 flex-shrink-0">{details.icon}</span>
      )}
      <div className="flex-1">
        <span className="font-medium">{details.action}</span>
        {details.extra && (
          <span className="text-gray-500 ml-1">{details.extra}</span>
        )}
      </div>
      {total > 1 && (
        <span className="text-xs text-gray-400 flex-shrink-0">
          {index + 1}/{total}
        </span>
      )}
    </div>
  )
}

interface ToolCallDetails {
  icon: string
  action: string
  extra?: string
}

/**
 * Get human-readable details for a tool call
 */
function getToolCallDetails(toolCall: ToolCall): ToolCallDetails {
  try {
    const args = JSON.parse(toolCall.function.arguments)

    switch (toolCall.function.name) {
      case 'add_planting': {
        const plant = getVegetableById(args.plantId)
        const plantName = args.varietyName
          ? `${args.varietyName} (${plant?.name || args.plantId})`
          : (plant?.name || args.plantId)
        return {
          icon: '+',
          action: `Add ${plantName} to ${args.areaId}`,
          extra: args.sowDate ? `sowing ${args.sowDate}` : undefined,
        }
      }

      case 'update_planting': {
        const plant = getVegetableById(args.plantId)
        const updateFields = Object.keys(args.updates || {}).join(', ')
        return {
          icon: '~',
          action: `Update ${plant?.name || args.plantId} in ${args.areaId}`,
          extra: updateFields ? `(${updateFields})` : undefined,
        }
      }

      case 'remove_planting': {
        const plant = getVegetableById(args.plantId)
        return {
          icon: '-',
          action: `Remove ${plant?.name || args.plantId} from ${args.areaId}`,
        }
      }

      default:
        return {
          icon: '?',
          action: formatToolCallForUser(toolCall),
        }
    }
  } catch {
    return {
      icon: '?',
      action: formatToolCallForUser(toolCall),
    }
  }
}

/**
 * Plant disambiguation UI - shown when AI uses a generic plant name
 */
function PlantDisambiguation({
  originalInput,
  suggestions,
  onSelect,
  onCancel,
}: {
  originalInput: string
  suggestions: PlantSuggestion[]
  onSelect: (plantId: string) => void
  onCancel: () => void
}) {
  return (
    <div
      className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-3"
      role="dialog"
      aria-labelledby="disambig-title"
    >
      <div className="flex items-start gap-3 mb-3">
        <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <h3 id="disambig-title" className="font-medium text-gray-800 mb-2">
            Which plant did you mean?
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            &ldquo;{originalInput}&rdquo; matches several plants. Please select one:
          </p>
          <div className="space-y-2" role="group" aria-label="Plant options">
            {suggestions.map((plant) => (
              <button
                key={plant.id}
                onClick={() => onSelect(plant.id)}
                className="w-full text-left px-3 py-2 bg-white border border-blue-100 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <span className="font-medium text-gray-800">{plant.name}</span>
                <span className="text-gray-500 text-sm ml-2">({plant.id})</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
          <X className="w-4 h-4" aria-hidden="true" />
          Cancel
        </button>
      </div>
    </div>
  )
}

/**
 * Message shown after successful tool execution
 */
export function ToolExecutionSuccess({
  message,
  onDismiss,
}: {
  message: string
  onDismiss?: () => void
}) {
  return (
    <div
      className="bg-green-50 border border-green-200 rounded-lg p-3 my-3 flex items-start gap-3"
      role="status"
      aria-live="polite"
    >
      <Check className="w-5 h-5 text-green-600 flex-shrink-0" aria-hidden="true" />
      <div className="flex-1 text-sm text-green-800">
        {message}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-green-600 hover:text-green-800"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

/**
 * Message shown after tool execution failure
 */
export function ToolExecutionError({
  message,
  onDismiss,
}: {
  message: string
  onDismiss?: () => void
}) {
  return (
    <div
      className="bg-red-50 border border-red-200 rounded-lg p-3 my-3 flex items-start gap-3"
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" aria-hidden="true" />
      <div className="flex-1 text-sm text-red-800">
        {message}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-600 hover:text-red-800"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

export default ToolCallConfirmation
