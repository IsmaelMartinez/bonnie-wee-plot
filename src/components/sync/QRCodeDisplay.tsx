'use client'

import { QRCodeSVG } from 'qrcode.react'
import type { PairingPayload } from '@/types/sync'

interface QRCodeDisplayProps {
  payload: PairingPayload
}

export function QRCodeDisplay({ payload }: QRCodeDisplayProps) {
  const qrValue = JSON.stringify(payload)

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-lg">
        <QRCodeSVG value={qrValue} size={200} />
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-2">Confirmation code:</p>
        <p className="text-3xl font-mono font-bold tracking-wider">
          {payload.code.slice(0, 3)} {payload.code.slice(3)}
        </p>
      </div>
      <p className="text-xs text-gray-400">Code expires in 5 minutes</p>
    </div>
  )
}
