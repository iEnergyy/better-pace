import type { Activity } from "../entities/activity"
import type { Sport } from "../value-objects/sport"
import { isDistanceSport } from "./factors"
import {
  type IntensityCounts,
  type IntensityLabel,
  type SportVolumeBucket,
  VOLUME_VERSION,
} from "./types"

export type ActivityWithIntensity = {
  activity: Activity
  intensity: IntensityLabel
  sessionLoad: number
}

function emptyIntensityCounts(): IntensityCounts {
  return { easy: 0, moderate: 0, hard: 0, unknown: 0 }
}

export function aggregateVolume(
  items: ActivityWithIntensity[],
  range: { start: Date; end: Date }
): {
  sessionCount: number
  totalDurationSeconds: number
  totalDistanceMeters: number
  totalLoad: number
  bySport: SportVolumeBucket[]
  intensityCounts: IntensityCounts
  volumeVersion: string
} {
  const bySportMap = new Map<Sport, SportVolumeBucket>()
  const intensityCounts = emptyIntensityCounts()
  let totalDurationSeconds = 0
  let totalDistanceMeters = 0
  let totalLoad = 0
  let sessionCount = 0

  for (const { activity, intensity, sessionLoad } of items) {
    if (
      activity.startedAt < range.start ||
      activity.startedAt >= range.end
    ) {
      continue
    }

    sessionCount += 1
    totalDurationSeconds += activity.durationSeconds
    totalLoad += sessionLoad
    intensityCounts[intensity] += 1

    if (
      isDistanceSport(activity.sport) &&
      activity.distanceMeters != null &&
      activity.distanceMeters > 0
    ) {
      totalDistanceMeters += activity.distanceMeters
    }

    const existing = bySportMap.get(activity.sport)
    const distance =
      activity.distanceMeters != null && activity.distanceMeters > 0
        ? activity.distanceMeters
        : 0
    if (existing) {
      existing.sessionCount += 1
      existing.durationSeconds += activity.durationSeconds
      existing.distanceMeters += distance
    } else {
      bySportMap.set(activity.sport, {
        sport: activity.sport,
        sessionCount: 1,
        distanceMeters: distance,
        durationSeconds: activity.durationSeconds,
      })
    }
  }

  return {
    sessionCount,
    totalDurationSeconds,
    totalDistanceMeters,
    totalLoad: Math.round(totalLoad * 100) / 100,
    bySport: [...bySportMap.values()].sort((a, b) =>
      a.sport.localeCompare(b.sport)
    ),
    intensityCounts,
    volumeVersion: VOLUME_VERSION,
  }
}

/**
 * High-intensity cluster: ≥3 hard sessions in any rolling 7 local calendar days
 * within the period items (keys by local YMD string from caller).
 */
export function hasHighIntensityCluster(
  hardSessionDayKeys: string[]
): boolean {
  if (hardSessionDayKeys.length < 3) return false
  const sorted = [...hardSessionDayKeys].sort()
  // For each hard day, count hard sessions in [day, day+6]
  const uniqueDays = [...new Set(sorted)]
  for (const start of uniqueDays) {
    const startMs = Date.parse(`${start}T00:00:00Z`)
    const endMs = startMs + 7 * 86_400_000
    let count = 0
    for (const day of sorted) {
      const ms = Date.parse(`${day}T00:00:00Z`)
      if (ms >= startMs && ms < endMs) count += 1
    }
    if (count >= 3) return true
  }
  return false
}
