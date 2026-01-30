'use client'

import { useState, useEffect, useCallback } from 'react'
import { Share2, Copy, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Dialog from '@/components/ui/Dialog'
import type { AllotmentData } from '@/types/unified-allotment'

interface ShareDialogProps {
  data: AllotmentData | null
  flushSave?: () => Promise<boolean>
}

interface ShareState {
  status: 'idle' | 'loading' | 'success' | 'error'
  code?: string
  expiresAt?: string
  error?: string
}

export function ShareDialog({ data, flushSave }: ShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [shareState, setShareState] = useState<ShareState>({ status: 'idle' })
  const [copied, setCopied] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

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

    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allotment: data }),
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
  }, [data, flushSave])

  // Auto-share when dialog opens
  useEffect(() => {
    if (isOpen && shareState.status === 'idle' && data) {
      handleShare()
    }
  }, [isOpen, shareState.status, data, handleShare])

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

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={!data}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
          {shareState.status === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-gray-600">Creating share link...</p>
            </div>
          )}

          {shareState.status === 'error' && (
            <div className="flex flex-col items-center gap-3 py-4 w-full">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 w-full">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700">Unable to share</p>
                  <p className="text-sm text-red-600 mt-1">{shareState.error}</p>
                </div>
              </div>
              <button
                onClick={handleShare}
                className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
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
