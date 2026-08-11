import type { Sport } from "../value-objects/sport"
import type { ActivityId, AthleteId } from "./ids"

export const ACTIVITY_SOURCES = ["strava"] as const

export type ActivitySource = (typeof ACTIVITY_SOURCES)[number]

/**
 * Domain Activity — framework-agnostic.
 * Persistence mapping lives in `@pacepilot/db`.
 */
export interface Activity {
  id: ActivityId
  athleteId: AthleteId
  source: ActivitySource
  externalId: string
  sport: Sport
  name: string
  startedAt: Date
  durationSeconds: number
  distanceMeters: number | null
  elevationGainMeters: number | null
  averageHeartRate: number | null
  maxHeartRate: number | null
  averagePaceSecondsPerKm: number | null
  createdAt: Date
  updatedAt: Date
}
