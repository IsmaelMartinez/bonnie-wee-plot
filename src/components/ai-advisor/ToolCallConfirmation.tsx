/**
 * ToolCallConfirmation Component
 *
 * Displays pending AI tool calls and allows the user to approve or decline them.
 * Shows a preview of what changes the AI wants to make to the garden data.
 */

'use client'

import { AlertCircle, Check, X, Loader2 } from 'lucide-react'
import { ToolCall, formatToolCallForUser, requiresConfirmation } from '@/lib/ai-tools-schema'
import { getVegetableById } from '@/lib/vegetable-database'

interface ToolCallConfirmationProps {
  /** The tool calls pending confirmation */
  toolCalls: ToolCall[]
  /** Called when user approves or declines */
  onConfirm: (approved: boolean) => void
  /** Whether the tool calls are currently being executed */
  isExecuting?: boolean
}

/**
 * Main confirmation dialog for AI tool calls
 */
export function ToolCallConfirmation({
  toolCalls,
  onConfirm,
  isExecuting = false,
}: ToolCallConfirmationProps) {
  // Filter to only tool calls that require confirmation
  const confirmableCalls = toolCalls.filter(tc =>
    requiresConfirmation(tc.function.name)
  )

  if (confirmableCalls.length === 0) {
    return null
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
