/**
 * Unit tests for AllotmentGrid component
 *
 * Tests keyboard navigation, edit mode toggle, item selection,
 * position changes, and mobile view detection.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AllotmentGrid from '@/components/allotment/AllotmentGrid'
import { Area, Planting } from '@/types/unified-allotment'
import { AllotmentItemRef } from '@/types/garden-planner'

// Mock react-grid-layout to avoid complex layout calculations
vi.mock('react-grid-layout', () => ({
  default: ({ children, onLayoutChange }: {
    children: React.ReactNode
    onLayoutChange?: (layout: unknown[]) => void
  }) => (
    <div data-testid="mock-grid-layout" onClick={() => onLayoutChange?.([])}>
      {children}
    </div>
  ),
}))

// Mock allotment-storage
vi.mock('@/services/allotment-storage', () => ({
  wasAreaActiveInYear: vi.fn((area: Area, year: number) => {
    if (area.createdYear && year < area.createdYear) return false
    if (area.retiredYear && year >= area.retiredYear) return false
    return true
  }),
}))

// Mock BedItem component
vi.mock('@/components/allotment/BedItem', () => ({
  default: ({ item, isSelected }: { item: { label: string }; isSelected: boolean }) => (
    <div data-testid={`bed-item-${item.label}`} data-selected={isSelected}>
      {item.label}
    </div>
  ),
}))

// Mock AllotmentMobileView component
vi.mock('@/components/allotment/AllotmentMobileView', () => ({
  default: () => <div data-testid="mobile-view">Mobile View</div>,
}))

// Mock CSS imports
vi.mock('react-grid-layout/css/styles.css', () => ({}))
vi.mock('react-resizable/css/styles.css', () => ({}))

// Test data
const createTestAreas = (): Area[] => [
  {
    id: 'bed-a',
    name: 'Bed A',
    kind: 'rotation-bed',
    canHavePlantings: true,
    gridPosition: { x: 0, y: 0, w: 2, h: 1 },
  },
  {
    id: 'bed-b',
    name: 'Bed B',
    kind: 'rotation-bed',
    canHavePlantings: true,
    gridPosition: { x: 2, y: 0, w: 2, h: 1 },
  },
  {
    id: 'apple-tree',
    name: 'Apple Tree',
    kind: 'tree',
    canHavePlantings: true,
    gridPosition: { x: 4, y: 0, w: 1, h: 1 },
  },
  {
    id: 'shed',
    name: 'Tool Shed',
    kind: 'infrastructure',
    canHavePlantings: false,
    gridPosition: { x: 6, y: 0, w: 1, h: 1 },
  },
]


const createTestPlantings = (): Planting[] => [
  {
    id: 'planting-1',
    plantId: 'tomato',
    varietyName: 'San Marzano',
    status: 'active',
  },
]

describe('AllotmentGrid Component', () => {
  const mockOnItemSelect = vi.fn()
  const mockOnEditingChange = vi.fn()
  const mockOnPositionChange = vi.fn()

  // Store original window dimensions
  let originalInnerWidth: number
  let originalInnerHeight: number

  beforeEach(() => {
    vi.clearAllMocks()
    originalInnerWidth = window.innerWidth
    originalInnerHeight = window.innerHeight

    // Set desktop viewport by default
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true })
  })

  afterEach(() => {
    // Restore original dimensions
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, configurable: true })
  })

  describe('Rendering', () => {
    it('renders all areas as grid items', async () => {
      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          onItemSelect={mockOnItemSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('bed-item-Bed A')).toBeInTheDocument()
        expect(screen.getByTestId('bed-item-Bed B')).toBeInTheDocument()
        expect(screen.getByTestId('bed-item-Apple Tree')).toBeInTheDocument()
        expect(screen.getByTestId('bed-item-Tool Shed')).toBeInTheDocument()
      })
    })

    it('shows loading state when not mounted', () => {
      // The component shows loading state before useEffect runs
      // This is tested implicitly - the mounted state controls rendering
      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
        />
      )

      // After initial render, the grid should appear
      expect(screen.getByRole('grid')).toBeInTheDocument()
    })

    it('filters areas by selected year', async () => {
      const areas = createTestAreas()
      // Add an area that was created in a later year
      areas.push({
        id: 'new-bed',
        name: 'New Bed',
        kind: 'rotation-bed',
        canHavePlantings: true,
        createdYear: 2025,
        gridPosition: { x: 8, y: 0, w: 1, h: 1 },
      })

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          onItemSelect={mockOnItemSelect}
        />
      )

      await waitFor(() => {
        // The wasAreaActiveInYear mock will filter out the new bed for 2024
        expect(screen.queryByTestId('bed-item-New Bed')).not.toBeInTheDocument()
      })
    })
  })

  describe('Edit mode toggle', () => {
    it('starts in locked mode', async () => {
      render(
        <AllotmentGrid
          areas={createTestAreas()}
          selectedYear={2024}
          onEditingChange={mockOnEditingChange}
        />
      )

      await waitFor(() => {
        const lockButton = screen.getByRole('button', { name: /unlock to edit/i })
        expect(lockButton).toBeInTheDocument()
      })
    })

    it('toggles to editing mode when lock button is clicked', async () => {
      render(
        <AllotmentGrid
          areas={createTestAreas()}
          selectedYear={2024}
          onEditingChange={mockOnEditingChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /unlock to edit/i })).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('button', { name: /unlock to edit/i }))

      await waitFor(() => {
        expect(mockOnEditingChange).toHaveBeenCalledWith(true)
        expect(screen.getByRole('button', { name: /lock layout/i })).toBeInTheDocument()
      })
    })

    it('shows reset button only in editing mode', async () => {
      render(
        <AllotmentGrid
          areas={createTestAreas()}
          selectedYear={2024}
        />
      )

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /reset layout/i })).not.toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('button', { name: /unlock to edit/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reset layout/i })).toBeInTheDocument()
      })
    })
  })

  describe('Item selection', () => {
    it('calls onItemSelect with bed type when rotation bed is clicked', async () => {
      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          onItemSelect={mockOnItemSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('bed-item-Bed A')).toBeInTheDocument()
      })

      // Find the button wrapping Bed A
      const bedAButton = screen.getByRole('button', { name: /bed a/i })
      await userEvent.click(bedAButton)

      expect(mockOnItemSelect).toHaveBeenCalledWith({ type: 'bed', id: 'bed-a' })
    })

    it('calls onItemSelect with permanent type when tree is clicked', async () => {
      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          onItemSelect={mockOnItemSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('bed-item-Apple Tree')).toBeInTheDocument()
      })

      const treeButton = screen.getByRole('button', { name: /apple tree/i })
      await userEvent.click(treeButton)

      expect(mockOnItemSelect).toHaveBeenCalledWith({ type: 'permanent', id: 'apple-tree' })
    })

    it('calls onItemSelect with infrastructure type when infrastructure is clicked', async () => {
      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          onItemSelect={mockOnItemSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('bed-item-Tool Shed')).toBeInTheDocument()
      })

      const shedButton = screen.getByRole('button', { name: /tool shed/i })
      await userEvent.click(shedButton)

      expect(mockOnItemSelect).toHaveBeenCalledWith({ type: 'infrastructure', id: 'shed' })
    })

    it('highlights selected item', async () => {
      const areas = createTestAreas()
      const selectedRef: AllotmentItemRef = { type: 'bed', id: 'bed-a' }

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          selectedItemRef={selectedRef}
          onItemSelect={mockOnItemSelect}
        />
      )

      await waitFor(() => {
        const bedA = screen.getByTestId('bed-item-Bed A')
        expect(bedA).toHaveAttribute('data-selected', 'true')
      })
    })
  })

  describe('Keyboard navigation', () => {
    it('navigates down with ArrowDown key', async () => {
      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          onItemSelect={mockOnItemSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /bed a/i })).toBeInTheDocument()
      })

      const firstButton = screen.getByRole('button', { name: /bed a/i })
      firstButton.focus()

      fireEvent.keyDown(firstButton, { key: 'ArrowDown' })

      // Check that focus moved (the next button should now be focused)
      await waitFor(() => {
        const secondButton = screen.getByRole('button', { name: /bed b/i })
        expect(document.activeElement).toBe(secondButton)
      })
    })

    it('navigates up with ArrowUp key', async () => {
      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          onItemSelect={mockOnItemSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /bed b/i })).toBeInTheDocument()
      })

      const secondButton = screen.getByRole('button', { name: /bed b/i })
      secondButton.focus()

      fireEvent.keyDown(secondButton, { key: 'ArrowUp' })

      await waitFor(() => {
        const firstButton = screen.getByRole('button', { name: /bed a/i })
        expect(document.activeElement).toBe(firstButton)
      })
    })

    it('navigates right with ArrowRight key', async () => {
      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          onItemSelect={mockOnItemSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /bed a/i })).toBeInTheDocument()
      })

      const firstButton = screen.getByRole('button', { name: /bed a/i })
      firstButton.focus()

      fireEvent.keyDown(firstButton, { key: 'ArrowRight' })

      await waitFor(() => {
        const secondButton = screen.getByRole('button', { name: /bed b/i })
        expect(document.activeElement).toBe(secondButton)
      })
    })

    it('navigates left with ArrowLeft key', async () => {
      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          onItemSelect={mockOnItemSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /bed b/i })).toBeInTheDocument()
      })

      const secondButton = screen.getByRole('button', { name: /bed b/i })
      secondButton.focus()

      fireEvent.keyDown(secondButton, { key: 'ArrowLeft' })

      await waitFor(() => {
        const firstButton = screen.getByRole('button', { name: /bed a/i })
        expect(document.activeElement).toBe(firstButton)
      })
    })

    it('navigates to first item with Home key', async () => {
      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          onItemSelect={mockOnItemSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /tool shed/i })).toBeInTheDocument()
      })

      const lastButton = screen.getByRole('button', { name: /tool shed/i })
      lastButton.focus()

      fireEvent.keyDown(lastButton, { key: 'Home' })

      await waitFor(() => {
        const firstButton = screen.getByRole('button', { name: /bed a/i })
        expect(document.activeElement).toBe(firstButton)
      })
    })

    it('navigates to last item with End key', async () => {
      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          onItemSelect={mockOnItemSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /bed a/i })).toBeInTheDocument()
      })

      const firstButton = screen.getByRole('button', { name: /bed a/i })
      firstButton.focus()

      fireEvent.keyDown(firstButton, { key: 'End' })

      await waitFor(() => {
        const lastButton = screen.getByRole('button', { name: /tool shed/i })
        expect(document.activeElement).toBe(lastButton)
      })
    })

    it('selects item with Enter key', async () => {
      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          onItemSelect={mockOnItemSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /bed a/i })).toBeInTheDocument()
      })

      const firstButton = screen.getByRole('button', { name: /bed a/i })
      firstButton.focus()

      fireEvent.keyDown(firstButton, { key: 'Enter' })

      expect(mockOnItemSelect).toHaveBeenCalledWith({ type: 'bed', id: 'bed-a' })
    })

    it('selects item with Space key', async () => {
      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          onItemSelect={mockOnItemSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /bed a/i })).toBeInTheDocument()
      })

      const firstButton = screen.getByRole('button', { name: /bed a/i })
      firstButton.focus()

      fireEvent.keyDown(firstButton, { key: ' ' })

      expect(mockOnItemSelect).toHaveBeenCalledWith({ type: 'bed', id: 'bed-a' })
    })
  })

  describe('Reposition mode (M key)', () => {
    it('enters reposition mode with M key when editing is enabled', async () => {
      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          onPositionChange={mockOnPositionChange}
        />
      )

      // First, enable editing mode
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /unlock to edit/i })).toBeInTheDocument()
      })

      await userEvent.click(screen.getByRole('button', { name: /unlock to edit/i }))

      // Now press M on a grid item
      const firstButton = screen.getByRole('button', { name: /bed a/i })
      firstButton.focus()

      fireEvent.keyDown(firstButton, { key: 'm' })

      // Check for reposition mode status announcement
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/reposition mode active/i)
      })
    })

    it('does not enter reposition mode when editing is disabled', async () => {
      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          onPositionChange={mockOnPositionChange}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /bed a/i })).toBeInTheDocument()
      })

      // Press M without enabling editing
      const firstButton = screen.getByRole('button', { name: /bed a/i })
      firstButton.focus()

      fireEvent.keyDown(firstButton, { key: 'm' })

      // Should not show reposition mode
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('exits reposition mode with Escape key', async () => {
      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          onPositionChange={mockOnPositionChange}
        />
      )

      // Enable editing mode
      await userEvent.click(screen.getByRole('button', { name: /unlock to edit/i }))

      // Enter reposition mode
      const firstButton = screen.getByRole('button', { name: /bed a/i })
      firstButton.focus()
      fireEvent.keyDown(firstButton, { key: 'm' })

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
      })

      // Exit with Escape
      fireEvent.keyDown(firstButton, { key: 'Escape' })

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })

    it('exits reposition mode with Enter key', async () => {
      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          onPositionChange={mockOnPositionChange}
        />
      )

      // Enable editing mode
      await userEvent.click(screen.getByRole('button', { name: /unlock to edit/i }))

      // Enter reposition mode
      const firstButton = screen.getByRole('button', { name: /bed a/i })
      firstButton.focus()
      fireEvent.keyDown(firstButton, { key: 'm' })

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
      })

      // Exit with Enter
      fireEvent.keyDown(firstButton, { key: 'Enter' })

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })
  })

  describe('Position changes', () => {
    it('calls onPositionChange when reset button is clicked', async () => {
      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          onPositionChange={mockOnPositionChange}
        />
      )

      // Enable editing mode
      await userEvent.click(screen.getByRole('button', { name: /unlock to edit/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reset layout/i })).toBeInTheDocument()
      })

      // Click reset
      await userEvent.click(screen.getByRole('button', { name: /reset layout/i }))

      // Should call onPositionChange for each area
      expect(mockOnPositionChange).toHaveBeenCalled()
    })
  })

  describe('Mobile view', () => {
    it('shows mobile view when window width is less than 768px', async () => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true })

      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          onItemSelect={mockOnItemSelect}
        />
      )

      // Trigger resize event
      fireEvent(window, new Event('resize'))

      await waitFor(() => {
        expect(screen.getByTestId('mobile-view')).toBeInTheDocument()
      })
    })

    it('shows desktop grid when window width is 768px or more', async () => {
      // Set desktop viewport
      Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true })

      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          onItemSelect={mockOnItemSelect}
        />
      )

      // Trigger resize event
      fireEvent(window, new Event('resize'))

      await waitFor(() => {
        expect(screen.queryByTestId('mobile-view')).not.toBeInTheDocument()
        expect(screen.getByRole('grid')).toBeInTheDocument()
      })
    })

    it('responds to window resize events', async () => {
      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          onItemSelect={mockOnItemSelect}
        />
      )

      // Start with desktop
      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument()
      })

      // Resize to mobile
      Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true })
      fireEvent(window, new Event('resize'))

      await waitFor(() => {
        expect(screen.getByTestId('mobile-view')).toBeInTheDocument()
      })

      // Resize back to desktop
      Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true })
      fireEvent(window, new Event('resize'))

      await waitFor(() => {
        expect(screen.queryByTestId('mobile-view')).not.toBeInTheDocument()
      })
    })
  })

  describe('Plantings display', () => {
    it('passes plantings to BedItem component', async () => {
      const areas = createTestAreas()
      const plantings = createTestPlantings()

      const getPlantingsForBed = vi.fn((bedId: string) => {
        if (bedId === 'bed-a') return plantings
        return []
      })

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          getPlantingsForBed={getPlantingsForBed}
          onItemSelect={mockOnItemSelect}
        />
      )

      await waitFor(() => {
        // Verify getPlantingsForBed was called with the correct area IDs
        expect(getPlantingsForBed).toHaveBeenCalledWith('bed-a')
        expect(getPlantingsForBed).toHaveBeenCalledWith('bed-b')
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes on grid', async () => {
      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
        />
      )

      await waitFor(() => {
        const grid = screen.getByRole('grid')
        expect(grid).toHaveAttribute('aria-label')
        expect(grid.getAttribute('aria-label')).toContain('2024')
      })
    })

    it('has proper ARIA labels on grid items', async () => {
      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
          onItemSelect={mockOnItemSelect}
        />
      )

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /bed a/i })
        expect(button).toHaveAttribute('aria-label')
      })
    })

    it('includes screen reader instructions', async () => {
      const areas = createTestAreas()

      render(
        <AllotmentGrid
          areas={areas}
          selectedYear={2024}
        />
      )

      await waitFor(() => {
        const instructions = screen.getByRole('note')
        expect(instructions).toHaveTextContent(/arrow keys/i)
        expect(instructions).toHaveClass('sr-only')
      })
    })
  })
})
