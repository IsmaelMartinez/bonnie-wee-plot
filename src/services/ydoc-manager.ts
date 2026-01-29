import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'

const YDOC_NAME = 'bonnieplot-allotment'

/**
 * Create a new Y.Doc instance
 */
export function createYDoc(): Y.Doc {
  return new Y.Doc()
}

/**
 * Initialize Y.Doc with the allotment schema structure
 */
export function initializeYDoc(ydoc: Y.Doc): void {
  const root = ydoc.getMap('allotment')

  if (!root.has('meta')) {
    root.set('meta', new Y.Map())
  }
  if (!root.has('layout')) {
    const layout = new Y.Map()
    layout.set('areas', new Y.Array())
    root.set('layout', layout)
  }
  if (!root.has('seasons')) {
    root.set('seasons', new Y.Array())
  }
  if (!root.has('varieties')) {
    root.set('varieties', new Y.Array())
  }
  if (!root.has('maintenanceTasks')) {
    root.set('maintenanceTasks', new Y.Array())
  }
  if (!root.has('gardenEvents')) {
    root.set('gardenEvents', new Y.Array())
  }
  if (!root.has('currentYear')) {
    root.set('currentYear', new Date().getFullYear())
  }
  if (!root.has('version')) {
    root.set('version', 16)
  }
}

/**
 * Create IndexedDB persistence for Y.Doc
 */
export function createPersistence(ydoc: Y.Doc): IndexeddbPersistence {
  return new IndexeddbPersistence(YDOC_NAME, ydoc)
}

/**
 * Wait for persistence to sync
 */
export function waitForSync(persistence: IndexeddbPersistence): Promise<void> {
  return new Promise((resolve) => {
    persistence.once('synced', () => resolve())
  })
}
