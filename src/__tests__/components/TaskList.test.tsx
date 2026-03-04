/**
 * Unit tests for TaskList component
 *
 * Tests rendering of generated tasks, custom tasks, dismissed tasks,
 * task interactions (dismiss, restore, toggle, add), and empty states.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaskList from '@/components/dashboard/TaskList'
import { CustomTask, MaintenanceTask } from '@/types/unified-allotment'
import { GeneratedTask } from '@/lib/task-generator'
import { SeasonalTheme } from '@/lib/seasonal-theme'

// Minimal theme stub - the component only uses it via the prop type
const mockTheme: SeasonalTheme = {
  season: 'spring',
  bgPage: '',
  bgCard: '',
  bgAccent: '',
  textAccent: '',
  textMuted: '',
  borderAccent: '',
  badgeClass: '',
  decorPrimary: '',
  decorSecondary: '',
  bgImage: '',
  bgImageCredit: { name: '', url: '' },
}

function makeGeneratedTask(overrides: Partial<GeneratedTask> = {}): GeneratedTask {
  return {
    id: 'gen-1',
    type: 'harvest',
    generatedType: 'harvest',
    description: 'Harvest lettuce from Bed A',
    plantId: 'lettuce',
    plantName: 'Lettuce',
    areaId: 'bed-a',
    areaName: 'Bed A',
    month: 3,
    priority: 'high',
    ...overrides,
  }
}

function makeCustomTask(overrides: Partial<CustomTask> = {}): CustomTask {
  return {
    id: 'custom-1',
    description: 'Weed the paths',
    completed: false,
    createdAt: '2026-03-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeMaintenanceTask(overrides: Partial<MaintenanceTask> = {}): MaintenanceTask {
  return {
    id: 'maint-1',
    areaId: 'apple-tree',
    type: 'prune',
    month: 3,
    description: 'Winter prune apple trees',
    ...overrides,
  }
}

describe('TaskList Component', () => {
  const defaultCallbacks = {
    onAddCustomTask: vi.fn(),
    onToggleCustomTask: vi.fn(),
    onRemoveCustomTask: vi.fn(),
    onDismissTask: vi.fn(),
    onRestoreTask: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Empty state', () => {
    it('shows empty state when there are no tasks', () => {
      render(
        <TaskList
          tasks={[]}
          generatedTasks={[]}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      expect(screen.getByText(/no tasks this month/i)).toBeInTheDocument()
    })

    it('still shows the add task input in empty state', () => {
      render(
        <TaskList
          tasks={[]}
          generatedTasks={[]}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      expect(screen.getByPlaceholderText(/add a task/i)).toBeInTheDocument()
    })
  })

  describe('Generated tasks', () => {
    it('renders generated tasks with descriptions', () => {
      const tasks = [
        makeGeneratedTask({ id: 'g1', description: 'Harvest lettuce from Bed A' }),
        makeGeneratedTask({ id: 'g2', description: 'Sow carrots indoors', generatedType: 'sow-indoors' }),
      ]

      render(
        <TaskList
          tasks={[]}
          generatedTasks={tasks}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      expect(screen.getByText('Harvest lettuce from Bed A')).toBeInTheDocument()
      expect(screen.getByText('Sow carrots indoors')).toBeInTheDocument()
    })

    it('shows item count in header', () => {
      const tasks = [
        makeGeneratedTask({ id: 'g1' }),
        makeGeneratedTask({ id: 'g2', description: 'Sow carrots' }),
      ]

      render(
        <TaskList
          tasks={[]}
          generatedTasks={tasks}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      expect(screen.getByText('2 items')).toBeInTheDocument()
    })

    it('shows singular "item" for single task', () => {
      render(
        <TaskList
          tasks={[]}
          generatedTasks={[makeGeneratedTask()]}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      expect(screen.getByText('1 item')).toBeInTheDocument()
    })

    it('shows urgency badge for overdue tasks', () => {
      const task = makeGeneratedTask({
        urgency: 'overdue',
        calculatedFrom: 'actual-date',
      })

      render(
        <TaskList
          tasks={[]}
          generatedTasks={[task]}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      expect(screen.getByText('Overdue')).toBeInTheDocument()
    })

    it('shows "Today" badge for today-urgency tasks', () => {
      const task = makeGeneratedTask({
        urgency: 'today',
        calculatedFrom: 'actual-date',
      })

      render(
        <TaskList
          tasks={[]}
          generatedTasks={[task]}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      expect(screen.getByText('Today')).toBeInTheDocument()
    })

    it('shows days remaining badge for this-week tasks', () => {
      const task = makeGeneratedTask({
        urgency: 'this-week',
        calculatedFrom: 'actual-date',
        daysRemaining: 3,
      })

      render(
        <TaskList
          tasks={[]}
          generatedTasks={[task]}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      expect(screen.getByText('3d')).toBeInTheDocument()
    })

    it('shows task notes when present', () => {
      const task = makeGeneratedTask({
        notes: 'Check for ripeness first',
      })

      render(
        <TaskList
          tasks={[]}
          generatedTasks={[task]}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      expect(screen.getByText('Check for ripeness first')).toBeInTheDocument()
    })

    it('limits displayed tasks to 8', () => {
      const tasks = Array.from({ length: 10 }, (_, i) =>
        makeGeneratedTask({ id: `g${i}`, description: `Task ${i}` })
      )

      render(
        <TaskList
          tasks={[]}
          generatedTasks={tasks}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      // Should show 8 tasks plus a "+2 more" message
      expect(screen.getByText('+2 more')).toBeInTheDocument()
    })
  })

  describe('Dismiss/restore generated tasks', () => {
    it('calls onDismissTask when dismiss button is clicked', async () => {
      const task = makeGeneratedTask({ id: 'g1', description: 'Harvest lettuce from Bed A' })

      render(
        <TaskList
          tasks={[]}
          generatedTasks={[task]}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      const dismissButton = screen.getByRole('button', { name: /mark "Harvest lettuce from Bed A" as done/i })
      await userEvent.click(dismissButton)

      expect(defaultCallbacks.onDismissTask).toHaveBeenCalledWith('g1')
    })

    it('shows dismissed tasks section with count', () => {
      const dismissed = [
        makeGeneratedTask({ id: 'd1', description: 'Water tomatoes' }),
        makeGeneratedTask({ id: 'd2', description: 'Feed roses' }),
      ]

      render(
        <TaskList
          tasks={[]}
          generatedTasks={[]}
          dismissedTasks={dismissed}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      expect(screen.getByText('2 completed')).toBeInTheDocument()
    })

    it('toggles dismissed tasks visibility when clicking completed button', async () => {
      const dismissed = [
        makeGeneratedTask({ id: 'd1', description: 'Water tomatoes' }),
      ]

      render(
        <TaskList
          tasks={[]}
          generatedTasks={[makeGeneratedTask()]}
          dismissedTasks={dismissed}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      // Dismissed tasks are hidden by default
      expect(screen.queryByText('Water tomatoes')).not.toBeInTheDocument()

      // Click to expand
      await userEvent.click(screen.getByText('1 completed'))

      expect(screen.getByText('Water tomatoes')).toBeInTheDocument()

      // Click to collapse
      await userEvent.click(screen.getByText('1 completed'))

      await waitFor(() => {
        expect(screen.queryByText('Water tomatoes')).not.toBeInTheDocument()
      })
    })

    it('calls onRestoreTask when undo button is clicked on dismissed task', async () => {
      const dismissed = [
        makeGeneratedTask({ id: 'd1', description: 'Water tomatoes' }),
      ]

      render(
        <TaskList
          tasks={[]}
          generatedTasks={[makeGeneratedTask()]}
          dismissedTasks={dismissed}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      // Expand dismissed section
      await userEvent.click(screen.getByText('1 completed'))

      const restoreButton = screen.getByRole('button', { name: /undo "Water tomatoes"/i })
      await userEvent.click(restoreButton)

      expect(defaultCallbacks.onRestoreTask).toHaveBeenCalledWith('d1')
    })
  })

  describe('Custom tasks', () => {
    it('renders active custom tasks', () => {
      const customTasks = [
        makeCustomTask({ id: 'c1', description: 'Weed the paths' }),
        makeCustomTask({ id: 'c2', description: 'Fix the fence' }),
      ]

      render(
        <TaskList
          tasks={[]}
          customTasks={customTasks}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      expect(screen.getByText('Weed the paths')).toBeInTheDocument()
      expect(screen.getByText('Fix the fence')).toBeInTheDocument()
    })

    it('calls onToggleCustomTask when toggle button is clicked', async () => {
      const customTasks = [
        makeCustomTask({ id: 'c1', description: 'Weed the paths' }),
      ]

      render(
        <TaskList
          tasks={[]}
          customTasks={customTasks}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      const toggleButton = screen.getByRole('button', { name: /mark "Weed the paths" as done/i })
      await userEvent.click(toggleButton)

      expect(defaultCallbacks.onToggleCustomTask).toHaveBeenCalledWith('c1')
    })

    it('calls onRemoveCustomTask when remove button is clicked', async () => {
      const customTasks = [
        makeCustomTask({ id: 'c1', description: 'Weed the paths' }),
      ]

      render(
        <TaskList
          tasks={[]}
          customTasks={customTasks}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      const removeButton = screen.getByRole('button', { name: /remove "Weed the paths"/i })
      await userEvent.click(removeButton)

      expect(defaultCallbacks.onRemoveCustomTask).toHaveBeenCalledWith('c1')
    })

    it('shows completed custom tasks in the completed section', async () => {
      const customTasks = [
        makeCustomTask({ id: 'c1', description: 'Weed the paths', completed: true }),
      ]

      render(
        <TaskList
          tasks={[]}
          customTasks={customTasks}
          generatedTasks={[makeGeneratedTask()]}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      // Completed custom tasks should be hidden initially
      expect(screen.queryByText('Weed the paths')).not.toBeInTheDocument()

      // Expand completed section
      await userEvent.click(screen.getByText('1 completed'))

      expect(screen.getByText('Weed the paths')).toBeInTheDocument()
    })
  })

  describe('Add custom task', () => {
    it('shows add task input', () => {
      render(
        <TaskList
          tasks={[]}
          generatedTasks={[makeGeneratedTask()]}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      expect(screen.getByPlaceholderText(/add a task/i)).toBeInTheDocument()
    })

    it('calls onAddCustomTask when Enter is pressed with text', async () => {
      render(
        <TaskList
          tasks={[]}
          generatedTasks={[makeGeneratedTask()]}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      const input = screen.getByPlaceholderText(/add a task/i)
      await userEvent.type(input, 'Buy compost{Enter}')

      expect(defaultCallbacks.onAddCustomTask).toHaveBeenCalledWith({ description: 'Buy compost' })
    })

    it('does not call onAddCustomTask when Enter is pressed with empty text', async () => {
      render(
        <TaskList
          tasks={[]}
          generatedTasks={[makeGeneratedTask()]}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      const input = screen.getByPlaceholderText(/add a task/i)
      await userEvent.type(input, '{Enter}')

      expect(defaultCallbacks.onAddCustomTask).not.toHaveBeenCalled()
    })

    it('does not call onAddCustomTask for whitespace-only input', async () => {
      render(
        <TaskList
          tasks={[]}
          generatedTasks={[makeGeneratedTask()]}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      const input = screen.getByPlaceholderText(/add a task/i)
      await userEvent.type(input, '   {Enter}')

      expect(defaultCallbacks.onAddCustomTask).not.toHaveBeenCalled()
    })

    it('clears input after adding a task', async () => {
      render(
        <TaskList
          tasks={[]}
          generatedTasks={[makeGeneratedTask()]}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      const input = screen.getByPlaceholderText(/add a task/i)
      await userEvent.type(input, 'Buy compost{Enter}')

      expect(input).toHaveValue('')
    })

    it('shows Add button only when there is text', async () => {
      render(
        <TaskList
          tasks={[]}
          generatedTasks={[makeGeneratedTask()]}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      // No Add button initially
      expect(screen.queryByRole('button', { name: /^Add$/i })).not.toBeInTheDocument()

      // Type something
      const input = screen.getByPlaceholderText(/add a task/i)
      await userEvent.type(input, 'Buy seeds')

      // Add button appears
      expect(screen.getByRole('button', { name: /^Add$/i })).toBeInTheDocument()
    })

    it('calls onAddCustomTask when Add button is clicked', async () => {
      render(
        <TaskList
          tasks={[]}
          generatedTasks={[makeGeneratedTask()]}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      const input = screen.getByPlaceholderText(/add a task/i)
      await userEvent.type(input, 'Buy seeds')
      await userEvent.click(screen.getByRole('button', { name: /^Add$/i }))

      expect(defaultCallbacks.onAddCustomTask).toHaveBeenCalledWith({ description: 'Buy seeds' })
    })
  })

  describe('Maintenance tasks', () => {
    it('renders maintenance tasks', () => {
      const tasks = [
        makeMaintenanceTask({ id: 'm1', description: 'Winter prune apple trees' }),
      ]

      render(
        <TaskList
          tasks={tasks}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      expect(screen.getByText('Winter prune apple trees')).toBeInTheDocument()
    })

    it('shows maintenance task notes', () => {
      const tasks = [
        makeMaintenanceTask({ notes: 'Before buds open' }),
      ]

      render(
        <TaskList
          tasks={tasks}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      expect(screen.getByText('Before buds open')).toBeInTheDocument()
    })

    it('shows maintenance separator when both generated and maintenance tasks exist', () => {
      render(
        <TaskList
          tasks={[makeMaintenanceTask()]}
          generatedTasks={[makeGeneratedTask()]}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      expect(screen.getByText('Maintenance')).toBeInTheDocument()
    })
  })

  describe('Completed count', () => {
    it('shows total completed count combining dismissed and completed custom tasks', () => {
      const dismissed = [makeGeneratedTask({ id: 'd1' })]
      const customTasks = [
        makeCustomTask({ id: 'c1', completed: true }),
        makeCustomTask({ id: 'c2', completed: true }),
      ]

      render(
        <TaskList
          tasks={[]}
          generatedTasks={[makeGeneratedTask({ id: 'active' })]}
          customTasks={customTasks}
          dismissedTasks={dismissed}
          theme={mockTheme}
          {...defaultCallbacks}
        />
      )

      // Header should show "3 done"
      expect(screen.getByText(/3 done/)).toBeInTheDocument()
      // Completed section button should show "3 completed"
      expect(screen.getByText('3 completed')).toBeInTheDocument()
    })
  })
})
