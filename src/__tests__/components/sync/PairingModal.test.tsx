import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PairingModal } from '@/components/sync/PairingModal'

vi.mock('@/services/device-identity', () => ({
  getOrCreateIdentity: () => ({
    publicKey: 'test-public-key',
    privateKey: 'test-private-key',
    deviceName: 'Test Device',
    createdAt: new Date().toISOString()
  }),
  createPairingPayload: () => ({
    v: 1, pk: 'test-public-key', code: '123456', name: 'Test Device', ts: Date.now()
  }),
  addPairedDevice: vi.fn()
}))

describe('PairingModal', () => {
  it('renders choice screen when open', () => {
    render(<PairingModal open={true} onClose={() => {}} onPaired={() => {}} />)
    expect(screen.getByText('Add Device')).toBeDefined()
    expect(screen.getByText('Show QR Code')).toBeDefined()
    expect(screen.getByText('Scan QR Code')).toBeDefined()
  })

  it('shows QR code when option selected', () => {
    render(<PairingModal open={true} onClose={() => {}} onPaired={() => {}} />)
    fireEvent.click(screen.getByText('Show QR Code'))
    expect(screen.getByText('Confirmation code:')).toBeDefined()
    expect(screen.getByText('123 456')).toBeDefined()
  })
})
