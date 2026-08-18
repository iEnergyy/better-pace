import type { Sport } from "../value-objects/sport"
import type { ActivityId, AthleteId } from "./ids"

export const ACTIVITY_SOURCES = ["strava"] as const

export type ActivitySource = (typeof ACTIVITY_SOURCES)[number]

/**
 * Domain Activity — framework-agnostic.
 * Persistence mapping lives in `@pacepilot/db`.
 *
 * `externalId` is the source-native activity id (PRD/ROADMAP `sourceActivityId`).
 */
export interface Activity {
  id: ActivityId
  athleteId: AthleteId
  source: ActivitySource
  /** Source-native id — alias for PRD `sourceActivityId`. */
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
  calories: number | null
  averageSpeedMetersPerSecond: number | null
  maxSpeedMetersPerSecond: number | null
  /** Original provider payload for reprocessing without re-fetch. */
  rawData: unknown | null
  /** Normalization / metrics pipeline version (e.g. `activity.v1`). */
  metricsVersion: string
  createdAt: Date
  updatedAt: Date
}

/** Thin sport-specific views derived from Activity (+ rawData when needed). */
export interface RunningMetrics {
  averagePaceSecondsPerKm: number | null
  fastestPaceSecondsPerKm: number | null
  cadence: number | null
  gradeAdjustedPaceSecondsPerKm: number | null
}

export interface PadelMetrics {
  durationSeconds: number
  averageHeartRate: number | null
  maxHeartRate: number | null
  calories: number | null
}

export interface SwimmingMetrics {
  distanceMeters: number | null
  durationSeconds: number
  paceSecondsPerKm: number | null
}

export function toRunningMetrics(activity: Activity): RunningMetrics {
  const raw =
    activity.rawData && typeof activity.rawData === "object"
      ? (activity.rawData as Record<string, unknown>)
      : null
  const cadence =
    raw && typeof raw.average_cadence === "number" ? raw.average_cadence : null
  return {
    averagePaceSecondsPerKm: activity.averagePaceSecondsPerKm,
    fastestPaceSecondsPerKm: null,
    cadence,
    gradeAdjustedPaceSecondsPerKm: null,
  }
}

export function toPadelMetrics(activity: Activity): PadelMetrics {
  return {
    durationSeconds: activity.durationSeconds,
    averageHeartRate: activity.averageHeartRate,
    maxHeartRate: activity.maxHeartRate,
    calories: activity.calories,
  }
}

export function toSwimmingMetrics(activity: Activity): SwimmingMetrics {
  return {
    distanceMeters: activity.distanceMeters,
    durationSeconds: activity.durationSeconds,
    paceSecondsPerKm: activity.averagePaceSecondsPerKm,
  }
}
