import { useEffect, useRef, useState, useCallback } from 'react'

export interface UseComboboxOptions<T> {
  items: T[]
  onSelect: (item: T) => void
  onClose?: () => void
  isOpen: boolean
}

export interface UseComboboxReturn {
  highlightedIndex: number
  setHighlightedIndex: (index: number) => void
  handleKeyDown: (e: KeyboardEvent) => void
  listRef: React.RefObject<HTMLUListElement | null>
  itemRefs: React.RefObject<Map<number, HTMLLIElement>>
}

/**
 * Custom hook for managing combobox keyboard navigation and state
 *
 * Features:
 * - Arrow key navigation (up/down)
 * - Enter key to select highlighted item
 * - Escape key to close
 * - Home/End keys to jump to first/last
 * - Auto-scroll highlighted item into view
 *
 * @param options Configuration object
 * @returns Combobox state and handlers
 */
export function useCombobox<T>({
  items,
  onSelect,
  onClose,
  isOpen,
}: UseComboboxOptions<T>): UseComboboxReturn {
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)
  const itemRefs = useRef<Map<number, HTMLLIElement>>(new Map())

  // Reset highlighted index when items change
  useEffect(() => {
    setHighlightedIndex(0)
  }, [items])

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && highlightedIndex < items.length) {
      const item = itemRefs.current.get(highlightedIndex)
      if (item) {
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [highlightedIndex, isOpen, items.length])

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex(prev =>
            prev < items.length - 1 ? prev + 1 : prev
          )
          break

        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev))
          break

        case 'Enter':
          e.preventDefault()
          if (items[highlightedIndex]) {
            onSelect(items[highlightedIndex])
          }
          break

        case 'Escape':
          e.preventDefault()
          onClose?.()
          break

        case 'Home':
          e.preventDefault()
          setHighlightedIndex(0)
          break

        case 'End':
          e.preventDefault()
          setHighlightedIndex(items.length - 1)
          break

        default:
          // Allow other keys to propagate
          break
      }
    },
    [isOpen, items, highlightedIndex, onSelect, onClose]
  )

  return {
    highlightedIndex,
    setHighlightedIndex,
    handleKeyDown,
    listRef,
    itemRefs,
  }
}
