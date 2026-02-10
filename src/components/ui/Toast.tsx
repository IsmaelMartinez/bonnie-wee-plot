/**
 * Toast Component
 *
 * A simple toast notification component for success/error feedback.
 * Auto-dismisses after a configurable duration.
 */

'use client'

import { useEffect, useState } from 'react'
import { Check, AlertCircle, X, Info } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onDismiss?: () => void
}

const icons = {
  success: Check,
  error: AlertCircle,
  info: Info,
}

const styles = {
  success: {
    bg: 'bg-zen-moss-50',
    border: 'border-zen-moss-200',
    text: 'text-zen-moss-800',
    icon: 'text-zen-moss-600',
  },
  error: {
    bg: 'bg-zen-kitsune-50',
    border: 'border-zen-kitsune-200',
    text: 'text-zen-kitsune-800',
    icon: 'text-zen-kitsune-600',
  },
  info: {
    bg: 'bg-zen-water-50',
    border: 'border-zen-water-200',
    text: 'text-zen-water-800',
    icon: 'text-blue-600',
  },
}

export function Toast({
  message,
  type = 'success',
  duration = 4000,
  onDismiss,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsLeaving(true)
        setTimeout(() => {
          setIsVisible(false)
          onDismiss?.()
        }, 200) // Animation duration
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onDismiss])

  if (!isVisible) return null

  const Icon = icons[type]
  const style = styles[type]

  const handleDismiss = () => {
    setIsLeaving(true)
    setTimeout(() => {
      setIsVisible(false)
      onDismiss?.()
    }, 200)
  }

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-50
        flex items-start gap-3 p-4 rounded-lg shadow-lg border
        ${style.bg} ${style.border}
        transition-all duration-200
        ${isLeaving ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
      `}
      role="alert"
      aria-live="polite"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${style.icon}`} aria-hidden="true" />
      <p className={`text-sm ${style.text} flex-1 max-w-xs`}>{message}</p>
      <button
        onClick={handleDismiss}
        className={`${style.icon} hover:opacity-70 transition`}
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  )
}

/**
 * Toast container for multiple toasts
 */
export interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastContainerProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ transform: `translateY(-${index * 8}px)` }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            onDismiss={() => onDismiss(toast.id)}
          />
        </div>
      ))}
    </div>
  )
}

export default Toast
