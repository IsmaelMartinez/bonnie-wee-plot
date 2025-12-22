/**
 * useBeds Hook
 * Centralized state management for garden beds using useReducer
 */

'use client'

import { useEffect, useCallback, useReducer } from 'react'
import { GridPlot } from '@/types/garden-planner'
import { gardenDataService, GardenData } from '@/services/garden-data-service'
import { 
  gardenReducer, 
  initialGardenState, 
  gardenActions,
  getActiveBed,
  toGardenData
} from '@/reducers/garden-reducer'

export interface UseBedState {
  data: GardenData | null
  activeBed: GridPlot | undefined
  isLoading: boolean
}

export interface UseBedActions {
  selectBed: (bedId: string) => void
  addBed: () => void
  deleteBed: (bedId: string) => void
  renameBed: (bedId: string, newName: string) => void
  assignPlant: (cellId: string, vegetableId: string) => void
  clearCell: (cellId: string) => void
  resizeBed: (newRows: number, newCols: number) => void
  clearAllPlants: () => void
  loadData: (newData: GardenData) => void
}

export type UseBedReturn = UseBedState & UseBedActions

/**
 * Hook for managing garden bed state using useReducer
 */
export function useBeds(): UseBedReturn {
  const [state, dispatch] = useReducer(gardenReducer, initialGardenState)

  // Get active bed from state
  const activeBed = getActiveBed(state)

  // Convert state to GardenData for persistence
  const data: GardenData | null = state.isLoading ? null : toGardenData(state)

  // Load data on mount
  useEffect(() => {
    const result = gardenDataService.load()
    if (result.success) {
      dispatch(gardenActions.init(result.data))
    }
  }, [])

  // Save data when it changes (after initial load)
  useEffect(() => {
    if (!state.isLoading && state.beds.length > 0) {
      gardenDataService.save(toGardenData(state))
    }
  }, [state])

  // Flush saves on unmount
  useEffect(() => {
    return () => {
      gardenDataService.flush()
    }
  }, [])

  // Select a bed
  const selectBed = useCallback((bedId: string) => {
    dispatch(gardenActions.selectBed(bedId))
  }, [])

  // Add a new bed
  const addBed = useCallback(() => {
    const newBed = gardenDataService.createBed(`Bed ${state.beds.length + 1}`)
    dispatch(gardenActions.addBed(newBed))
  }, [state.beds.length])

  // Delete a bed
  const deleteBed = useCallback((bedId: string) => {
    dispatch(gardenActions.deleteBed(bedId))
  }, [])

  // Rename a bed
  const renameBed = useCallback((bedId: string, newName: string) => {
    dispatch(gardenActions.renameBed(bedId, newName))
  }, [])

  // Assign a plant to a cell in the active bed
  const assignPlant = useCallback((cellId: string, vegetableId: string) => {
    if (activeBed) {
      dispatch(gardenActions.assignPlant(activeBed.id, cellId, vegetableId))
    }
  }, [activeBed])

  // Clear a cell in the active bed
  const clearCell = useCallback((cellId: string) => {
    if (activeBed) {
      dispatch(gardenActions.clearCell(activeBed.id, cellId))
    }
  }, [activeBed])

  // Resize the active bed
  const resizeBed = useCallback((newRows: number, newCols: number) => {
    if (activeBed) {
      dispatch(gardenActions.resizeBed(activeBed.id, newRows, newCols))
    }
  }, [activeBed])

  // Clear all plants in the active bed
  const clearAllPlants = useCallback(() => {
    if (activeBed) {
      dispatch(gardenActions.clearBed(activeBed.id))
    }
  }, [activeBed])

  // Load data directly (for importing plans)
  const loadData = useCallback((newData: GardenData) => {
    dispatch(gardenActions.loadPlan(newData))
  }, [])

  return {
    data,
    activeBed,
    isLoading: state.isLoading,
    selectBed,
    addBed,
    deleteBed,
    renameBed,
    assignPlant,
    clearCell,
    resizeBed,
    clearAllPlants,
    loadData
  }
}

