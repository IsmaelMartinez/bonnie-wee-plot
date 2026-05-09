/**
 * Per-species minimum soil temperature (°C) for outdoor sowing.
 *
 * Used by the task generator to suppress sow-outdoors tasks when today's
 * soil temperature is below the threshold for a cold-sensitive crop. Plants
 * not listed here have no threshold — the generator falls back to the
 * existing month-based behaviour. Soil temp gating is a refinement, not a
 * hard gate, so missing data (no location, API failure) never suppresses.
 *
 * Numbers from common UK gardening guidance (RHS, Garden Organic):
 * - Peas / carrots: 7°C — peas struggle to germinate in cold wet ground.
 * - Beans (broad/runner/french): 12°C — chilling damage below this.
 * - Sweetcorn: 13°C — frost-tender and demands warm soil to start.
 */
const SOIL_TEMP_THRESHOLDS_C: Readonly<Record<string, number>> = {
  peas: 7,
  'sugar-snap-peas': 7,
  carrot: 7,
  'broad-beans': 12,
  'runner-beans': 12,
  'french-beans': 12,
  'climbing-french-beans': 12,
  'borlotti-beans': 12,
  sweetcorn: 13,
}

/**
 * Look up the minimum outdoor-sowing soil temperature for a vegetable id.
 * Returns undefined when the plant has no threshold (most plants).
 */
export function getMinOutdoorSowSoilTempC(plantId: string): number | undefined {
  return SOIL_TEMP_THRESHOLDS_C[plantId]
}

/**
 * Decide whether an outdoor sowing task for the given plant should be
 * suppressed because the soil is currently too cold. Returns false when
 * the plant has no threshold or when soilTempC is undefined — a missing
 * reading must never suppress, so the user still sees their tasks.
 */
export function shouldSuppressOutdoorSow(
  plantId: string,
  soilTempC: number | undefined
): boolean {
  if (soilTempC === undefined) return false
  const threshold = getMinOutdoorSowSoilTempC(plantId)
  if (threshold === undefined) return false
  return soilTempC < threshold
}
