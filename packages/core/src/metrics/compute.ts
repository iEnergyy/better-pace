import type { Activity } from "../entities/activity"
import type { ActivityId, AthleteId } from "../entities/ids"
import type { Sport } from "../value-objects/sport"
import {
  classifyIntensity,
  medianPaceForSport,
  rollingMaxHeartRate,
} from "./intensity"
import { computeSessionLoad } from "./load"
import { detectPersonalRecords } from "./personal-records"
import {
  startOfIsoWeekDate,
  startOfMonthDate,
  ymdKey,
  zonedYmd,
} from "./period"
import {
  computeConsistencyScore,
  computeCurrentStreakDays,
  computeTrendPlaceholders,
  countHardInWindow,
} from "./trends"
import {
  type ActivityMetric,
  type AthleteMetricRollup,
  LOAD_VERSION,
  METRICS_BUNDLE_VERSION,
  type PersonalRecord,
  type TrainingSummary,
} from "./types"
import { aggregateVolume, hasHighIntensityCluster } from "./volume"

export type ComputedMetricsBundle = {
  activityMetrics: ActivityMetric[]
  summaries: TrainingSummary[]
  personalRecords: PersonalRecord[]
  rollup: AthleteMetricRollup
}

function endOfWeek(start: Date): Date {
  return new Date(start.getTime() + 7 * 86_400_000)
}

function endOfMonth(start: Date): Date {
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1))
}

/**
 * Pure full recompute from an activity list (founder-scale).
 */
export function computeMetricsBundle(
  athleteId: AthleteId,
  activities: Activity[],
  options: { timeZone: string; now?: Date }
): ComputedMetricsBundle {
  const now = options.now ?? new Date()
  const timeZone = options.timeZone
  const sorted = [...activities].sort(
    (a, b) => a.startedAt.getTime() - b.startedAt.getTime()
  )

  const activityMetrics: ActivityMetric[] = []
  const intensityById = new Map<string, ActivityMetric["intensity"]>()
  const loadById = new Map<string, number>()

  for (const activity of sorted) {
    const rollingHr = rollingMaxHeartRate(sorted, activity.startedAt, 90)
    const medianPace = medianPaceForSport(
      sorted,
      activity.sport,
      activity.startedAt,
      activity.id,
      28
    )
    const { intensity, hrMaxUsed, version: intensityVersion } =
      classifyIntensity(activity, {
        rolling90DayMaxHr: rollingHr,
        medianPaceSecondsPerKm28d: medianPace,
      })
    const { sessionLoad, version: loadVersion } = computeSessionLoad(
      activity,
      intensity
    )
    intensityById.set(activity.id, intensity)
    loadById.set(activity.id, sessionLoad)
    activityMetrics.push({
      activityId: activity.id as ActivityId,
      athleteId,
      intensity,
      intensityVersion,
      sessionLoad,
      loadVersion,
      hrMaxUsed,
      estimated: false,
      computedAt: now,
    })
  }

  const withLoad = sorted.map((activity) => ({
    activity,
    intensity: intensityById.get(activity.id)!,
    sessionLoad: loadById.get(activity.id)!,
  }))

  // Collect week/month period starts that appear in data + current
  const weekStarts = new Set<number>()
  const monthStarts = new Set<number>()
  const currentWeek = startOfIsoWeekDate(now, timeZone)
  const currentMonth = startOfMonthDate(now, timeZone)
  weekStarts.add(currentWeek.getTime())
  monthStarts.add(currentMonth.getTime())
  for (const a of sorted) {
    weekStarts.add(startOfIsoWeekDate(a.startedAt, timeZone).getTime())
    monthStarts.add(startOfMonthDate(a.startedAt, timeZone).getTime())
  }

  const summaries: TrainingSummary[] = []

  for (const startMs of [...weekStarts].sort((a, b) => a - b)) {
    const periodStart = new Date(startMs)
    const range = { start: periodStart, end: endOfWeek(periodStart) }
    const agg = aggregateVolume(withLoad, range)
    const hardDays = withLoad
      .filter(
        (x) =>
          x.intensity === "hard" &&
          x.activity.startedAt >= range.start &&
          x.activity.startedAt < range.end
      )
      .map((x) => ymdKey(zonedYmd(x.activity.startedAt, timeZone)))
    summaries.push({
      athleteId,
      period: "week",
      periodStart,
      sessionCount: agg.sessionCount,
      totalDurationSeconds: agg.totalDurationSeconds,
      totalDistanceMeters: agg.totalDistanceMeters,
      totalLoad: agg.totalLoad,
      bySport: agg.bySport,
      intensityCounts: agg.intensityCounts,
      highIntensityCluster: hasHighIntensityCluster(hardDays),
      volumeVersion: agg.volumeVersion,
      loadVersion: LOAD_VERSION,
      computedAt: now,
    })
  }

  for (const startMs of [...monthStarts].sort((a, b) => a - b)) {
    const periodStart = new Date(startMs)
    const range = { start: periodStart, end: endOfMonth(periodStart) }
    const agg = aggregateVolume(withLoad, range)
    const hardDays = withLoad
      .filter(
        (x) =>
          x.intensity === "hard" &&
          x.activity.startedAt >= range.start &&
          x.activity.startedAt < range.end
      )
      .map((x) => ymdKey(zonedYmd(x.activity.startedAt, timeZone)))
    summaries.push({
      athleteId,
      period: "month",
      periodStart,
      sessionCount: agg.sessionCount,
      totalDurationSeconds: agg.totalDurationSeconds,
      totalDistanceMeters: agg.totalDistanceMeters,
      totalLoad: agg.totalLoad,
      bySport: agg.bySport,
      intensityCounts: agg.intensityCounts,
      highIntensityCluster: hasHighIntensityCluster(hardDays),
      volumeVersion: agg.volumeVersion,
      loadVersion: LOAD_VERSION,
      computedAt: now,
    })
  }

  const personalRecords = detectPersonalRecords(
    athleteId,
    withLoad.map((x) => ({
      activity: x.activity,
      sessionLoad: x.sessionLoad,
    }))
  )

  const weekSummaries = summaries
    .filter((s) => s.period === "week")
    .sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime())

  const completeWeeks = weekSummaries.filter(
    (s) => endOfWeek(s.periodStart).getTime() <= now.getTime()
  )
  const consistencyScore = computeConsistencyScore(
    completeWeeks.map((s) => s.sessionCount)
  )

  const currentWeekSummary =
    weekSummaries.find((s) => s.periodStart.getTime() === currentWeek.getTime()) ??
    null

  const sports = [
    ...new Set(sorted.map((a) => a.sport)),
  ] as Sport[]

  const last7Start = new Date(now.getTime() - 7 * 86_400_000)
  const prior7Start = new Date(now.getTime() - 14 * 86_400_000)
  const hardLast7 = countHardInWindow(
    sorted,
    intensityById,
    last7Start,
    now
  )
  const hardPrior7 = countHardInWindow(
    sorted,
    intensityById,
    prior7Start,
    last7Start
  )

  const runs = sorted.filter((a) => a.sport === "running")
  const paceLast = medianPaceForSport(runs, "running", now, null, 28)
  const pacePriorAsOf = new Date(now.getTime() - 28 * 86_400_000)
  const pacePrior = medianPaceForSport(
    runs,
    "running",
    pacePriorAsOf,
    null,
    28
  )

  const trends = computeTrendPlaceholders({
    weeklyLoadsOldestFirst: weekSummaries.map((s) => s.totalLoad),
    hardSessionsLast7: hardLast7,
    hardSessionsPrior7: hardPrior7,
    runningMedianPaceLast28: paceLast,
    runningMedianPacePrior28: pacePrior,
  })

  const rollup: AthleteMetricRollup = {
    sports,
    trainingFrequency: currentWeekSummary?.sessionCount ?? 0,
    weeklyVolumeDistanceMeters: currentWeekSummary?.totalDistanceMeters ?? 0,
    weeklyVolumeDurationSeconds: currentWeekSummary?.totalDurationSeconds ?? 0,
    trainingLoad: currentWeekSummary?.totalLoad ?? 0,
    consistencyScore,
    currentStreakDays: computeCurrentStreakDays(
      sorted.map((a) => a.startedAt),
      timeZone,
      now
    ),
    fitnessTrend: trends.fitnessTrend,
    recoveryTrend: trends.recoveryTrend,
    performanceTrend: trends.performanceTrend,
    metricsVersion: METRICS_BUNDLE_VERSION,
    computedAt: now,
  }

  return { activityMetrics, summaries, personalRecords, rollup }
}
