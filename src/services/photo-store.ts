/**
 * Photo blob store — plain IndexedDB, separate from the Yjs document.
 *
 * Photos are binary and local-only. They deliberately do NOT live in
 * AllotmentData / the Yjs doc: blobs would bloat the CRDT state that cloud
 * sync pushes to Supabase, and photo EXIF (GPS!) must never ride along with
 * the JSON export / share / GDPR payloads, all of which serialise
 * AllotmentData. Only the small `CareLogEntry.photoId` string reference
 * lives in the CRDT; the bytes stay on this device, in this database.
 *
 * This is a minimal promise wrapper over raw IndexedDB — no Dexie, no second
 * storage framework (y-indexeddb owns the *structured* data; this DB holds
 * binary blobs only).
 */

export interface StoredPhoto {
  /** Matches `CareLogEntry.photoId` on the confirmed observation. */
  id: string
  blob: Blob
  /** Naive local ISO timestamp from EXIF, if the photo had one. */
  takenAt?: string
  latitude?: number
  longitude?: number
  /** Area the confirmed observation was filed under. */
  bedId?: string
  plantingId?: string
  /** JSON string of the parsed EXIF subset (local-only, never exported). */
  exifJson?: string
}

/** Metadata-only view (no blob) for listings. */
export type StoredPhotoMeta = Omit<StoredPhoto, 'blob'>

const DB_NAME = 'bwp-photos'
const DB_VERSION = 1
const STORE_NAME = 'photos'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Failed to open photo store'))
    request.onblocked = () => reject(new Error('Photo store open blocked by another connection'))
  })
}

/** Run one operation in its own transaction, closing the db afterwards. */
async function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode)
      const request = operation(tx.objectStore(STORE_NAME))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('Photo store operation failed'))
      tx.onabort = () => reject(tx.error ?? new Error('Photo store transaction aborted'))
    })
  } finally {
    db.close()
  }
}

/** Store (or overwrite) a photo record. */
export async function putPhoto(photo: StoredPhoto): Promise<void> {
  await withStore('readwrite', store => store.put(photo))
}

/** Fetch one photo record (with blob), or null if absent. */
export async function getPhoto(id: string): Promise<StoredPhoto | null> {
  const result = await withStore<StoredPhoto | undefined>('readonly', store => store.get(id))
  return result ?? null
}

/** Delete a photo record. Idempotent. */
export async function deletePhoto(id: string): Promise<void> {
  await withStore('readwrite', store => store.delete(id))
}

/** List all stored photos' metadata (blobs omitted to keep it cheap). */
export async function listPhotos(): Promise<StoredPhotoMeta[]> {
  const all = await withStore<StoredPhoto[]>('readonly', store => store.getAll())
  return all.map(photo => {
    const meta: StoredPhotoMeta & { blob?: Blob } = { ...photo }
    delete meta.blob
    return meta
  })
}

/**
 * Object URL for rendering a stored photo, or null if it doesn't exist.
 * Callers own the URL and must release it with `revokePhotoUrl` (e.g. in a
 * useEffect cleanup) or the blob stays pinned in memory.
 */
export async function createPhotoUrl(id: string): Promise<string | null> {
  const photo = await getPhoto(id)
  if (!photo) return null
  return URL.createObjectURL(photo.blob)
}

/** Release an object URL produced by `createPhotoUrl`. */
export function revokePhotoUrl(url: string): void {
  URL.revokeObjectURL(url)
}
