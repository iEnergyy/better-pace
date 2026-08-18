import type { AthleteMetricRollup } from "../metrics/types"
import type { AthleteId } from "./ids"

export const PREFERRED_UNITS = ["metric", "imperial"] as const

export type PreferredUnits = (typeof PREFERRED_UNITS)[number]

/**
 * Athlete identity owned by a user account (1:1).
 * Created on signup via Better Auth databaseHooks.
 * Optional metrics rollup populated by Phase 0.5 recompute.
 */
export interface AthleteProfile {
  id: AthleteId
  userId: string
  displayName: string
  timezone: string
  preferredUnits: PreferredUnits
  metricsRollup: AthleteMetricRollup | null
  metricsVersion: string | null
  metricsComputedAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}
