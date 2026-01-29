import * as Y from 'yjs'
import type { AllotmentData, SeasonRecord, Area, StoredVariety } from '@/types/unified-allotment'

function objectToYMap(obj: Record<string, unknown>, ymap: Y.Map<unknown>): void {
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue
    if (Array.isArray(value)) {
      const yarray = new Y.Array()
      value.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          const itemMap = new Y.Map()
          objectToYMap(item as Record<string, unknown>, itemMap)
          yarray.push([itemMap])
        } else {
          yarray.push([item])
        }
      })
      ymap.set(key, yarray)
    } else if (typeof value === 'object') {
      const nestedMap = new Y.Map()
      objectToYMap(value as Record<string, unknown>, nestedMap)
      ymap.set(key, nestedMap)
    } else {
      ymap.set(key, value)
    }
  }
}

function yMapToObject(ymap: Y.Map<unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  ymap.forEach((value, key) => {
    if (value instanceof Y.Map) {
      result[key] = yMapToObject(value)
    } else if (value instanceof Y.Array) {
      result[key] = yArrayToArray(value)
    } else {
      result[key] = value
    }
  })
  return result
}

function yArrayToArray(yarray: Y.Array<unknown>): unknown[] {
  return yarray.toArray().map(item => {
    if (item instanceof Y.Map) return yMapToObject(item)
    if (item instanceof Y.Array) return yArrayToArray(item)
    return item
  })
}

export function allotmentToYDoc(data: AllotmentData, ydoc: Y.Doc): void {
  const root = ydoc.getMap('allotment')

  ydoc.transact(() => {
    root.set('version', data.version)
    root.set('currentYear', data.currentYear)

    const meta = new Y.Map()
    objectToYMap(data.meta as Record<string, unknown>, meta)
    root.set('meta', meta)

    const layout = new Y.Map()
    const areas = new Y.Array()
    data.layout.areas.forEach(area => {
      const areaMap = new Y.Map()
      objectToYMap(area as unknown as Record<string, unknown>, areaMap)
      areas.push([areaMap])
    })
    layout.set('areas', areas)
    root.set('layout', layout)

    const seasons = new Y.Array()
    data.seasons.forEach(season => {
      const seasonMap = new Y.Map()
      objectToYMap(season as unknown as Record<string, unknown>, seasonMap)
      seasons.push([seasonMap])
    })
    root.set('seasons', seasons)

    const varieties = new Y.Array()
    data.varieties.forEach(variety => {
      const varietyMap = new Y.Map()
      objectToYMap(variety as unknown as Record<string, unknown>, varietyMap)
      varieties.push([varietyMap])
    })
    root.set('varieties', varieties)

    if (data.maintenanceTasks) {
      const tasks = new Y.Array()
      data.maintenanceTasks.forEach(task => {
        const taskMap = new Y.Map()
        objectToYMap(task as unknown as Record<string, unknown>, taskMap)
        tasks.push([taskMap])
      })
      root.set('maintenanceTasks', tasks)
    }

    if (data.gardenEvents) {
      const events = new Y.Array()
      data.gardenEvents.forEach(event => {
        const eventMap = new Y.Map()
        objectToYMap(event as unknown as Record<string, unknown>, eventMap)
        events.push([eventMap])
      })
      root.set('gardenEvents', events)
    }
  })
}

export function yDocToAllotment(ydoc: Y.Doc): AllotmentData {
  const root = ydoc.getMap('allotment')

  const meta = root.get('meta') as Y.Map<unknown>
  const layout = root.get('layout') as Y.Map<unknown>
  const seasons = root.get('seasons') as Y.Array<Y.Map<unknown>>
  const varieties = root.get('varieties') as Y.Array<Y.Map<unknown>>
  const maintenanceTasks = root.get('maintenanceTasks') as Y.Array<Y.Map<unknown>> | undefined
  const gardenEvents = root.get('gardenEvents') as Y.Array<Y.Map<unknown>> | undefined

  const result: AllotmentData = {
    version: root.get('version') as number,
    currentYear: root.get('currentYear') as number,
    meta: yMapToObject(meta) as AllotmentData['meta'],
    layout: {
      areas: yArrayToArray(layout.get('areas') as Y.Array<unknown>) as Area[]
    },
    seasons: yArrayToArray(seasons) as SeasonRecord[],
    varieties: yArrayToArray(varieties) as StoredVariety[]
  }

  if (maintenanceTasks) {
    result.maintenanceTasks = yArrayToArray(maintenanceTasks) as AllotmentData['maintenanceTasks']
  }

  if (gardenEvents) {
    result.gardenEvents = yArrayToArray(gardenEvents) as AllotmentData['gardenEvents']
  }

  return result
}
