import type { AthleteId } from "./ids"

export const PREFERRED_UNITS = ["metric", "imperial"] as const

export type PreferredUnits = (typeof PREFERRED_UNITS)[number]

/**
 * Athlete identity owned by a user account (1:1).
 * Created on signup in later auth phase; stubbed here for domain shape.
 */
export interface AthleteProfile {
  id: AthleteId
  userId: string
  displayName: string
  timezone: string
  preferredUnits: PreferredUnits
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}
