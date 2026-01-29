import nacl from 'tweetnacl'
import { encodeBase64, decodeBase64 } from 'tweetnacl-util'
import type { DeviceIdentity, PairedDevice, PairingPayload } from '@/types/sync'
import { logger } from '@/lib/logger'

const IDENTITY_KEY = 'bonnieplot-device-identity'
const PAIRED_DEVICES_KEY = 'bonnieplot-paired-devices'
const PAIRING_CODE_EXPIRY_MS = 5 * 60 * 1000

export function generateDeviceIdentity(deviceName: string): DeviceIdentity {
  const keypair = nacl.sign.keyPair()
  return {
    publicKey: encodeBase64(keypair.publicKey),
    privateKey: encodeBase64(keypair.secretKey),
    deviceName,
    createdAt: new Date().toISOString()
  }
}

export function saveIdentity(identity: DeviceIdentity): void {
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity))
  logger.info('Saved device identity', { deviceName: identity.deviceName })
}

export function loadIdentity(): DeviceIdentity | null {
  const stored = localStorage.getItem(IDENTITY_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored) as DeviceIdentity
  } catch {
    logger.error('Failed to parse stored identity')
    return null
  }
}

export function getOrCreateIdentity(defaultName: string = 'My Device'): DeviceIdentity {
  const existing = loadIdentity()
  if (existing) return existing
  const identity = generateDeviceIdentity(defaultName)
  saveIdentity(identity)
  return identity
}

export function updateDeviceName(newName: string): DeviceIdentity | null {
  const identity = loadIdentity()
  if (!identity) return null
  identity.deviceName = newName
  saveIdentity(identity)
  return identity
}

function generateConfirmationCode(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return String(array[0] % 1000000).padStart(6, '0')
}

export function createPairingPayload(identity: DeviceIdentity): PairingPayload {
  return {
    v: 1,
    pk: identity.publicKey,
    code: generateConfirmationCode(),
    name: identity.deviceName,
    ts: Date.now()
  }
}

export function validatePairingCode(code: string, payload: PairingPayload): boolean {
  if (code !== payload.code) return false
  const age = Date.now() - payload.ts
  if (age > PAIRING_CODE_EXPIRY_MS) {
    logger.warn('Pairing code expired', { age })
    return false
  }
  return true
}

export function signChallenge(challenge: string, privateKeyBase64: string): string {
  const privateKey = decodeBase64(privateKeyBase64)
  const encoded = new TextEncoder().encode(challenge)
  // Ensure we have a proper Uint8Array (not a polyfill)
  const message = new Uint8Array(encoded)
  const signature = nacl.sign.detached(message, privateKey)
  return encodeBase64(signature)
}

export function verifySignature(challenge: string, signatureBase64: string, publicKeyBase64: string): boolean {
  try {
    const publicKey = decodeBase64(publicKeyBase64)
    const signature = decodeBase64(signatureBase64)
    const encoded = new TextEncoder().encode(challenge)
    // Ensure we have a proper Uint8Array (not a polyfill)
    const message = new Uint8Array(encoded)
    return nacl.sign.detached.verify(message, signature, publicKey)
  } catch {
    return false
  }
}

export function getPairedDevices(): PairedDevice[] {
  const stored = localStorage.getItem(PAIRED_DEVICES_KEY)
  if (!stored) return []
  try {
    return JSON.parse(stored) as PairedDevice[]
  } catch {
    return []
  }
}

export function addPairedDevice(device: PairedDevice): void {
  const devices = getPairedDevices()
  const existing = devices.find(d => d.publicKey === device.publicKey)
  if (existing) {
    Object.assign(existing, device)
  } else {
    devices.push(device)
  }
  localStorage.setItem(PAIRED_DEVICES_KEY, JSON.stringify(devices))
  logger.info('Added paired device', { deviceName: device.deviceName })
}

export function removePairedDevice(publicKey: string): void {
  const devices = getPairedDevices().filter(d => d.publicKey !== publicKey)
  localStorage.setItem(PAIRED_DEVICES_KEY, JSON.stringify(devices))
  logger.info('Removed paired device')
}

export function updateDeviceLastSeen(publicKey: string): void {
  const devices = getPairedDevices()
  const device = devices.find(d => d.publicKey === publicKey)
  if (device) {
    device.lastSeen = new Date().toISOString()
    localStorage.setItem(PAIRED_DEVICES_KEY, JSON.stringify(devices))
  }
}

export function isPairedDevice(publicKey: string): boolean {
  return getPairedDevices().some(d => d.publicKey === publicKey)
}

export function getTruncatedPublicKey(publicKey: string): string {
  return publicKey.substring(0, 16)
}
