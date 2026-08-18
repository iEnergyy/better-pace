import type { AthleteMetricRollup } from "./types"
import type { PersonalRecord } from "./types"
import type { TrainingSummary } from "./types"

export const INSIGHT_SEVERITIES = ["info", "positive", "warning"] as const

export type InsightSeverity = (typeof INSIGHT_SEVERITIES)[number]

export interface InsightCard {
  id: string
  severity: InsightSeverity
  title: string
  body: string
  tags: string[]
}

export type InsightGeneratorInput = {
  thisWeek: TrainingSummary | null
  lastWeek: TrainingSummary | null
  rollup: AthleteMetricRollup | null
  recentPrs: PersonalRecord[]
  weekStart: Date
  weekEnd: Date
  now?: Date
}

const MAX_CARDS = 6

function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null
  return ((current - previous) / previous) * 100
}

function volumeDeltaCard(
  thisWeek: TrainingSummary,
  lastWeek: TrainingSummary | null
): InsightCard | null {
  if (!lastWeek || lastWeek.sessionCount === 0) {
    if (thisWeek.sessionCount === 0) return null
    return {
      id: "volume-delta",
      severity: "info",
      title: "Training underway this week",
      body: `You've logged ${thisWeek.sessionCount} session${thisWeek.sessionCount === 1 ? "" : "s"} so far. Keep noting how the week feels versus Strava.`,
      tags: ["volume"],
    }
  }

  const delta = pctChange(
    thisWeek.totalDurationSeconds,
    lastWeek.totalDurationSeconds
  )
  if (delta == null) return null
  const abs = Math.abs(Math.round(delta))
  if (abs < 8) {
    return {
      id: "volume-delta",
      severity: "info",
      title: "Training time similar to last week",
      body: `Total duration is within ~${abs}% of last week (${thisWeek.sessionCount} sessions so far).`,
      tags: ["volume"],
    }
  }
  const up = delta > 0
  return {
    id: "volume-delta",
    severity: up ? "positive" : "warning",
    title: up ? "Training volume up vs last week" : "Training volume down vs last week",
    body: `Total training time is about ${abs}% ${up ? "higher" : "lower"} than last week. This is a calendar comparison only — not a fitness diagnosis.`,
    tags: ["volume"],
  }
}

function clusterCard(thisWeek: TrainingSummary): InsightCard | null {
  if (!thisWeek.highIntensityCluster) return null
  return {
    id: "high-intensity-cluster",
    severity: "warning",
    title: "High-intensity cluster this week",
    body: `You've stacked several hard sessions in a short window (${thisWeek.intensityCounts.hard} hard). Watch how easy days feel — this is a workload note, not medical advice.`,
    tags: ["intensity", "cluster"],
  }
}

function crossSportCard(thisWeek: TrainingSummary): InsightCard | null {
  const running = thisWeek.bySport.find((b) => b.sport === "running")
  const padel = thisWeek.bySport.find((b) => b.sport === "padel")
  const strength = thisWeek.bySport.find((b) => b.sport === "strength")
  const otherDuration =
    (padel?.durationSeconds ?? 0) + (strength?.durationSeconds ?? 0)
  const runKm = (running?.distanceMeters ?? 0) / 1000

  if (otherDuration < 3600) return null
  if (runKm > 30) return null
  if (thisWeek.totalLoad < 80) return null

  const parts: string[] = []
  if (padel && padel.sessionCount > 0) {
    parts.push(
      `${padel.sessionCount} padel session${padel.sessionCount === 1 ? "" : "s"}`
    )
  }
  if (strength && strength.sessionCount > 0) {
    parts.push(
      `${strength.sessionCount} strength session${strength.sessionCount === 1 ? "" : "s"}`
    )
  }
  if (parts.length === 0) return null

  return {
    id: "cross-sport-load",
    severity: "info",
    title: "Cross-sport load is carrying the week",
    body: `Running distance looks modest (${runKm.toFixed(1)} km), but overall load is elevated because of ${parts.join(" and ")}. Single-sport charts can miss that.`,
    tags: ["cross-sport", "load"],
  }
}

function newPrCard(
  recentPrs: PersonalRecord[],
  weekStart: Date,
  weekEnd: Date
): InsightCard | null {
  const inWeek = recentPrs.filter(
    (p) => p.achievedAt >= weekStart && p.achievedAt < weekEnd
  )
  if (inWeek.length === 0) return null
  const first = inWeek[0]!
  const label = first.kind.replaceAll("_", " ")
  return {
    id: "new-pr",
    severity: "positive",
    title: "New personal record this week",
    body: `${first.sport}: ${label}${first.estimated ? " (estimated from available pace/distance)" : ""}. Nice work — verify against Strava if it looks off.`,
    tags: ["pr", first.sport],
  }
}

function consistencyCard(rollup: AthleteMetricRollup): InsightCard | null {
  if (rollup.consistencyScore < 50) {
    return {
      id: "consistency",
      severity: "warning",
      title: "Consistency is low lately",
      body: `Your 4-week consistency score is ${rollup.consistencyScore}% (weeks with ≥3 sessions). Streak: ${rollup.currentStreakDays} day${rollup.currentStreakDays === 1 ? "" : "s"}.`,
      tags: ["consistency"],
    }
  }
  if (rollup.currentStreakDays >= 5) {
    return {
      id: "consistency",
      severity: "positive",
      title: "Solid training streak",
      body: `You're on a ${rollup.currentStreakDays}-day streak with consistency at ${rollup.consistencyScore}%.`,
      tags: ["consistency", "streak"],
    }
  }
  return null
}

function recoveryCard(rollup: AthleteMetricRollup): InsightCard | null {
  if (rollup.recoveryTrend.direction !== "down") return null
  return {
    id: "recovery-pressure",
    severity: "warning",
    title: "Recovery pressure rising",
    body: "Hard-session density looks higher than the prior week. Consider how easy sessions feel — PacePilot load is not a medical measurement.",
    tags: ["recovery"],
  }
}

/**
 * insights.v1 — deterministic template cards from persisted metrics.
 */
export function generateInsightCards(
  input: InsightGeneratorInput
): InsightCard[] {
  const cards: InsightCard[] = []

  if (input.thisWeek) {
    const volume = volumeDeltaCard(input.thisWeek, input.lastWeek)
    if (volume) cards.push(volume)
    const cluster = clusterCard(input.thisWeek)
    if (cluster) cards.push(cluster)
    const cross = crossSportCard(input.thisWeek)
    if (cross) cards.push(cross)
  }

  const pr = newPrCard(input.recentPrs, input.weekStart, input.weekEnd)
  if (pr) cards.push(pr)

  if (input.rollup) {
    const consistency = consistencyCard(input.rollup)
    if (consistency) cards.push(consistency)
    const recovery = recoveryCard(input.rollup)
    if (recovery) cards.push(recovery)
  }

  const severityRank: Record<InsightSeverity, number> = {
    warning: 0,
    positive: 1,
    info: 2,
  }
  return cards
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
    .slice(0, MAX_CARDS)
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

/** Local hour 0–23 in the given IANA timezone. */
export function localHourInTimeZone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date)
  return Number(parts.find((p) => p.type === "hour")?.value ?? 12)
}

export function greetingInTimeZone(
  date: Date,
  timeZone: string
): string {
  return greetingForHour(localHourInTimeZone(date, timeZone))
}
