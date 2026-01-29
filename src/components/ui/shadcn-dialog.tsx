/**
 * Shadcn-style Dialog components
 * Simplified dialog system for pairing modal
 */

'use client'

import { ReactNode, useEffect } from 'react'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    if (!open) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div className="relative z-[101] flex min-h-full items-center justify-center p-4">
        {children}
      </div>
    </div>
  )
}

interface DialogContentProps {
  children: ReactNode
  className?: string
}

export function DialogContent({ children, className = '' }: DialogContentProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`relative z-[102] bg-white rounded-xl shadow-xl w-full max-w-md p-6 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}

interface DialogHeaderProps {
  children: ReactNode
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return <div className="mb-4">{children}</div>
}

interface DialogTitleProps {
  children: ReactNode
}

export function DialogTitle({ children }: DialogTitleProps) {
  return <h2 className="text-lg font-bold text-gray-800">{children}</h2>
}
