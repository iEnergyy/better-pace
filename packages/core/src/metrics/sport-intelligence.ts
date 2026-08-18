import type { Activity } from "../entities/activity"
import type { IntensityLabel } from "./types"

export type LongRunCandidate = {
  activity: Activity
  isLongRun: boolean
}

/**
 * Mark the longest run of the week as long-run when ≥1.5× median distance
 * or duration ≥ 60 minutes.
 */
export function identifyLongRuns(runs: Activity[]): LongRunCandidate[] {
  if (runs.length === 0) return []
  const distances = runs
    .map((r) => r.distanceMeters)
    .filter((d): d is number => d != null && d > 0)
    .sort((a, b) => a - b)
  const median =
    distances.length === 0
      ? null
      : distances.length % 2 === 0
        ? (distances[distances.length / 2 - 1]! +
            distances[distances.length / 2]!) /
          2
        : distances[Math.floor(distances.length / 2)]!

  let longest: Activity | null = null
  for (const r of runs) {
    if (!longest) {
      longest = r
      continue
    }
    const rd = r.distanceMeters ?? 0
    const ld = longest.distanceMeters ?? 0
    if (rd > ld || (rd === ld && r.durationSeconds > longest.durationSeconds)) {
      longest = r
    }
  }

  return runs.map((activity) => {
    const isLongest = longest?.id === activity.id
    const distOk =
      median != null &&
      activity.distanceMeters != null &&
      activity.distanceMeters >= median * 1.5
    const timeOk = activity.durationSeconds >= 3600
    return {
      activity,
      isLongRun: Boolean(isLongest && (distOk || timeOk)),
    }
  })
}

export function countByIntensity(
  intensities: IntensityLabel[]
): Record<IntensityLabel, number> {
  const out: Record<IntensityLabel, number> = {
    easy: 0,
    moderate: 0,
    hard: 0,
    unknown: 0,
  }
  for (const i of intensities) out[i] += 1
  return out
}
