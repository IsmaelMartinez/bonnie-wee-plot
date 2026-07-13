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
 *
 * Durability: IndexedDB writes are only guaranteed once the *transaction*
 * completes — a request's `onsuccess` can fire and the transaction still
 * abort afterwards (e.g. quota exceeded at commit). Every promise here
 * therefore resolves on `tx.oncomplete`, never on request success alone.
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

/**
 * Run `work` against the object store in its own transaction, resolving with
 * `getResult()` only once the transaction has committed (see the durability
 * note above), and closing the db afterwards. Rejects on transaction error
 * or abort; `work` may also wire per-request rejection via the `reject` it
 * receives.
 */
async function inTransaction<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore, reject: (reason: unknown) => void) => () => T
): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode)
      tx.onerror = () => reject(tx.error ?? new Error('Photo store transaction failed'))
      tx.onabort = () => reject(tx.error ?? new Error('Photo store transaction aborted'))
      let getResult: () => T
      try {
        getResult = work(tx.objectStore(STORE_NAME), reject)
      } catch (err) {
        // A synchronous throw (e.g. a record that can't provide the keyPath)
        // must abort the transaction, or requests issued before the throw
        // would still auto-commit — breaking all-or-nothing semantics.
        try {
          tx.abort()
        } catch {
          // Already aborting/finished — nothing more to do.
        }
        reject(err)
        return
      }
      tx.oncomplete = () => resolve(getResult())
    })
  } finally {
    db.close()
  }
}

/** Run one IDB request in its own transaction; resolve its result on commit. */
function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return inTransaction<T>(mode, (store, reject) => {
    const request = operation(store)
    request.onerror = () =>
      reject(request.error ?? new Error('Photo store operation failed'))
    return () => request.result
  })
}

/**
 * Store (or overwrite) a batch of photo records in a single transaction.
 * All-or-nothing: if any record fails, the transaction aborts and none of
 * the batch is persisted. Resolves only after the transaction commits.
 */
export async function putPhotos(photos: StoredPhoto[]): Promise<void> {
  if (photos.length === 0) return
  await inTransaction<void>('readwrite', (store, reject) => {
    for (const photo of photos) {
      const request = store.put(photo)
      request.onerror = () => reject(request.error ?? new Error('Photo store put failed'))
    }
    return () => undefined
  })
}

/** Store (or overwrite) a single photo record. */
export async function putPhoto(photo: StoredPhoto): Promise<void> {
  await putPhotos([photo])
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

/**
 * List all stored photos' metadata. Iterates with a cursor, stripping the
 * `blob` from each record as it streams past, so at most one record's blob
 * is materialised at a time (rather than `getAll()` holding every blob in
 * memory simultaneously).
 */
export async function listPhotos(): Promise<StoredPhotoMeta[]> {
  return inTransaction<StoredPhotoMeta[]>('readonly', (store, reject) => {
    const metas: StoredPhotoMeta[] = []
    const request = store.openCursor()
    request.onsuccess = () => {
      const cursor = request.result
      if (!cursor) return
      const meta: StoredPhotoMeta & { blob?: Blob } = { ...(cursor.value as StoredPhoto) }
      delete meta.blob
      metas.push(meta)
      cursor.continue()
    }
    request.onerror = () => reject(request.error ?? new Error('Photo store cursor failed'))
    return () => metas
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
