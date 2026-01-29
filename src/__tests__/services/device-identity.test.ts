import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockStorage: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => { mockStorage[key] = value },
  removeItem: (key: string) => { delete mockStorage[key] }
})

describe('Device Identity Service', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])
  })

  it('generates new device identity', async () => {
    const { generateDeviceIdentity } = await import('@/services/device-identity')
    const identity = generateDeviceIdentity('My iPhone')

    expect(identity.publicKey).toBeDefined()
    expect(identity.privateKey).toBeDefined()
    expect(identity.deviceName).toBe('My iPhone')
    expect(identity.publicKey).not.toBe(identity.privateKey)
  })

  it('stores and retrieves identity', async () => {
    const { generateDeviceIdentity, saveIdentity, loadIdentity } = await import('@/services/device-identity')
    const identity = generateDeviceIdentity('Test Device')
    saveIdentity(identity)

    const loaded = loadIdentity()
    expect(loaded).toEqual(identity)
  })

  it('creates pairing payload with confirmation code', async () => {
    const { generateDeviceIdentity, createPairingPayload } = await import('@/services/device-identity')
    const identity = generateDeviceIdentity('iPhone')
    const payload = createPairingPayload(identity)

    expect(payload.v).toBe(1)
    expect(payload.pk).toBe(identity.publicKey)
    expect(payload.code).toMatch(/^\d{6}$/)
    expect(payload.name).toBe('iPhone')
  })

  it('signs and verifies challenges', async () => {
    const { generateDeviceIdentity, signChallenge, verifySignature } = await import('@/services/device-identity')
    const identity = generateDeviceIdentity('Device')
    const challenge = 'test-challenge-12345'

    const signature = signChallenge(challenge, identity.privateKey)
    const valid = verifySignature(challenge, signature, identity.publicKey)

    expect(valid).toBe(true)
  })
})
