/**
 * useAllotmentNotes Hook
 *
 * Notes and garden events management.
 * Handles area notes (per-year) and garden-wide events.
 *
 * Writes go through `mutate(fn)` against the SyncedStore proxy (ADR 027;
 * legacy `setData` branch removed in Step 5).
 */

'use client'

import { useCallback } from 'react'
import {
  AllotmentData,
  AreaNote,
  NewAreaNote,
  AreaNoteUpdate,
  AreaSeason,
  GardenEvent,
  NewGardenEvent,
} from '@/types/unified-allotment'
import {
  getAreaNotes as storageGetAreaNotes,
  getGardenEvents,
} from '@/services/allotment-storage'
import { generateId } from '@/lib/utils'
import type { MutateFn } from './useAllotmentData'
import { assignDefined, withoutUndefined } from '@/lib/yjs/allotment-yjs'

// ============ HOOK TYPES ============

export interface UseAllotmentNotesProps {
  data: AllotmentData | null
  mutate: MutateFn
  selectedYear: number
}

export interface UseAllotmentNotesReturn {
  // Area notes
  getAreaNotes: (areaId: string) => AreaNote[]
  addAreaNote: (areaId: string, note: NewAreaNote) => void
  updateAreaNote: (areaId: string, noteId: string, updates: AreaNoteUpdate) => void
  removeAreaNote: (areaId: string, noteId: string) => void

  // Garden events
  getGardenEvents: () => GardenEvent[]
  addGardenEvent: (event: NewGardenEvent) => void
  removeGardenEvent: (eventId: string) => void
}

// ============ HOOK IMPLEMENTATION ============

export function useAllotmentNotes({
  data,
  mutate,
  selectedYear,
}: UseAllotmentNotesProps): UseAllotmentNotesReturn {

  // ============ AREA NOTES ============

  const getAreaNotesData = useCallback((areaId: string): AreaNote[] => {
    if (!data) return []
    return storageGetAreaNotes(data, selectedYear, areaId)
  }, [data, selectedYear])

  const addAreaNoteData = useCallback((areaId: string, note: NewAreaNote) => {
    if (!data) return

    mutate(store => {
      const season = store.seasons.find(s => s.year === selectedYear)
      if (!season) return
      const now = new Date().toISOString()

      // Ensure the AreaSeason exists.
      let areaSeason = season.areas.find(a => a.areaId === areaId)
      if (!areaSeason) {
        const fresh: AreaSeason = withoutUndefined({
          areaId,
          plantings: [],
        })
        season.areas.push(fresh)
        areaSeason = season.areas[season.areas.length - 1]
      }

      const newNote: AreaNote = withoutUndefined({
        ...note,
        id: generateId('note'),
        createdAt: now,
        updatedAt: now,
      })
      if (!areaSeason.notes) areaSeason.notes = []
      areaSeason.notes.push(newNote)
      season.updatedAt = now
    })
  }, [data, selectedYear, mutate])

  const updateAreaNoteData = useCallback((areaId: string, noteId: string, updates: AreaNoteUpdate) => {
    if (!data) return

    mutate(store => {
      const season = store.seasons.find(s => s.year === selectedYear)
      if (!season) return
      const areaSeason = season.areas.find(a => a.areaId === areaId)
      if (!areaSeason?.notes) return
      const n = areaSeason.notes.find(x => x.id === noteId)
      if (!n) return
      const now = new Date().toISOString()
      assignDefined(n, updates)
      n.updatedAt = now
      season.updatedAt = now
    })
  }, [data, selectedYear, mutate])

  const removeAreaNoteData = useCallback((areaId: string, noteId: string) => {
    if (!data) return

    mutate(store => {
      const season = store.seasons.find(s => s.year === selectedYear)
      if (!season) return
      const areaSeason = season.areas.find(a => a.areaId === areaId)
      if (!areaSeason?.notes) return
      const idx = areaSeason.notes.findIndex(n => n.id === noteId)
      if (idx === -1) return
      areaSeason.notes.splice(idx, 1)
      season.updatedAt = new Date().toISOString()
    })
  }, [data, selectedYear, mutate])

  // ============ GARDEN EVENTS ============

  const getGardenEventsData = useCallback((): GardenEvent[] => {
    if (!data) return []
    return getGardenEvents(data)
  }, [data])

  const addGardenEventData = useCallback((event: NewGardenEvent) => {
    if (!data) return

    mutate(store => {
      const now = new Date().toISOString()
      const newEvent: GardenEvent = withoutUndefined({
        ...event,
        id: generateId('event'),
        createdAt: now,
      })
      store.gardenEvents.push(newEvent)
      store.meta.updatedAt = now
    })
  }, [data, mutate])

  const removeGardenEventData = useCallback((eventId: string) => {
    if (!data) return

    mutate(store => {
      const idx = store.gardenEvents.findIndex(e => e.id === eventId)
      if (idx === -1) return
      store.gardenEvents.splice(idx, 1)
      store.meta.updatedAt = new Date().toISOString()
    })
  }, [data, mutate])

  return {
    // Area notes
    getAreaNotes: getAreaNotesData,
    addAreaNote: addAreaNoteData,
    updateAreaNote: updateAreaNoteData,
    removeAreaNote: removeAreaNoteData,

    // Garden events
    getGardenEvents: getGardenEventsData,
    addGardenEvent: addGardenEventData,
    removeGardenEvent: removeGardenEventData,
  }
}
