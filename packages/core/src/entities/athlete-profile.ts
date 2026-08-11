export type PreferredUnits = "metric" | "imperial"

/**
 * Athlete identity owned by a user account (1:1).
 * Created on signup in later auth phase; stubbed here for domain shape.
 */
export interface AthleteProfile {
  id: string
  userId: string
  displayName: string
  timezone: string
  preferredUnits: PreferredUnits
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}
