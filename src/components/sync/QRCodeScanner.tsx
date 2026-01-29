'use client'

import { useState } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import type { PairingPayload } from '@/types/sync'

interface QRCodeScannerProps {
  onScan: (payload: PairingPayload) => void
  onError: (error: string) => void
}

export function QRCodeScanner({ onScan, onError }: QRCodeScannerProps) {
  const [hasPermission, setHasPermission] = useState(true)

  const handleScan = (result: { rawValue: string }[]) => {
    if (result.length === 0) return
    try {
      const payload = JSON.parse(result[0].rawValue) as PairingPayload
      if (payload.v !== 1 || !payload.pk || !payload.code || !payload.name) {
        onError('Invalid QR code format')
        return
      }
      onScan(payload)
    } catch {
      onError('Could not read QR code')
    }
  }

  const handleError = (error: unknown) => {
    if (error instanceof Error && error.name === 'NotAllowedError') {
      setHasPermission(false)
    }
    onError('Camera error')
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
      />
      <p className="text-sm text-gray-500 text-center mt-4">
        Point your camera at the QR code on the other device
      </p>
    </div>
  )
}
