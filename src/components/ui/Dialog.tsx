/**
 * Accessible Dialog Component
 *
 * Features:
 * - Proper ARIA attributes for screen readers
 * - Focus trap (keyboard navigation stays within dialog)
 * - Escape key closes dialog
 * - Click outside closes dialog (optional)
 * - Returns focus to trigger element on close
 * - Prevents body scroll when open
 * - Bottom sheet variant for mobile-friendly presentation
 */

'use client'

import { useEffect, useRef, useCallback, ReactNode, useState } from 'react'
import { X } from 'lucide-react'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  closeOnOutsideClick?: boolean
  showCloseButton?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** When true, children get no wrapper padding and fill available space */
  fullContent?: boolean
  /** Variant: 'modal' (default centered dialog) or 'bottom-sheet' (slides from bottom on mobile) */
  variant?: 'modal' | 'bottom-sheet'
}

// Get all focusable elements within a container
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  return Array.from(elements).filter(
    el => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
  )
}

export default function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  closeOnOutsideClick = true,
  showCloseButton = true,
  maxWidth = 'md',
  fullContent = false,
  variant = 'modal',
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)
  const titleId = useRef(`dialog-title-${Math.random().toString(36).substr(2, 9)}`)
  const descriptionId = useRef(`dialog-desc-${Math.random().toString(36).substr(2, 9)}`)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile viewport for bottom sheet variant
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Store the element that had focus before dialog opened
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
    }
  }, [isOpen])

  // Focus management and body scroll lock
  useEffect(() => {
    if (!isOpen) return

    // Prevent body scroll
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus the dialog or first focusable element
    const focusFirstElement = () => {
      if (dialogRef.current) {
        const focusable = getFocusableElements(dialogRef.current)
        if (focusable.length > 0) {
          focusable[0].focus()
        } else {
          dialogRef.current.focus()
        }
      }
    }

    // Small delay to ensure dialog is rendered
    const timeoutId = setTimeout(focusFirstElement, 10)

    return () => {
      clearTimeout(timeoutId)
      document.body.style.overflow = originalOverflow
      
      // Return focus to previous element
      if (previousActiveElement.current && previousActiveElement.current.focus) {
        previousActiveElement.current.focus()
      }
    }
  }, [isOpen])

  // Keyboard event handlers
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen || !dialogRef.current) return

    // Escape key closes dialog
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }

    // Tab key trap
    if (e.key === 'Tab') {
      const focusable = getFocusableElements(dialogRef.current)
      if (focusable.length === 0) return

      const firstElement = focusable[0]
      const lastElement = focusable[focusable.length - 1]

      if (e.shiftKey) {
        // Shift+Tab: if at first element, go to last
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab: if at last element, go to first
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }
  }, [isOpen, onClose])

  // Add/remove keyboard listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }

  // Use bottom sheet presentation on mobile when variant is 'bottom-sheet'
  const useBottomSheet = variant === 'bottom-sheet' && isMobile

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 ${
          useBottomSheet ? 'animate-fade-in' : ''
        }`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Centering/positioning wrapper */}
      <div
        className={`relative z-[101] flex min-h-full ${
          useBottomSheet
            ? 'items-end justify-center p-0'
            : 'items-center justify-center p-4'
        }`}
      >
        {/* Dialog */}
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId.current}
          aria-describedby={description ? descriptionId.current : undefined}
          tabIndex={-1}
          className={`relative z-[102] bg-white shadow-xl w-full flex flex-col focus:outline-none ${
            useBottomSheet
              ? 'rounded-t-2xl max-h-[85vh] animate-slide-up'
              : `rounded-xl ${maxWidthClasses[maxWidth]} max-h-[90vh]`
          }`}
        >
          {/* Drag handle for bottom sheet (visual affordance) */}
          {useBottomSheet && (
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
          )}

          {/* Header */}
          <div
            className={`flex items-center justify-between border-b border-gray-200 shrink-0 ${
              useBottomSheet ? 'px-4 py-3' : 'p-4'
            }`}
          >
            <h2
              id={titleId.current}
              className={`font-bold text-gray-800 ${useBottomSheet ? 'text-xl' : 'text-lg'}`}
            >
              {title}
            </h2>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Description (optional) */}
          {description && (
            <p
              id={descriptionId.current}
              className={`text-sm text-gray-600 shrink-0 ${
                useBottomSheet ? 'px-4 pt-2' : 'px-4 pt-3'
              }`}
            >
              {description}
            </p>
          )}

          {/* Content */}
          {fullContent ? (
            <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
              {children}
            </div>
          ) : (
            <div
              className={`overflow-y-auto flex-1 ${
                useBottomSheet ? 'p-4 pb-8' : 'p-4'
              }`}
            >
              {children}
            </div>
          )}

          {/* Safe area padding for iOS home indicator */}
          {useBottomSheet && (
            <div className="shrink-0 pb-safe" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Confirmation Dialog for destructive actions
 * Uses accessible Dialog component
 */
interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const variantClasses = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
    >
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-3 min-h-[44px] border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className={`flex-1 px-4 py-3 min-h-[44px] text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantClasses[variant]}`}
        >
          {confirmText}
        </button>
      </div>
    </Dialog>
  )
}

