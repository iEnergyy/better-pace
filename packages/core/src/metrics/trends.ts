import type { Activity } from "../entities/activity"
import { addDaysYmd, ymdKey, zonedYmd } from "./period"
import type { TrendDirection, TrendSignal } from "./types"

function directionFromDelta(
  delta: number,
  flatTolerance: number
): TrendDirection {
  if (Math.abs(delta) <= flatTolerance) return "flat"
  return delta > 0 ? "up" : "down"
}

/**
 * Placeholder trends — not physiology models.
 */
export function computeTrendPlaceholders(input: {
  weeklyLoadsOldestFirst: number[]
  hardSessionsLast7: number
  hardSessionsPrior7: number
  runningMedianPaceLast28: number | null
  runningMedianPacePrior28: number | null
}): {
  fitnessTrend: TrendSignal
  recoveryTrend: TrendSignal
  performanceTrend: TrendSignal
} {
  const loads = input.weeklyLoadsOldestFirst
  let fitnessTrend: TrendSignal = { direction: "unknown", delta: null }
  if (loads.length >= 8) {
    const recent =
      loads.slice(-4).reduce((a, b) => a + b, 0) / 4
    const prior =
      loads.slice(-8, -4).reduce((a, b) => a + b, 0) / 4
    if (prior > 0) {
      const delta = (recent - prior) / prior
      fitnessTrend = {
        direction: directionFromDelta(delta, 0.05),
        delta: Math.round(delta * 1000) / 1000,
      }
    }
  }

  let recoveryTrend: TrendSignal = { direction: "unknown", delta: null }
  const priorHard = input.hardSessionsPrior7
  const recentHard = input.hardSessionsLast7
  if (priorHard + recentHard > 0) {
    // Lower hard density = better recovery → "up"
    const delta = priorHard - recentHard
    recoveryTrend = {
      direction: directionFromDelta(delta, 0),
      delta,
    }
  }

  let performanceTrend: TrendSignal = { direction: "unknown", delta: null }
  const last = input.runningMedianPaceLast28
  const prior = input.runningMedianPacePrior28
  if (last != null && prior != null && prior > 0) {
    // Faster (lower pace seconds) = performance up
    const delta = (prior - last) / prior
    performanceTrend = {
      direction: directionFromDelta(delta, 0.02),
      delta: Math.round(delta * 1000) / 1000,
    }
  }

  return { fitnessTrend, recoveryTrend, performanceTrend }
}

export function computeConsistencyScore(
  sessionCountsPerCompleteWeekOldestFirst: number[]
): number {
  const last4 = sessionCountsPerCompleteWeekOldestFirst.slice(-4)
  if (last4.length === 0) return 0
  while (last4.length < 4) last4.unshift(0)
  const good = last4.filter((n) => n >= 3).length
  return Math.round((100 * good) / 4)
}

export function computeCurrentStreakDays(
  activityDates: Date[],
  timeZone: string,
  asOf: Date = new Date()
): number {
  if (activityDates.length === 0) return 0
  const days = new Set(
    activityDates.map((d) => ymdKey(zonedYmd(d, timeZone)))
  )
  let cursor = zonedYmd(asOf, timeZone)
  // If today has no activity, start from yesterday
  if (!days.has(ymdKey(cursor))) {
    cursor = addDaysYmd(cursor, -1)
  }
  let streak = 0
  while (days.has(ymdKey(cursor))) {
    streak += 1
    cursor = addDaysYmd(cursor, -1)
  }
  return streak
}

export function countHardInWindow(
  activities: Activity[],
  intensityById: Map<string, string>,
  from: Date,
  to: Date
): number {
  let n = 0
  for (const a of activities) {
    if (a.startedAt < from || a.startedAt >= to) continue
    if (intensityById.get(a.id) === "hard") n += 1
  }
  return n
}
