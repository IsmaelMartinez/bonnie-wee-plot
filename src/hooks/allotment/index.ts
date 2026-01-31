/**
 * Allotment Hooks
 *
 * Modular hooks for allotment state management.
 * Each hook handles a specific domain of allotment operations.
 */

export { useAllotmentData } from './useAllotmentData'
export type { UseAllotmentDataReturn } from './useAllotmentData'

export { useAllotmentAreas } from './useAllotmentAreas'
export type { UseAllotmentAreasProps, UseAllotmentAreasReturn } from './useAllotmentAreas'

export { useAllotmentVarieties } from './useAllotmentVarieties'
export type { UseAllotmentVarietiesProps, UseAllotmentVarietiesReturn } from './useAllotmentVarieties'

export { useAllotmentPlantings } from './useAllotmentPlantings'
export type { UseAllotmentPlantingsProps, UseAllotmentPlantingsReturn } from './useAllotmentPlantings'

export { useAllotmentMaintenance } from './useAllotmentMaintenance'
export type { UseAllotmentMaintenanceProps, UseAllotmentMaintenanceReturn } from './useAllotmentMaintenance'

export { useAllotmentNotes } from './useAllotmentNotes'
export type { UseAllotmentNotesProps, UseAllotmentNotesReturn } from './useAllotmentNotes'

export { useAllotmentCareLogs } from './useAllotmentCareLogs'
export type { UseAllotmentCareLogsProps, UseAllotmentCareLogsReturn } from './useAllotmentCareLogs'
