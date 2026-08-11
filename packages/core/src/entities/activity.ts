import type { Sport } from "../value-objects/sport"

export type ActivityId = string & { readonly __brand: "ActivityId" }
export type AthleteId = string & { readonly __brand: "AthleteId" }

export type ActivitySource = "strava"

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
