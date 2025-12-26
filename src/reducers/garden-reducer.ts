/**
 * Garden Reducer
 * Centralized state management for garden beds using useReducer pattern
 */

import { GridPlot, PlotCell } from '@/types/garden-planner'
import { GardenData } from '@/services/garden-data-service'

/**
 * Action types for garden state management
 */
export type GardenAction =
  | { type: 'INIT'; data: GardenData }
  | { type: 'ADD_BED'; bed: GridPlot }
  | { type: 'DELETE_BED'; bedId: string }
  | { type: 'RENAME_BED'; bedId: string; name: string }
  | { type: 'SELECT_BED'; bedId: string }
  | { type: 'ASSIGN_PLANT'; bedId: string; cellId: string; vegetableId: string }
  | { type: 'CLEAR_CELL'; bedId: string; cellId: string }
  | { type: 'RESIZE_BED'; bedId: string; rows: number; cols: number }
  | { type: 'LOAD_PLAN'; data: GardenData }
  | { type: 'CLEAR_BED'; bedId: string }

/**
 * Garden state type
 */
export interface GardenState {
  beds: GridPlot[]
  activeBedId: string | null
  isLoading: boolean
}

/**
 * Initial state
 */
export const initialGardenState: GardenState = {
  beds: [],
  activeBedId: null,
  isLoading: true
}

/**
 * Helper: Update a specific bed in the state
 */
function updateBed(state: GardenState, bedId: string, updater: (bed: GridPlot) => GridPlot): GardenState {
  return {
    ...state,
    beds: state.beds.map(bed => bed.id === bedId ? updater(bed) : bed)
  }
}

/**
 * Helper: Update a specific cell in a bed
 */
function updateCell(bed: GridPlot, cellId: string, updater: (cell: PlotCell) => PlotCell): GridPlot {
  return {
    ...bed,
    cells: bed.cells.map(cell => cell.id === cellId ? updater(cell) : cell)
  }
}

/**
 * Helper: Resize bed grid
 */
function resizeBedGrid(bed: GridPlot, newRows: number, newCols: number): GridPlot {
  const newCells: PlotCell[] = []
  
  for (let row = 0; row < newRows; row++) {
    for (let col = 0; col < newCols; col++) {
      const existing = bed.cells.find(c => c.row === row && c.col === col)
      if (existing) {
        newCells.push(existing)
      } else {
        newCells.push({
          id: `${bed.id}-${row}-${col}`,
          plotId: bed.id,
          row,
          col
        })
      }
    }
  }
  
  return {
    ...bed,
    gridRows: newRows,
    gridCols: newCols,
    cells: newCells
  }
}

/**
 * Garden reducer function
 */
export function gardenReducer(state: GardenState, action: GardenAction): GardenState {
  switch (action.type) {
    case 'INIT':
      return {
        beds: action.data.beds,
        activeBedId: action.data.activeBedId,
        isLoading: false
      }

    case 'ADD_BED':
      return {
        ...state,
        beds: [...state.beds, action.bed],
        activeBedId: action.bed.id
      }

    case 'DELETE_BED': {
      if (state.beds.length <= 1) {
        return state // Don't delete the last bed
      }
      const newBeds = state.beds.filter(b => b.id !== action.bedId)
      return {
        ...state,
        beds: newBeds,
        activeBedId: state.activeBedId === action.bedId 
          ? newBeds[0].id 
          : state.activeBedId
      }
    }

    case 'RENAME_BED':
      return updateBed(state, action.bedId, bed => ({
        ...bed,
        name: action.name
      }))

    case 'SELECT_BED':
      return {
        ...state,
        activeBedId: action.bedId
      }

    case 'ASSIGN_PLANT':
      return updateBed(state, action.bedId, bed =>
        updateCell(bed, action.cellId, cell => ({
          ...cell,
          vegetableId: action.vegetableId,
          plantedYear: new Date().getFullYear()
        }))
      )

    case 'CLEAR_CELL':
      return updateBed(state, action.bedId, bed =>
        updateCell(bed, action.cellId, cell => ({
          ...cell,
          vegetableId: undefined,
          plantedYear: undefined
        }))
      )

    case 'RESIZE_BED':
      return updateBed(state, action.bedId, bed =>
        resizeBedGrid(bed, action.rows, action.cols)
      )

    case 'LOAD_PLAN':
      return {
        beds: action.data.beds,
        activeBedId: action.data.activeBedId,
        isLoading: false
      }

    case 'CLEAR_BED':
      return updateBed(state, action.bedId, bed => ({
        ...bed,
        cells: bed.cells.map(cell => ({
          ...cell,
          vegetableId: undefined,
          plantedYear: undefined
        }))
      }))

    default:
      return state
  }
}

/**
 * Action creators for type safety and convenience
 */
export const gardenActions = {
  init: (data: GardenData): GardenAction => ({ type: 'INIT', data }),
  addBed: (bed: GridPlot): GardenAction => ({ type: 'ADD_BED', bed }),
  deleteBed: (bedId: string): GardenAction => ({ type: 'DELETE_BED', bedId }),
  renameBed: (bedId: string, name: string): GardenAction => ({ type: 'RENAME_BED', bedId, name }),
  selectBed: (bedId: string): GardenAction => ({ type: 'SELECT_BED', bedId }),
  assignPlant: (bedId: string, cellId: string, vegetableId: string): GardenAction => 
    ({ type: 'ASSIGN_PLANT', bedId, cellId, vegetableId }),
  clearCell: (bedId: string, cellId: string): GardenAction => ({ type: 'CLEAR_CELL', bedId, cellId }),
  resizeBed: (bedId: string, rows: number, cols: number): GardenAction => 
    ({ type: 'RESIZE_BED', bedId, rows, cols }),
  loadPlan: (data: GardenData): GardenAction => ({ type: 'LOAD_PLAN', data }),
  clearBed: (bedId: string): GardenAction => ({ type: 'CLEAR_BED', bedId })
}

/**
 * Selector: Get active bed
 */
export function getActiveBed(state: GardenState): GridPlot | undefined {
  return state.beds.find(b => b.id === state.activeBedId) ?? state.beds[0]
}

/**
 * Selector: Get garden data for persistence
 */
export function toGardenData(state: GardenState): GardenData {
  return {
    beds: state.beds,
    activeBedId: state.activeBedId
  }
}



