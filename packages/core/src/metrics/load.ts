import type { Activity } from "../entities/activity"
import { intensityFactor, sportFactor } from "./factors"
import { LOAD_VERSION, type IntensityLabel } from "./types"

/**
 * load.v1 — durationMinutes × intensityFactor × sportFactor.
 * Not a medical measurement.
 */
export function computeSessionLoad(
  activity: Activity,
  intensity: IntensityLabel
): { sessionLoad: number; version: string } {
  const durationMinutes = Math.max(activity.durationSeconds, 0) / 60
  const load =
    durationMinutes * intensityFactor(intensity) * sportFactor(activity.sport)
  return {
    sessionLoad: Math.round(load * 100) / 100,
    version: LOAD_VERSION,
  }
}
