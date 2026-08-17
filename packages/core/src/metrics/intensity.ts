import type { Activity } from "../entities/activity"
import type { Sport } from "../value-objects/sport"
import {
  HR_MAX_FALLBACK,
  INTENSITY_VERSION,
  type IntensityLabel,
} from "./types"

const PACE_SPORTS: ReadonlySet<Sport> = new Set([
  "running",
  "cycling",
  "swimming",
])

export type IntensityContext = {
  /** Rolling 90-day max of activity maxHeartRate (with HR). */
  rolling90DayMaxHr: number | null
  /** Median averagePaceSecondsPerKm for this sport over last 28 days (excl. current). */
  medianPaceSecondsPerKm28d: number | null
}

function classifyByHr(
  averageHeartRate: number,
  hrMax: number
): IntensityLabel {
  const ratio = averageHeartRate / hrMax
  if (ratio < 0.7) return "easy"
  if (ratio < 0.85) return "moderate"
  return "hard"
}

function classifyByPace(
  paceSecondsPerKm: number,
  medianPaceSecondsPerKm: number
): IntensityLabel {
  // Lower pace seconds = faster. Hard if ≥12% faster than median; easy if ≥12% slower.
  const ratio = paceSecondsPerKm / medianPaceSecondsPerKm
  if (ratio <= 0.88) return "hard"
  if (ratio >= 1.12) return "easy"
  return "moderate"
}

function classifyByRawEffort(rawData: unknown): IntensityLabel | null {
  if (!(rawData && typeof rawData === "object")) return null
  const raw = rawData as Record<string, unknown>

  const suffer = raw.suffer_score
  if (typeof suffer === "number") {
    if (suffer < 40) return "easy"
    if (suffer < 80) return "moderate"
    return "hard"
  }

  const pe = raw.perceived_exertion ?? raw.workout_rpe
  if (typeof pe === "number") {
    if (pe <= 3) return "easy"
    if (pe <= 6) return "moderate"
    return "hard"
  }

  return null
}

export function resolveHrMax(
  activity: Activity,
  rolling90DayMaxHr: number | null
): number {
  if (rolling90DayMaxHr != null && rolling90DayMaxHr > 0) {
    return rolling90DayMaxHr
  }
  if (activity.maxHeartRate != null && activity.maxHeartRate > 0) {
    return activity.maxHeartRate
  }
  return HR_MAX_FALLBACK
}

/**
 * intensity.v1 — HR → pace → Strava effort → unknown.
 */
export function classifyIntensity(
  activity: Activity,
  context: IntensityContext
): { intensity: IntensityLabel; hrMaxUsed: number | null; version: string } {
  if (activity.averageHeartRate != null && activity.averageHeartRate > 0) {
    const hrMax = resolveHrMax(activity, context.rolling90DayMaxHr)
    return {
      intensity: classifyByHr(activity.averageHeartRate, hrMax),
      hrMaxUsed: hrMax,
      version: INTENSITY_VERSION,
    }
  }

  if (
    PACE_SPORTS.has(activity.sport) &&
    activity.averagePaceSecondsPerKm != null &&
    activity.averagePaceSecondsPerKm > 0 &&
    context.medianPaceSecondsPerKm28d != null &&
    context.medianPaceSecondsPerKm28d > 0
  ) {
    return {
      intensity: classifyByPace(
        activity.averagePaceSecondsPerKm,
        context.medianPaceSecondsPerKm28d
      ),
      hrMaxUsed: null,
      version: INTENSITY_VERSION,
    }
  }

  const fromRaw = classifyByRawEffort(activity.rawData)
  if (fromRaw) {
    return {
      intensity: fromRaw,
      hrMaxUsed: null,
      version: INTENSITY_VERSION,
    }
  }

  return {
    intensity: "unknown",
    hrMaxUsed: null,
    version: INTENSITY_VERSION,
  }
}

/** Max of maxHeartRate over activities in [from, to] with HR present. */
export function rollingMaxHeartRate(
  activities: Activity[],
  asOf: Date,
  windowDays = 90
): number | null {
  const fromMs = asOf.getTime() - windowDays * 86_400_000
  let max: number | null = null
  for (const a of activities) {
    if (a.startedAt.getTime() < fromMs || a.startedAt.getTime() > asOf.getTime()) {
      continue
    }
    if (a.maxHeartRate == null || a.maxHeartRate <= 0) continue
    if (max == null || a.maxHeartRate > max) max = a.maxHeartRate
  }
  return max
}

export function medianPaceForSport(
  activities: Activity[],
  sport: Sport,
  asOf: Date,
  excludeActivityId: string | null,
  windowDays = 28
): number | null {
  const fromMs = asOf.getTime() - windowDays * 86_400_000
  const paces: number[] = []
  for (const a of activities) {
    if (excludeActivityId && a.id === excludeActivityId) continue
    if (a.sport !== sport) continue
    if (a.startedAt.getTime() < fromMs || a.startedAt.getTime() > asOf.getTime()) {
      continue
    }
    if (a.averagePaceSecondsPerKm == null || a.averagePaceSecondsPerKm <= 0) {
      continue
    }
    paces.push(a.averagePaceSecondsPerKm)
  }
  if (paces.length === 0) return null
  paces.sort((x, y) => x - y)
  const mid = Math.floor(paces.length / 2)
  return paces.length % 2 === 0
    ? (paces[mid - 1]! + paces[mid]!) / 2
    : paces[mid]!
}
