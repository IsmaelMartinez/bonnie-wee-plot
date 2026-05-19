/**
 * useAllotmentNotes Hook
 *
 * Notes and garden events management.
 * Handles area notes (per-year) and garden-wide events.
 *
 * Two-branch methods (ADR 027 Step 3, PR-B): see useAllotmentAreas for
 * the convention. The Yjs branch mutates the targeted `AreaSeason` in
 * place and pushes garden events onto `store.gardenEvents`.
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
  addAreaNote as storageAddAreaNote,
  updateAreaNote as storageUpdateAreaNote,
  removeAreaNote as storageRemoveAreaNote,
  getGardenEvents,
  addGardenEvent as storageAddGardenEvent,
  removeGardenEvent as storageRemoveGardenEvent,
} from '@/services/allotment-storage'
import { generateId } from '@/lib/utils'
import { USE_YJS_STORAGE } from '@/config/release-visibility'
import type { MutateFn } from './useAllotmentData'
import { assignDefined, withoutUndefined } from './yjs-helpers'

// ============ HOOK TYPES ============

export interface UseAllotmentNotesProps {
  data: AllotmentData | null
  setData: (data: AllotmentData | ((prev: AllotmentData | null) => AllotmentData | null)) => void
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
  setData,
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

    if (USE_YJS_STORAGE) {
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
      return
    }

    setData(storageAddAreaNote(data, selectedYear, areaId, note))
  }, [data, selectedYear, setData, mutate])

  const updateAreaNoteData = useCallback((areaId: string, noteId: string, updates: AreaNoteUpdate) => {
    if (!data) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const season = store.seasons.find(s => s.year === selectedYear)
        if (!season) return
        const areaSeason = season.areas.find(a => a.areaId === areaId)
        if (!areaSeason?.notes) return
        const n = areaSeason.notes.find(x => x.id === noteId)
        if (!n) return
        const now = new Date().toISOString()
        assignDefined(n as unknown as Record<string, unknown>, updates as Record<string, unknown>)
        n.updatedAt = now
        season.updatedAt = now
      })
      return
    }

    setData(storageUpdateAreaNote(data, selectedYear, areaId, noteId, updates))
  }, [data, selectedYear, setData, mutate])

  const removeAreaNoteData = useCallback((areaId: string, noteId: string) => {
    if (!data) return

    if (USE_YJS_STORAGE) {
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
      return
    }

    setData(storageRemoveAreaNote(data, selectedYear, areaId, noteId))
  }, [data, selectedYear, setData, mutate])

  // ============ GARDEN EVENTS ============

  const getGardenEventsData = useCallback((): GardenEvent[] => {
    if (!data) return []
    return getGardenEvents(data)
  }, [data])

  const addGardenEventData = useCallback((event: NewGardenEvent) => {
    if (!data) return

    if (USE_YJS_STORAGE) {
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
      return
    }

    setData(storageAddGardenEvent(data, event))
  }, [data, setData, mutate])

  const removeGardenEventData = useCallback((eventId: string) => {
    if (!data) return

    if (USE_YJS_STORAGE) {
      mutate(store => {
        const idx = store.gardenEvents.findIndex(e => e.id === eventId)
        if (idx === -1) return
        store.gardenEvents.splice(idx, 1)
        store.meta.updatedAt = new Date().toISOString()
      })
      return
    }

    setData(storageRemoveGardenEvent(data, eventId))
  }, [data, setData, mutate])

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
