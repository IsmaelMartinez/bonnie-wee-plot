'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Home, QrCode, Keyboard } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'

type InputMode = 'choose' | 'scan' | 'manual'

export default function ReceiveIndexPage() {
  const router = useRouter()
  const [mode, setMode] = useState<InputMode>('choose')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [scanStatus, setScanStatus] = useState('Initializing camera...')
  const [isScanning, setIsScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const hasProcessedRef = useRef(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Normalize: remove spaces, uppercase
    const normalizedCode = code.replace(/\s/g, '').toUpperCase()

    // Validate format
    if (!/^[A-Z0-9]{6}$/i.test(normalizedCode)) {
      setError('Please enter a valid 6-character code')
      return
    }

    router.push(`/receive/${normalizedCode}`)
  }

  const handleScan = useCallback((result: string) => {
    // Try to extract code from URL
    const urlMatch = result.match(/\/receive\/([A-Z0-9]{6})/i)
    if (urlMatch) {
      router.push(`/receive/${urlMatch[1].toUpperCase()}`)
      return
    }

    // Or just treat as a code directly
    const codeMatch = result.match(/^[A-Z0-9]{6}$/i)
    if (codeMatch) {
      router.push(`/receive/${result.toUpperCase()}`)
      return
    }

    setScannerError('Invalid QR code. Please scan the share QR code.')
    hasProcessedRef.current = false
    setScanStatus('Point camera at QR code')
  }, [router])

  // Start/stop scanner based on mode
  useEffect(() => {
    if (mode !== 'scan') {
      // Stop scanner when leaving scan mode
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error)
      }
      return
    }

    const scannerId = 'qr-scanner-container'
    hasProcessedRef.current = false

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(scannerId)
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            if (hasProcessedRef.current) return
            hasProcessedRef.current = true

            setScanStatus('QR code detected!')

            // Stop scanner before navigating
            scanner.stop().catch(console.error)
            handleScan(decodedText)
          },
          () => {
            // Ignore scan failures (no QR found in frame)
          }
        )

        setIsScanning(true)
        setScanStatus('Point camera at QR code')
      } catch (err) {
        console.error('Scanner error:', err)
        if (err instanceof Error) {
          if (err.message.includes('NotAllowedError') || err.message.includes('Permission')) {
            setScannerError('Camera access denied. Please enable camera access in your browser settings.')
            return
          }
          setScanStatus(`Error: ${err.message}`)
        }
        setScannerError('Failed to start camera')
      }
    }

    startScanner()

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error)
      }
    }
  }, [mode, handleScan])

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Receive Allotment</h1>
          <p className="text-gray-600">
            Import allotment data shared by another device
          </p>
        </div>

        {/* Mode Selection */}
        {mode === 'choose' && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('scan')}
              className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left"
            >
              <div className="w-10 h-10 rounded-full bg-zen-moss-100 flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5 text-zen-moss-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">Scan QR Code</p>
                <p className="text-sm text-gray-500">Use your camera to scan</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => setMode('manual')}
              className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left"
            >
              <div className="w-10 h-10 rounded-full bg-zen-water-100 flex items-center justify-center shrink-0">
                <Keyboard className="w-5 h-5 text-zen-water-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">Enter Code</p>
                <p className="text-sm text-gray-500">Type the 6-digit code</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>

            <div className="pt-4">
              <button
                onClick={() => router.push('/')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>
          </div>
        )}

        {/* QR Scanner */}
        {mode === 'scan' && (
          <div className="space-y-4">
            <div
              id="qr-scanner-container"
              className="rounded-lg overflow-hidden bg-black"
              style={{ minHeight: '300px' }}
            />

            <p className="text-sm text-gray-500 text-center">
              {scanStatus}
            </p>
            <p className="text-xs text-gray-400 text-center">
              {isScanning ? 'Position the QR code within the frame' : 'Starting camera...'}
            </p>

            {scannerError && (
              <p className="text-sm text-zen-kitsune-600 text-center">{scannerError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setMode('choose')
                  setScannerError(null)
                  setScanStatus('Initializing camera...')
                  setIsScanning(false)
                }}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setMode('manual')
                  setScannerError(null)
                  setScanStatus('Initializing camera...')
                  setIsScanning(false)
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Enter Code Instead
              </button>
            </div>
          </div>
        )}

        {/* Manual Entry */}
        {mode === 'manual' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Share Code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase())
                  setError(null)
                }}
                placeholder="ABC 123"
                maxLength={7} // Allow space in middle
                className="w-full px-4 py-3 text-2xl font-mono text-center tracking-widest border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zen-moss-500 focus:border-transparent uppercase"
                autoFocus
                autoComplete="off"
                autoCapitalize="characters"
              />
              {error && (
                <p className="mt-2 text-sm text-zen-kitsune-600">{error}</p>
              )}
            </div>

            <p className="text-sm text-gray-500 text-center">
              Enter the 6-character code shown on the sharing device
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode('choose')
                  setCode('')
                  setError(null)
                }}
                className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={code.replace(/\s/g, '').length < 6}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zen-moss-600 text-white rounded-lg hover:bg-zen-moss-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
