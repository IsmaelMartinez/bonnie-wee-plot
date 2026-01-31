/**
 * useAllotmentNotes Hook
 *
 * Notes and garden events management.
 * Handles area notes (per-year) and garden-wide events.
 */

'use client'

import { useCallback } from 'react'
import {
  AllotmentData,
  AreaNote,
  NewAreaNote,
  AreaNoteUpdate,
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

// ============ HOOK TYPES ============

export interface UseAllotmentNotesProps {
  data: AllotmentData | null
  setData: (data: AllotmentData | ((prev: AllotmentData | null) => AllotmentData | null)) => void
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
  selectedYear,
}: UseAllotmentNotesProps): UseAllotmentNotesReturn {

  // ============ AREA NOTES ============

  const getAreaNotesData = useCallback((areaId: string): AreaNote[] => {
    if (!data) return []
    return storageGetAreaNotes(data, selectedYear, areaId)
  }, [data, selectedYear])

  const addAreaNoteData = useCallback((areaId: string, note: NewAreaNote) => {
    if (!data) return
    setData(storageAddAreaNote(data, selectedYear, areaId, note))
  }, [data, selectedYear, setData])

  const updateAreaNoteData = useCallback((areaId: string, noteId: string, updates: AreaNoteUpdate) => {
    if (!data) return
    setData(storageUpdateAreaNote(data, selectedYear, areaId, noteId, updates))
  }, [data, selectedYear, setData])

  const removeAreaNoteData = useCallback((areaId: string, noteId: string) => {
    if (!data) return
    setData(storageRemoveAreaNote(data, selectedYear, areaId, noteId))
  }, [data, selectedYear, setData])

  // ============ GARDEN EVENTS ============

  const getGardenEventsData = useCallback((): GardenEvent[] => {
    if (!data) return []
    return getGardenEvents(data)
  }, [data])

  const addGardenEventData = useCallback((event: NewGardenEvent) => {
    if (!data) return
    setData(storageAddGardenEvent(data, event))
  }, [data, setData])

  const removeGardenEventData = useCallback((eventId: string) => {
    if (!data) return
    setData(storageRemoveGardenEvent(data, eventId))
  }, [data, setData])

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
