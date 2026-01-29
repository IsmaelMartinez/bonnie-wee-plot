'use client'

import { useState, useEffect } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import type { PairingPayload } from '@/types/sync'

interface QRCodeScannerProps {
  onScan: (payload: PairingPayload) => void
  onError: (error: string) => void
}

export function QRCodeScanner({ onScan, onError }: QRCodeScannerProps) {
  const [hasPermission, setHasPermission] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState<string>('Initializing camera...')

  useEffect(() => {
    // Check if BarcodeDetector API is available
    if (!('BarcodeDetector' in window)) {
      setScanStatus('QR scanning may not work in this browser. Try Chrome or Safari.')
    } else {
      setScanStatus('Point camera at QR code')
    }
  }, [])

  const handleScan = (result: { rawValue: string }[]) => {
    if (result.length === 0) return
    if (isScanning) return // Prevent double scans

    setIsScanning(true)
    setScanStatus('QR code detected!')

    try {
      const rawValue = result[0].rawValue
      console.log('QR Scanned:', rawValue) // Debug log

      const payload = JSON.parse(rawValue) as PairingPayload
      if (payload.v !== 1 || !payload.pk || !payload.code || !payload.name) {
        onError('Invalid QR code - not a Bonnie Wee Plot pairing code')
        setIsScanning(false)
        setScanStatus('Point camera at QR code')
        return
      }
      onScan(payload)
    } catch {
      onError('Could not read QR code - invalid format')
      setIsScanning(false)
      setScanStatus('Point camera at QR code')
    }
  }

  const handleError = (error: unknown) => {
    console.error('Scanner error:', error) // Debug log
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        setHasPermission(false)
        return
      }
      setScanStatus(`Error: ${error.message}`)
    }
    onError('Camera error - please try again')
  }

  if (!hasPermission) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-2">Camera access denied</p>
        <p className="text-sm text-gray-500">
          Please enable camera access in your browser settings.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <Scanner
        onScan={handleScan}
        onError={handleError}
        constraints={{ facingMode: 'environment' }}
        styles={{ container: { borderRadius: '8px', overflow: 'hidden' } }}
        formats={['qr_code']}
      />
      <p className="text-sm text-gray-500 text-center mt-4">
        {scanStatus}
      </p>
      <p className="text-xs text-gray-400 text-center mt-2">
        Make sure the QR code is well-lit and fully visible
      </p>
    </div>
  )
}
