'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/shadcn-dialog'
import { QRCodeDisplay } from './QRCodeDisplay'
import { QRCodeScanner } from './QRCodeScanner'
import { getOrCreateIdentity, createPairingPayload, addPairedDevice } from '@/services/device-identity'
import type { PairingPayload, PairedDevice } from '@/types/sync'

interface PairingModalProps {
  open: boolean
  onClose: () => void
  onPaired: (device: PairedDevice) => void
}

type PairingStep = 'choose' | 'show-qr' | 'scan-qr' | 'confirm' | 'success'

export function PairingModal({ open, onClose, onPaired }: PairingModalProps) {
  const [step, setStep] = useState<PairingStep>('choose')
  const [payload, setPayload] = useState<PairingPayload | null>(null)
  const [scannedPayload, setScannedPayload] = useState<PairingPayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (step === 'show-qr') {
      const identity = getOrCreateIdentity()
      setPayload(createPairingPayload(identity))
    }
  }, [step])

  useEffect(() => {
    if (step !== 'show-qr') return
    const interval = setInterval(() => {
      const identity = getOrCreateIdentity()
      setPayload(createPairingPayload(identity))
    }, 4 * 60 * 1000)
    return () => clearInterval(interval)
  }, [step])

  const handleScan = (scanned: PairingPayload) => {
    setScannedPayload(scanned)
    setStep('confirm')
  }

  const handleConfirm = () => {
    if (!scannedPayload) return
    const device: PairedDevice = {
      publicKey: scannedPayload.pk,
      deviceName: scannedPayload.name,
      pairedAt: new Date().toISOString()
    }
    addPairedDevice(device)
    onPaired(device)
    setStep('success')
  }

  const handleClose = () => {
    setStep('choose')
    setPayload(null)
    setScannedPayload(null)
    setError(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'choose' && 'Add Device'}
            {step === 'show-qr' && 'Show QR Code'}
            {step === 'scan-qr' && 'Scan QR Code'}
            {step === 'confirm' && 'Confirm Pairing'}
            {step === 'success' && 'Device Paired!'}
          </DialogTitle>
        </DialogHeader>

        {step === 'choose' && (
          <div className="flex flex-col gap-4">
            <button onClick={() => setStep('show-qr')} className="p-4 border rounded-lg text-left hover:bg-gray-50">
              <p className="font-medium">Show QR Code</p>
              <p className="text-sm text-gray-500">Let another device scan this one</p>
            </button>
            <button onClick={() => setStep('scan-qr')} className="p-4 border rounded-lg text-left hover:bg-gray-50">
              <p className="font-medium">Scan QR Code</p>
              <p className="text-sm text-gray-500">Scan a code from another device</p>
            </button>
          </div>
        )}

        {step === 'show-qr' && payload && <QRCodeDisplay payload={payload} />}

        {step === 'scan-qr' && <QRCodeScanner onScan={handleScan} onError={setError} />}

        {step === 'confirm' && scannedPayload && (
          <div className="text-center">
            <p className="mb-4">Pair with <strong>{scannedPayload.name}</strong>?</p>
            <p className="text-sm text-gray-500 mb-4">Verify this code matches the other device:</p>
            <p className="text-3xl font-mono font-bold tracking-wider mb-6">
              {scannedPayload.code.slice(0, 3)} {scannedPayload.code.slice(3)}
            </p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setStep('scan-qr')} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleConfirm} className="px-4 py-2 bg-green-600 text-white rounded">Confirm</button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✓</div>
            <p className="text-lg font-medium mb-2">Successfully paired!</p>
            <p className="text-sm text-gray-500 mb-4">Your devices will now sync automatically when on the same network.</p>
            <button onClick={handleClose} className="px-4 py-2 bg-blue-600 text-white rounded">Done</button>
          </div>
        )}

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      </DialogContent>
    </Dialog>
  )
}
