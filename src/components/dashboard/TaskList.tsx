import { useState, useRef, KeyboardEvent } from 'react'
import { Scissors, Droplets, TreeDeciduous, Sparkles, CheckCircle2, Sprout, ArrowUpFromLine, Leaf, RotateCcw, Check, Undo2, ChevronDown, ChevronUp, Plus, X, Square, CheckSquare } from 'lucide-react'
import { CustomTask, NewCustomTask, MaintenanceTask, MaintenanceTaskType } from '@/types/unified-allotment'
import { GeneratedTask, GeneratedTaskType, TaskUrgency } from '@/lib/task-generator'
import { SeasonalTheme } from '@/lib/seasonal-theme'

interface TaskListProps {
  customTasks?: CustomTask[]
  tasks: MaintenanceTask[]
  generatedTasks?: GeneratedTask[]
  dismissedTasks?: GeneratedTask[]
  theme: SeasonalTheme
  onAddCustomTask?: (task: NewCustomTask) => void
  onToggleCustomTask?: (taskId: string) => void
  onUpdateCustomTask?: (taskId: string, description: string) => void
  onRemoveCustomTask?: (taskId: string) => void
  onDismissTask?: (taskId: string) => void
  onRestoreTask?: (taskId: string) => void
}

const TASK_CONFIG: Record<MaintenanceTaskType, { icon: typeof Scissors; label: string }> = {
  prune: { icon: Scissors, label: 'Prune' },
  feed: { icon: Droplets, label: 'Feed' },
  mulch: { icon: TreeDeciduous, label: 'Mulch' },
  spray: { icon: Sparkles, label: 'Spray' },
  harvest: { icon: CheckCircle2, label: 'Harvest' },
  other: { icon: Sparkles, label: 'Task' },
}

const GENERATED_TASK_CONFIG: Record<GeneratedTaskType, { icon: typeof Scissors; label: string; color: string }> = {
  'harvest': { icon: CheckCircle2, label: 'Harvest', color: 'text-zen-moss-600' },
  'sow-indoors': { icon: Sprout, label: 'Sow Indoors', color: 'text-zen-bamboo-600' },
  'sow-outdoors': { icon: Leaf, label: 'Direct Sow', color: 'text-emerald-600' },
  'transplant': { icon: ArrowUpFromLine, label: 'Transplant', color: 'text-blue-600' },
  'prune': { icon: Scissors, label: 'Prune', color: 'text-violet-600' },
  'feed': { icon: Droplets, label: 'Feed', color: 'text-cyan-600' },
  'mulch': { icon: TreeDeciduous, label: 'Mulch', color: 'text-amber-700' },
  'succession': { icon: RotateCcw, label: 'Succession Sow', color: 'text-teal-600' },
}

const URGENCY_STYLES: Record<TaskUrgency, string> = {
  'overdue': 'bg-zen-ume-100 text-zen-ume-700',
  'today': 'bg-zen-kitsune-100 text-zen-kitsune-700',
  'this-week': 'bg-zen-water-100 text-zen-water-700',
  'upcoming': 'bg-zen-moss-100 text-zen-moss-700',
  'later': 'bg-zen-stone-100 text-zen-stone-600',
}

function CustomTaskItem({
  task,
  onToggle,
  onRemove,
}: {
  task: CustomTask
  onToggle: (taskId: string) => void
  onRemove: (taskId: string) => void
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-zen-stone-100 last:border-0 group">
      <button
        onClick={() => onToggle(task.id)}
        className="flex-shrink-0 mt-0.5 text-zen-stone-400 hover:text-zen-moss-600 transition-colors"
        aria-label={task.completed ? `Mark "${task.description}" as not done` : `Mark "${task.description}" as done`}
      >
        {task.completed ? (
          <CheckSquare className="w-4 h-4 text-zen-moss-500" />
        ) : (
          <Square className="w-4 h-4" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-relaxed ${task.completed ? 'text-zen-stone-400 line-through' : 'text-zen-ink-700'}`}>
          {task.description}
        </p>
      </div>
      <button
        onClick={() => onRemove(task.id)}
        className="flex-shrink-0 p-1 rounded-full text-zen-stone-300 hover:text-zen-ume-600 hover:bg-zen-ume-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Remove task"
        aria-label={`Remove "${task.description}"`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function AddTaskInput({ onAdd }: { onAdd: (task: NewCustomTask) => void }) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd({ description: trimmed })
    setValue('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="flex items-center gap-2 py-2">
      <Plus className="w-4 h-4 text-zen-stone-300 flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a task..."
        className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-zen-stone-300 text-zen-ink-700"
      />
      {value.trim() && (
        <button
          onClick={handleSubmit}
          className="text-xs text-zen-moss-600 hover:text-zen-moss-700 px-2 py-1 rounded hover:bg-zen-moss-50 transition-colors"
        >
          Add
        </button>
      )}
    </div>
  )
}

function MaintenanceTaskItem({ task }: { task: MaintenanceTask }) {
  const config = TASK_CONFIG[task.type] || TASK_CONFIG.other
  const Icon = config.icon

  return (
    <div className="flex items-start gap-3 py-3 border-b border-zen-stone-100 last:border-0">
      <div className="flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-zen-stone-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zen-ink-700 leading-relaxed">{task.description}</p>
        {task.notes && (
          <p className="text-xs text-zen-stone-500 mt-1">{task.notes}</p>
        )}
      </div>
    </div>
  )
}

function GeneratedTaskItem({ task, onDismiss }: { task: GeneratedTask; onDismiss?: (taskId: string) => void }) {
  const config = GENERATED_TASK_CONFIG[task.generatedType] || GENERATED_TASK_CONFIG['harvest']
  const Icon = config.icon

  // Determine badge text and style
  const getBadge = () => {
    // Show urgency-based badge for date-based tasks
    if (task.urgency && task.calculatedFrom === 'actual-date') {
      if (task.urgency === 'today') {
        return { text: 'Today', style: URGENCY_STYLES['today'] }
      }
      if (task.urgency === 'overdue') {
        return { text: 'Overdue', style: URGENCY_STYLES['overdue'] }
      }
      if (task.urgency === 'this-week' && task.daysRemaining !== undefined) {
        return { text: `${task.daysRemaining}d`, style: URGENCY_STYLES['this-week'] }
      }
      if (task.urgency === 'upcoming' && task.daysRemaining !== undefined) {
        return { text: `${task.daysRemaining}d`, style: URGENCY_STYLES['upcoming'] }
      }
    }
    // Fallback for high priority tasks without urgency
    if (task.priority === 'high') {
      return { text: 'Ready', style: 'bg-zen-moss-100 text-zen-moss-700' }
    }
    return null
  }

  const badge = getBadge()

  return (
    <div className="flex items-start gap-3 py-3 border-b border-zen-stone-100 last:border-0 group">
      <div className="flex-shrink-0 mt-0.5">
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zen-ink-700 leading-relaxed">{task.description}</p>
        {task.notes && (
          <p className="text-xs text-zen-stone-500 mt-1">{task.notes}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {badge && (
          <span className={`text-xs px-1.5 py-0.5 rounded ${badge.style}`}>
            {badge.text}
          </span>
        )}
        {onDismiss && (
          <button
            onClick={() => onDismiss(task.id)}
            className="p-1 rounded-full text-zen-stone-300 hover:text-zen-moss-600 hover:bg-zen-moss-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Mark as done"
            aria-label={`Mark "${task.description}" as done`}
          >
            <Check className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

function DismissedTaskItem({ task, onRestore }: { task: GeneratedTask; onRestore: (taskId: string) => void }) {
  const config = GENERATED_TASK_CONFIG[task.generatedType] || GENERATED_TASK_CONFIG['harvest']
  const Icon = config.icon

  return (
    <div className="flex items-start gap-3 py-2 border-b border-zen-stone-100 last:border-0 opacity-50 group">
      <div className="flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-zen-stone-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zen-stone-400 leading-relaxed line-through">{task.description}</p>
      </div>
      <button
        onClick={() => onRestore(task.id)}
        className="flex-shrink-0 p-1 rounded-full text-zen-stone-300 hover:text-zen-water-600 hover:bg-zen-water-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Undo"
        aria-label={`Undo "${task.description}"`}
      >
        <Undo2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default function TaskList({
  customTasks = [],
  tasks,
  generatedTasks = [],
  dismissedTasks = [],
  onAddCustomTask,
  onToggleCustomTask,
  onRemoveCustomTask,
  onDismissTask,
  onRestoreTask,
}: TaskListProps) {
  const [showDismissed, setShowDismissed] = useState(false)

  const activeCustomTasks = customTasks.filter(t => !t.completed)
  const completedCustomTasks = customTasks.filter(t => t.completed)
  const totalTasks = activeCustomTasks.length + tasks.length + generatedTasks.length
  const hasManualTasks = tasks.length > 0
  const hasGeneratedTasks = generatedTasks.length > 0
  const hasDismissedTasks = dismissedTasks.length > 0
  const hasCompletedCustomTasks = completedCustomTasks.length > 0
  const totalCompleted = dismissedTasks.length + completedCustomTasks.length

  if (totalTasks === 0 && !hasDismissedTasks && !hasCompletedCustomTasks) {
    return (
      <div className="zen-card p-6" data-tour="task-list">
        <h3 className="text-lg text-zen-ink-700 mb-4">Tasks</h3>

        {/* Add task input always visible */}
        {onAddCustomTask && (
          <div className="mb-4 border-b border-zen-stone-100">
            <AddTaskInput onAdd={onAddCustomTask} />
          </div>
        )}

        <div className="text-center py-8">
          <span className="text-3xl block mb-3">&#9749;</span>
          <p className="text-zen-stone-500 text-sm">No tasks this month</p>
          <p className="text-zen-stone-400 text-xs mt-1">Time for a quiet moment</p>
        </div>
      </div>
    )
  }

  // Combine and limit generated + maintenance tasks for display
  const maxDisplay = 8
  const displayGeneratedTasks = generatedTasks.slice(0, maxDisplay)
  const remainingSlots = Math.max(0, maxDisplay - displayGeneratedTasks.length)
  const displayManualTasks = tasks.slice(0, remainingSlots)
  const hiddenCount = (tasks.length + generatedTasks.length) - displayGeneratedTasks.length - displayManualTasks.length

  return (
    <div className="zen-card p-6" data-tour="task-list">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg text-zen-ink-700">Tasks</h3>
        <span className="text-xs text-zen-stone-500">
          {totalTasks} {totalTasks === 1 ? 'item' : 'items'}
          {totalCompleted > 0 && ` \u00b7 ${totalCompleted} done`}
        </span>
      </div>

      <div>
        {/* Custom tasks (user-created, persistent) - always at top */}
        {activeCustomTasks.map((task) => (
          onToggleCustomTask && onRemoveCustomTask ? (
            <CustomTaskItem
              key={task.id}
              task={task}
              onToggle={onToggleCustomTask}
              onRemove={onRemoveCustomTask}
            />
          ) : null
        ))}

        {/* Add task input */}
        {onAddCustomTask && (
          <div className={activeCustomTasks.length > 0 || (hasGeneratedTasks || hasManualTasks) ? 'border-b border-zen-stone-100' : ''}>
            <AddTaskInput onAdd={onAddCustomTask} />
          </div>
        )}

        {/* Generated tasks (auto-generated from plantings) */}
        {displayGeneratedTasks.map((task) => (
          <GeneratedTaskItem key={task.id} task={task} onDismiss={onDismissTask} />
        ))}

        {/* Manual maintenance tasks (user-created) */}
        {hasManualTasks && hasGeneratedTasks && displayManualTasks.length > 0 && (
          <div className="text-xs text-zen-stone-400 py-2 border-b border-zen-stone-100">
            Maintenance
          </div>
        )}
        {displayManualTasks.map((task) => (
          <MaintenanceTaskItem key={task.id} task={task} />
        ))}

        {hiddenCount > 0 && (
          <p className="text-xs text-zen-stone-400 text-center pt-3">
            +{hiddenCount} more
          </p>
        )}

        {/* Completed section (dismissed generated + completed custom tasks) */}
        {totalCompleted > 0 && (
          <div className="mt-3 pt-3 border-t border-zen-stone-100">
            <button
              onClick={() => setShowDismissed(!showDismissed)}
              className="flex items-center gap-1 text-xs text-zen-stone-400 hover:text-zen-stone-600 transition-colors w-full"
            >
              {showDismissed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {totalCompleted} completed
            </button>
            {showDismissed && (
              <div className="mt-1">
                {/* Completed custom tasks */}
                {completedCustomTasks.map((task) => (
                  onToggleCustomTask && onRemoveCustomTask ? (
                    <CustomTaskItem
                      key={task.id}
                      task={task}
                      onToggle={onToggleCustomTask}
                      onRemove={onRemoveCustomTask}
                    />
                  ) : null
                ))}
                {/* Dismissed generated tasks */}
                {onRestoreTask && dismissedTasks.map((task) => (
                  <DismissedTaskItem key={task.id} task={task} onRestore={onRestoreTask} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
