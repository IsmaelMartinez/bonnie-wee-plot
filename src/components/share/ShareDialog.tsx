'use client'

import { useState, useEffect, useCallback } from 'react'
import { Share2, Copy, CheckCircle, AlertTriangle, Loader2, Clock } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Dialog from '@/components/ui/Dialog'
import type { AllotmentData } from '@/types/unified-allotment'
import { validateAllotmentData } from '@/services/allotment-storage'

interface ShareDialogProps {
  data: AllotmentData | null
  flushSave?: () => Promise<boolean>
}

interface ShareState {
  status: 'idle' | 'selecting' | 'loading' | 'success' | 'error'
  code?: string
  expiresAt?: string
  error?: string
}

// Expiration options in minutes
const EXPIRATION_OPTIONS = [
  { value: 5, label: '5 minutes' },
  { value: 60, label: '1 hour' },
  { value: 1440, label: '1 day' },
  { value: 10080, label: '7 days' },
] as const

export function ShareDialog({ data, flushSave }: ShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [shareState, setShareState] = useState<ShareState>({ status: 'idle' })
  const [copied, setCopied] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [expirationMinutes, setExpirationMinutes] = useState(1440) // Default to 1 day

  // Generate the share URL
  const shareUrl = shareState.code
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/receive/${shareState.code}`
    : ''

  // Start sharing when dialog opens
  const handleShare = useCallback(async () => {
    if (!data) return

    setShareState({ status: 'loading' })

    // Flush any pending saves first
    if (flushSave) {
      try {
        await flushSave()
      } catch {
        // Continue anyway
      }
    }

    // Validate data before uploading
    const validation = validateAllotmentData(data)
    if (!validation.valid) {
      setShareState({
        status: 'error',
        error: `Invalid allotment data: ${validation.errors.join(', ')}`,
      })
      return
    }

    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allotment: data, expirationMinutes }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to share')
      }

      const result = await response.json()
      setShareState({
        status: 'success',
        code: result.code,
        expiresAt: result.expiresAt,
      })
      setTimeRemaining(result.expiresInSeconds)
    } catch (error) {
      setShareState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to share allotment',
      })
    }
  }, [data, flushSave, expirationMinutes])

  // Show selection screen when dialog opens
  useEffect(() => {
    if (isOpen && shareState.status === 'idle' && data) {
      setShareState({ status: 'selecting' })
    }
  }, [isOpen, shareState.status, data])

  // Countdown timer
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          // Mark as expired
          setShareState(prev => ({
            ...prev,
            status: 'error',
            error: 'Share code has expired',
          }))
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeRemaining])

  // Reset state when dialog closes
  const handleClose = () => {
    setIsOpen(false)
    setShareState({ status: 'idle' })
    setCopied(false)
    setTimeRemaining(null)
  }

  // Copy share URL to clipboard
  const handleCopy = async () => {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Format time remaining for display
  const formatTime = (seconds: number) => {
    if (seconds >= 86400) {
      const days = Math.floor(seconds / 86400)
      const hours = Math.floor((seconds % 86400) / 3600)
      return days === 1 ? `${days} day ${hours}h` : `${days} days ${hours}h`
    }
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      return `${hours}h ${mins}m`
    }
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={!data}
        className="flex items-center gap-2 px-4 py-2 bg-zen-moss-600 text-white rounded-lg hover:bg-zen-moss-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Share2 className="w-4 h-4" />
        Share My Allotment
      </button>

      <Dialog
        isOpen={isOpen}
        onClose={handleClose}
        title="Share Your Allotment"
        description="Share your allotment data with another device by scanning the QR code or entering the code manually."
        maxWidth="sm"
      >
        <div className="flex flex-col items-center gap-4 py-4">
          {shareState.status === 'selecting' && (
            <div className="w-full space-y-4">
              <div>
                <label htmlFor="expiration-select" className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline-block mr-1" />
                  How long should the share link be valid?
                </label>
                <select
                  id="expiration-select"
                  value={expirationMinutes}
                  onChange={(e) => setExpirationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zen-moss-500 focus:border-transparent"
                >
                  {EXPIRATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-gray-500">
                {expirationMinutes >= 1440
                  ? 'Longer expiration is convenient for sharing with family and friends.'
                  : 'Shorter expiration is more secure for quick transfers.'}
              </p>
              <button
                onClick={handleShare}
                className="w-full px-4 py-2 bg-zen-moss-600 text-white rounded-lg hover:bg-zen-moss-700 transition font-medium"
              >
                Create Share Link
              </button>
            </div>
          )}

          {shareState.status === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-gray-600">Creating share link...</p>
            </div>
          )}

          {shareState.status === 'error' && (
            <div className="flex flex-col items-center gap-3 py-4 w-full">
              <div className="p-3 bg-zen-kitsune-50 border border-zen-kitsune-200 rounded-lg flex items-start gap-2 w-full">
                <AlertTriangle className="w-5 h-5 text-zen-kitsune-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-zen-kitsune-700">Unable to share</p>
                  <p className="text-sm text-zen-kitsune-600 mt-1">{shareState.error}</p>
                </div>
              </div>
              <button
                onClick={handleShare}
                className="mt-2 px-4 py-2 bg-zen-moss-600 text-white rounded-lg hover:bg-zen-moss-700 transition"
              >
                Try Again
              </button>
            </div>
          )}

          {shareState.status === 'success' && shareState.code && (
            <>
              {/* QR Code */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <QRCodeSVG value={shareUrl} size={200} level="M" />
              </div>

              {/* Share Code */}
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Or enter this code:</p>
                <p className="text-3xl font-mono font-bold tracking-widest text-gray-800">
                  {shareState.code.slice(0, 3)} {shareState.code.slice(3)}
                </p>
              </div>

              {/* Timer */}
              {timeRemaining !== null && timeRemaining > 0 && (
                <p className="text-sm text-gray-500">
                  Expires in <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
                </p>
              )}

              {/* URL and Copy Button */}
              <div className="w-full mt-2">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 bg-transparent text-sm text-gray-600 outline-none truncate"
                  />
                  <button
                    onClick={handleCopy}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition shrink-0"
                    title="Copy link"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {copied && (
                  <p className="text-xs text-emerald-600 mt-1 text-center">Copied to clipboard!</p>
                )}
              </div>

              {/* Instructions */}
              <div className="text-center text-sm text-gray-500 mt-2">
                <p>On the receiving device, scan the QR code or visit:</p>
                <p className="font-medium text-gray-700 mt-1">{window.location.origin}/receive</p>
              </div>
            </>
          )}
        </div>
      </Dialog>
    </>
  )
}
