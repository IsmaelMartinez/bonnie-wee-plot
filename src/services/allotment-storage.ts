/**
 * Allotment Storage Service
 *
 * Barrel file that re-exports all storage modules.
 * Every existing exported function remains importable from '@/services/allotment-storage'.
 */

// Core storage operations (localStorage read/write)
export {
  loadAllotmentData,
  saveAllotmentData,
  getStorageStats,
  clearAllotmentData,
  initializeStorage,
} from './storage-core'

// Schema validation and data repair
export {
  validateAllotmentData,
} from './storage-validation'

// Schema migrations, backup/restore, legacy migration
export {
  MINIMUM_SUPPORTED_VERSION,
  restoreFromBackup,
  getAvailableBackups,
  migrateSchemaForImport,
  needsLegacyMigration,
  migrateFromLegacyData,
} from './storage-migrations'

// Season operations
export {
  getAvailableYears,
  getSeasonByYear,
  getCurrentSeason,
  addSeason,
  removeSeason,
  updateSeason,
  setCurrentYear,
} from './season-operations'

// Planting operations, area season helpers, notes, garden events
export {
  getAreaSeason,
  getBedSeason,
  updateAreaRotationGroup,
  updateBedRotationGroup,
  updateAreaSeasonPosition,
  generatePlantingId,
  addPlanting,
  addPlantings,
  updatePlanting,
  removePlanting,
  getPlantingsForArea,
  getPlantingsForBed,
  generateAreaNoteId,
  generateBedNoteId,
  getAreaNotes,
  getBedNotes,
  addAreaNote,
  addBedNote,
  updateAreaNote,
  updateBedNote,
  removeAreaNote,
  removeBedNote,
  getGardenEvents,
  getGardenEventsInRange,
  addGardenEvent,
  removeGardenEvent,
} from './planting-operations'

// Area queries and legacy compatibility wrappers
export {
  getAreaById,
  getAllAreas,
  getAreasByKind,
  getRotationBeds,
  getAllBeds,
  getPermanentAreas,
  getInfrastructureAreas,
  isRotationBed,
  canHavePlantings,
  getBedsFromAreas,
  getPermanentPlantingsFromAreas,
  getInfrastructureFromAreas,
  getBedAreaById,
  getPermanentAreaById,
  getInfrastructureAreaById,
  resolveItemRef,
  getPermanentPlantingById,
  getInfrastructureById,
  getBedById,
  getBedsByStatus,
  getRotationBedsLegacy,
  getRotationHistory,
  getRecentRotation,
} from './area-queries'
export type { ResolvedItem } from './area-queries'

// Variety operations
export {
  generateVarietyId,
  getVarieties,
  getVarietyById,
  getVarietiesByPlant,
  addVariety,
  updateVariety,
  removeVariety,
  archiveVariety,
  unarchiveVariety,
  getActiveVarieties,
  toggleHaveSeedsForYear,
  removeVarietyFromYear,
  addVarietyToYear,
  hasSeedsForYear,
  getVarietiesForYear,
  getSuppliers,
  getTotalSpendForYear,
  getAvailableVarietyYears,
  getSeedsStatsForYear,
} from './variety-operations'

// Area mutations (CRUD, care logs, harvest, temporal)
export {
  addArea,
  updateArea,
  archiveArea,
  restoreArea,
  removeArea,
  addCareLogEntry,
  updateCareLogEntry,
  removeCareLogEntry,
  getCareLogsForArea,
  getAllCareLogsForArea,
  logHarvest,
  getHarvestTotal,
  updateAreaHarvestTotal,
  wasAreaActiveInYear,
  getAreasForYear,
  getAreaActiveRange,
  validatePlantingForYear,
} from './area-mutations'

// Task operations (custom tasks and maintenance tasks)
export {
  getCustomTasks,
  addCustomTask,
  toggleCustomTask,
  updateCustomTask,
  removeCustomTask,
  generateMaintenanceTaskId,
  getMaintenanceTasks,
  getTasksForArea,
  getTasksForMonth,
  addMaintenanceTask,
  updateMaintenanceTask,
  completeMaintenanceTask,
  removeMaintenanceTask,
} from './task-operations'

// Generic localStorage utilities
export {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from './generic-storage'
