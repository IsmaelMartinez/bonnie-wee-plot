'use client'

import { Scissors, Droplets, TreeDeciduous, Sparkles, CheckCircle2, Sprout, ArrowUpFromLine, Leaf } from 'lucide-react'
import { MaintenanceTask, MaintenanceTaskType } from '@/types/unified-allotment'
import { GeneratedTask, GeneratedTaskType } from '@/lib/task-generator'
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
  'harvest': { icon: CheckCircle2, label: 'Harvest', color: 'text-green-600' },
  'sow-indoors': { icon: Sprout, label: 'Sow Indoors', color: 'text-amber-600' },
  'sow-outdoors': { icon: Leaf, label: 'Direct Sow', color: 'text-emerald-600' },
  'transplant': { icon: ArrowUpFromLine, label: 'Transplant', color: 'text-blue-600' },
  'prune': { icon: Scissors, label: 'Prune', color: 'text-violet-600' },
  'feed': { icon: Droplets, label: 'Feed', color: 'text-cyan-600' },
  'mulch': { icon: TreeDeciduous, label: 'Mulch', color: 'text-amber-700' },
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
      {task.priority === 'high' && (
        <span className="flex-shrink-0 text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
          Ready
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
    <div className="zen-card p-6">
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
