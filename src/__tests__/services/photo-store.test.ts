/**
 * Photo blob store tests. fake-indexeddb (installed in setup.ts) provides
 * the IndexedDB implementation; blobs are plain jsdom Blobs.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  putPhoto,
  getPhoto,
  deletePhoto,
  listPhotos,
  createPhotoUrl,
  revokePhotoUrl,
  type StoredPhoto,
} from '@/services/photo-store'

function makePhoto(id: string, overrides: Partial<StoredPhoto> = {}): StoredPhoto {
  return {
    id,
    blob: new Blob(['fake-jpeg-bytes'], { type: 'image/jpeg' }),
    takenAt: '2026-04-12T09:30:00',
    latitude: 55.9533,
    longitude: -3.1883,
    bedId: 'bed-a',
    exifJson: JSON.stringify({ takenAt: '2026-04-12T09:30:00' }),
    ...overrides,
  }
}

describe('photo-store', () => {
  beforeEach(async () => {
    // Isolate tests: drop every record left by the previous test.
    const photos = await listPhotos()
    await Promise.all(photos.map(p => deletePhoto(p.id)))
  })

  it('round-trips a photo record through put/get', async () => {
    const photo = makePhoto('photo-1')
    await putPhoto(photo)

    const loaded = await getPhoto('photo-1')
    expect(loaded).not.toBeNull()
    expect(loaded!.id).toBe('photo-1')
    expect(loaded!.takenAt).toBe('2026-04-12T09:30:00')
    expect(loaded!.latitude).toBeCloseTo(55.9533, 4)
    expect(loaded!.bedId).toBe('bed-a')
    expect(loaded!.exifJson).toBe(photo.exifJson)
    // Blob fidelity can't be asserted here: fake-indexeddb's structured
    // clone doesn't preserve jsdom Blobs (real browser IndexedDB stores
    // Blobs natively). We can only assert the property survives the trip.
    expect(loaded!.blob).toBeDefined()
  })

  it('returns null for an unknown id', async () => {
    expect(await getPhoto('nope')).toBeNull()
  })

  it('overwrites on put with the same id', async () => {
    await putPhoto(makePhoto('photo-1', { bedId: 'bed-a' }))
    await putPhoto(makePhoto('photo-1', { bedId: 'bed-b' }))
    const loaded = await getPhoto('photo-1')
    expect(loaded!.bedId).toBe('bed-b')
    expect(await listPhotos()).toHaveLength(1)
  })

  it('lists metadata without the blob payload', async () => {
    await putPhoto(makePhoto('photo-1'))
    await putPhoto(makePhoto('photo-2', { takenAt: '2026-05-01T10:00:00' }))

    const list = await listPhotos()
    expect(list).toHaveLength(2)
    expect(list.map(p => p.id).sort()).toEqual(['photo-1', 'photo-2'])
    for (const meta of list) {
      expect(meta).not.toHaveProperty('blob')
      expect(meta.takenAt).toBeDefined()
    }
  })

  it('deletes idempotently', async () => {
    await putPhoto(makePhoto('photo-1'))
    await deletePhoto('photo-1')
    expect(await getPhoto('photo-1')).toBeNull()
    await expect(deletePhoto('photo-1')).resolves.toBeUndefined()
  })

  describe('object URLs', () => {
    // jsdom has no URL.createObjectURL — stub the boundary.
    const created: string[] = []
    beforeEach(() => {
      created.length = 0
      vi.stubGlobal('URL', {
        ...URL,
        createObjectURL: vi.fn((blob: Blob) => {
          const url = `blob:mock-${created.length}-${blob.size}`
          created.push(url)
          return url
        }),
        revokeObjectURL: vi.fn(),
      })
    })
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('creates a renderable URL for a stored photo and revokes it', async () => {
      await putPhoto(makePhoto('photo-1'))
      const url = await createPhotoUrl('photo-1')
      expect(url).toBe(created[0])

      revokePhotoUrl(url!)
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(url)
    })

    it('returns null for a missing photo instead of minting a URL', async () => {
      expect(await createPhotoUrl('missing')).toBeNull()
      expect(URL.createObjectURL).not.toHaveBeenCalled()
    })
  })
})
