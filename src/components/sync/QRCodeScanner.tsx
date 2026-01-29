'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import type { PairingPayload } from '@/types/sync'

interface QRCodeScannerProps {
  onScan: (payload: PairingPayload) => void
  onError: (error: string) => void
}

export function QRCodeScanner({ onScan, onError }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState('Initializing camera...')
  const [hasPermission, setHasPermission] = useState(true)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const hasProcessedRef = useRef(false)

  useEffect(() => {
    const scannerId = 'qr-scanner-container'

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
            console.log('QR Scanned:', decodedText)

            try {
              const payload = JSON.parse(decodedText) as PairingPayload
              if (payload.v !== 1 || !payload.pk || !payload.code || !payload.name) {
                onError('Invalid QR code - not a Bonnie Wee Plot pairing code')
                hasProcessedRef.current = false
                setScanStatus('Point camera at QR code')
                return
              }

              // Stop scanner before calling onScan
              scanner.stop().catch(console.error)
              onScan(payload)
            } catch {
              onError('Could not read QR code - invalid format')
              hasProcessedRef.current = false
              setScanStatus('Point camera at QR code')
            }
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
            setHasPermission(false)
            return
          }
          setScanStatus(`Error: ${err.message}`)
        }
        onError('Failed to start camera')
      }
    }

    startScanner()

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error)
      }
    }
  }, [onScan, onError])

  if (!hasPermission) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-2">Camera access denied</p>
        <p className="text-sm text-gray-500">
          Please enable camera access in your browser settings and reload the page.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div
        id="qr-scanner-container"
        className="rounded-lg overflow-hidden"
        style={{ minHeight: '300px' }}
      />
      <p className="text-sm text-gray-500 text-center mt-4">
        {scanStatus}
      </p>
      <p className="text-xs text-gray-400 text-center mt-2">
        {isScanning ? 'Position the QR code within the frame' : 'Starting camera...'}
      </p>
    </div>
  )
}
