import type { AllotmentData } from '@/types/unified-allotment'

export interface RemoteData {
  data: AllotmentData
  updatedAt: string
}

export async function fetchRemote(): Promise<RemoteData | null> {
  const res = await fetch('/api/sync')
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Sync fetch failed (${res.status})`)
  return res.json()
}

export async function pushToRemote(data: AllotmentData): Promise<void> {
  const res = await fetch('/api/sync', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  })
  if (!res.ok) throw new Error(`Sync push failed (${res.status})`)
}

export async function deleteRemote(): Promise<void> {
  const res = await fetch('/api/sync', { method: 'DELETE' })
  if (!res.ok) throw new Error(`Sync delete failed (${res.status})`)
}
