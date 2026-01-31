/**
 * useAllotmentCareLogs Hook
 *
 * Care logs and harvest tracking for permanent areas.
 * Handles care log CRUD and harvest totals.
 */

'use client'

import { useCallback } from 'react'
import {
  AllotmentData,
  CareLogEntry,
  NewCareLogEntry,
} from '@/types/unified-allotment'
import {
  addCareLogEntry as storageAddCareLogEntry,
  updateCareLogEntry as storageUpdateCareLogEntry,
  removeCareLogEntry as storageRemoveCareLogEntry,
  getCareLogsForArea,
  getAllCareLogsForArea,
  logHarvest as storageLogHarvest,
  getHarvestTotal,
} from '@/services/allotment-storage'

// ============ HOOK TYPES ============

export interface UseAllotmentCareLogsProps {
  data: AllotmentData | null
  setData: (data: AllotmentData | ((prev: AllotmentData | null) => AllotmentData | null)) => void
  selectedYear: number
}

export interface UseAllotmentCareLogsReturn {
  addCareLog: (areaId: string, entry: NewCareLogEntry) => string
  updateCareLog: (areaId: string, entryId: string, updates: Partial<Omit<CareLogEntry, 'id'>>) => void
  removeCareLog: (areaId: string, entryId: string) => void
  getCareLogs: (areaId: string) => CareLogEntry[]
  getAllCareLogs: (areaId: string) => Array<{ year: number; entry: CareLogEntry }>
  logHarvest: (areaId: string, quantity: number, unit: string, date?: string) => string
  getHarvestTotal: (areaId: string) => { quantity: number; unit: string } | null
}

// ============ HOOK IMPLEMENTATION ============

export function useAllotmentCareLogs({
  data,
  setData,
  selectedYear,
}: UseAllotmentCareLogsProps): UseAllotmentCareLogsReturn {

  const addCareLogData = useCallback((areaId: string, entry: NewCareLogEntry): string => {
    if (!data) return ''
    const result = storageAddCareLogEntry(data, selectedYear, areaId, entry)
    setData(result.data)
    return result.entryId
  }, [data, selectedYear, setData])

  const updateCareLogData = useCallback((
    areaId: string,
    entryId: string,
    updates: Partial<Omit<CareLogEntry, 'id'>>
  ) => {
    if (!data) return
    setData(storageUpdateCareLogEntry(data, selectedYear, areaId, entryId, updates))
  }, [data, selectedYear, setData])

  const removeCareLogData = useCallback((areaId: string, entryId: string) => {
    if (!data) return
    setData(storageRemoveCareLogEntry(data, selectedYear, areaId, entryId))
  }, [data, selectedYear, setData])

  const getCareLogsData = useCallback((areaId: string): CareLogEntry[] => {
    if (!data) return []
    return getCareLogsForArea(data, selectedYear, areaId)
  }, [data, selectedYear])

  const getAllCareLogsData = useCallback((areaId: string): Array<{ year: number; entry: CareLogEntry }> => {
    if (!data) return []
    return getAllCareLogsForArea(data, areaId)
  }, [data])

  const logHarvestData = useCallback((
    areaId: string,
    quantity: number,
    unit: string,
    date?: string
  ): string => {
    if (!data) return ''
    const result = storageLogHarvest(data, selectedYear, areaId, quantity, unit, date)
    setData(result.data)
    return result.entryId
  }, [data, selectedYear, setData])

  const getHarvestTotalData = useCallback((areaId: string): { quantity: number; unit: string } | null => {
    if (!data) return null
    return getHarvestTotal(data, selectedYear, areaId)
  }, [data, selectedYear])

  return {
    addCareLog: addCareLogData,
    updateCareLog: updateCareLogData,
    removeCareLog: removeCareLogData,
    getCareLogs: getCareLogsData,
    getAllCareLogs: getAllCareLogsData,
    logHarvest: logHarvestData,
    getHarvestTotal: getHarvestTotalData,
  }
}
