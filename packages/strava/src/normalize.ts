import type { Activity, AthleteId, Sport } from "@pacepilot/core"
import type { StravaActivitySummary } from "./activities"
import { mapStravaSportType } from "./sport-map"

/** Normalization pipeline version — bump when mapping rules change. */
export const ACTIVITY_METRICS_VERSION = "activity.v1"

export type NormalizedActivityInput = Omit<
  Activity,
  "id" | "createdAt" | "updatedAt"
>

function paceFromDistanceAndDuration(
  distanceMeters: number | null,
  durationSeconds: number,
  sport: Sport
): number | null {
  if (
    distanceMeters == null ||
    distanceMeters <= 0 ||
    durationSeconds <= 0 ||
    (sport !== "running" &&
      sport !== "walking" &&
      sport !== "hiking" &&
      sport !== "swimming")
  ) {
    return null
  }
  const km = distanceMeters / 1000
  return durationSeconds / km
}

/**
 * Map a Strava activity summary/detail into a PacePilot Activity write shape.
 * `externalId` is the domain field for PRD `sourceActivityId`.
 */
export function normalizeStravaActivity(
  summary: StravaActivitySummary,
  athleteId: AthleteId
): NormalizedActivityInput {
  const sport = mapStravaSportType(
    summary.sport_type ?? summary.type,
    summary.name
  )
  const distanceMeters =
    summary.distance != null && Number.isFinite(summary.distance)
      ? summary.distance
      : null
  const durationSeconds = summary.moving_time ?? summary.elapsed_time
  const elevationGainMeters =
    summary.total_elevation_gain != null &&
    Number.isFinite(summary.total_elevation_gain)
      ? summary.total_elevation_gain
      : null

  return {
    athleteId,
    source: "strava",
    externalId: String(summary.id),
    sport,
    name: summary.name || "Untitled activity",
    startedAt: new Date(summary.start_date),
    durationSeconds,
    distanceMeters,
    elevationGainMeters,
    averageHeartRate:
      summary.average_heartrate != null
        ? Math.round(summary.average_heartrate)
        : null,
    maxHeartRate:
      summary.max_heartrate != null ? Math.round(summary.max_heartrate) : null,
    averagePaceSecondsPerKm: paceFromDistanceAndDuration(
      distanceMeters,
      durationSeconds,
      sport
    ),
    calories:
      summary.calories != null && Number.isFinite(summary.calories)
        ? summary.calories
        : null,
    averageSpeedMetersPerSecond:
      summary.average_speed != null && Number.isFinite(summary.average_speed)
        ? summary.average_speed
        : null,
    maxSpeedMetersPerSecond:
      summary.max_speed != null && Number.isFinite(summary.max_speed)
        ? summary.max_speed
        : null,
    rawData: summary,
    metricsVersion: ACTIVITY_METRICS_VERSION,
  }
}
