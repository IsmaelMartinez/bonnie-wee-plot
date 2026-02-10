import { Scissors, Droplets, TreeDeciduous, Sparkles, CheckCircle2, Sprout, ArrowUpFromLine, Leaf, RotateCcw } from 'lucide-react'
import { MaintenanceTask, MaintenanceTaskType } from '@/types/unified-allotment'
import { GeneratedTask, GeneratedTaskType, TaskUrgency } from '@/lib/task-generator'
import { SeasonalTheme } from '@/lib/seasonal-theme'

interface TaskListProps {
  tasks: MaintenanceTask[]
  generatedTasks?: GeneratedTask[]
  theme: SeasonalTheme
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

function TaskItem({ task }: { task: MaintenanceTask }) {
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

function GeneratedTaskItem({ task }: { task: GeneratedTask }) {
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
    <div className="flex items-start gap-3 py-3 border-b border-zen-stone-100 last:border-0">
      <div className="flex-shrink-0 mt-0.5">
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zen-ink-700 leading-relaxed">{task.description}</p>
        {task.notes && (
          <p className="text-xs text-zen-stone-500 mt-1">{task.notes}</p>
        )}
      </div>
      {badge && (
        <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded ${badge.style}`}>
          {badge.text}
        </span>
      )}
    </div>
  )
}

export default function TaskList({ tasks, generatedTasks = [] }: TaskListProps) {
  const totalTasks = tasks.length + generatedTasks.length
  const hasManualTasks = tasks.length > 0
  const hasGeneratedTasks = generatedTasks.length > 0

  if (totalTasks === 0) {
    return (
      <div className="zen-card p-6">
        <h3 className="text-lg text-zen-ink-700 mb-4">Tasks</h3>
        <div className="text-center py-8">
          <span className="text-3xl block mb-3">☕</span>
          <p className="text-zen-stone-500 text-sm">No tasks this month</p>
          <p className="text-zen-stone-400 text-xs mt-1">Time for a quiet moment</p>
        </div>
      </div>
    )
  }

  // Combine and limit tasks for display
  const maxDisplay = 8
  const displayGeneratedTasks = generatedTasks.slice(0, maxDisplay)
  const remainingSlots = Math.max(0, maxDisplay - displayGeneratedTasks.length)
  const displayManualTasks = tasks.slice(0, remainingSlots)
  const hiddenCount = totalTasks - displayGeneratedTasks.length - displayManualTasks.length

  return (
    <div className="zen-card p-6" data-tour="task-list">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg text-zen-ink-700">Tasks</h3>
        <span className="text-xs text-zen-stone-500">
          {totalTasks} {totalTasks === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div>
        {/* Generated tasks (auto-generated from plantings) */}
        {displayGeneratedTasks.map((task) => (
          <GeneratedTaskItem key={task.id} task={task} />
        ))}

        {/* Manual maintenance tasks (user-created) */}
        {hasManualTasks && hasGeneratedTasks && displayManualTasks.length > 0 && (
          <div className="text-xs text-zen-stone-400 py-2 border-b border-zen-stone-100">
            Your tasks
          </div>
        )}
        {displayManualTasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}

        {hiddenCount > 0 && (
          <p className="text-xs text-zen-stone-400 text-center pt-3">
            +{hiddenCount} more
          </p>
        )}
      </div>
    </div>
  )
}
