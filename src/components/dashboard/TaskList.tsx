'use client'

import { Scissors, Droplets, TreeDeciduous, Sparkles, CheckCircle2 } from 'lucide-react'
import { MaintenanceTask, MaintenanceTaskType } from '@/types/unified-allotment'
import { SeasonalTheme } from '@/lib/seasonal-theme'

interface TaskListProps {
  tasks: MaintenanceTask[]
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

export default function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
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

  return (
    <div className="zen-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg text-zen-ink-700">Tasks</h3>
        <span className="text-xs text-zen-stone-500">
          {tasks.length} {tasks.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div>
        {tasks.slice(0, 5).map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
        {tasks.length > 5 && (
          <p className="text-xs text-zen-stone-400 text-center pt-3">
            +{tasks.length - 5} more
          </p>
        )}
      </div>
    </div>
  )
}
