import type {
  ActivityId,
  ActivityMetric,
  AthleteId,
  AthleteMetricRollup,
  IntensityCounts,
  PersonalRecord,
  SportVolumeBucket,
  TrainingSummary,
} from "@pacepilot/core"
import { and, asc, desc, eq, gte } from "drizzle-orm"
import type { Database } from "./client"
import { toActivity } from "./mappers"
import {
  activities,
  activityMetrics,
  athleteProfiles,
  personalRecords,
  trainingSummaries,
} from "./schema/index"

export async function listAllActivitiesForAthlete(
  database: Database,
  athleteId: AthleteId
) {
  const rows = await database
    .select()
    .from(activities)
    .where(eq(activities.athleteId, athleteId))
    .orderBy(asc(activities.startedAt))
  return rows.map(toActivity)
}

export async function listActivitiesUpdatedSince(
  database: Database,
  athleteId: AthleteId,
  since: Date
) {
  const rows = await database
    .select()
    .from(activities)
    .where(
      and(eq(activities.athleteId, athleteId), gte(activities.updatedAt, since))
    )
    .orderBy(asc(activities.startedAt))
  return rows.map(toActivity)
}

export async function replaceActivityMetrics(
  database: Database,
  athleteId: AthleteId,
  metrics: ActivityMetric[],
  mode: "full" | "incremental"
) {
  if (mode === "full") {
    await database
      .delete(activityMetrics)
      .where(eq(activityMetrics.athleteId, athleteId))
  }

  for (const m of metrics) {
    await database
      .insert(activityMetrics)
      .values({
        activityId: m.activityId,
        athleteId: m.athleteId,
        intensity: m.intensity,
        intensityVersion: m.intensityVersion,
        sessionLoad: m.sessionLoad,
        loadVersion: m.loadVersion,
        hrMaxUsed: m.hrMaxUsed,
        estimated: m.estimated,
        computedAt: m.computedAt,
      })
      .onConflictDoUpdate({
        target: activityMetrics.activityId,
        set: {
          intensity: m.intensity,
          intensityVersion: m.intensityVersion,
          sessionLoad: m.sessionLoad,
          loadVersion: m.loadVersion,
          hrMaxUsed: m.hrMaxUsed,
          estimated: m.estimated,
          computedAt: m.computedAt,
        },
      })
  }
}

export async function upsertTrainingSummaries(
  database: Database,
  summaries: TrainingSummary[],
  mode: "full" | "incremental",
  athleteId: AthleteId
) {
  if (mode === "full") {
    await database
      .delete(trainingSummaries)
      .where(eq(trainingSummaries.athleteId, athleteId))
  }

  for (const s of summaries) {
    await database
      .insert(trainingSummaries)
      .values({
        athleteId: s.athleteId,
        period: s.period,
        periodStart: s.periodStart,
        sessionCount: s.sessionCount,
        totalDurationSeconds: s.totalDurationSeconds,
        totalDistanceMeters: s.totalDistanceMeters,
        totalLoad: s.totalLoad,
        bySport: s.bySport,
        intensityCounts: s.intensityCounts,
        highIntensityCluster: s.highIntensityCluster,
        volumeVersion: s.volumeVersion,
        loadVersion: s.loadVersion,
        computedAt: s.computedAt,
      })
      .onConflictDoUpdate({
        target: [
          trainingSummaries.athleteId,
          trainingSummaries.period,
          trainingSummaries.periodStart,
        ],
        set: {
          sessionCount: s.sessionCount,
          totalDurationSeconds: s.totalDurationSeconds,
          totalDistanceMeters: s.totalDistanceMeters,
          totalLoad: s.totalLoad,
          bySport: s.bySport,
          intensityCounts: s.intensityCounts,
          highIntensityCluster: s.highIntensityCluster,
          volumeVersion: s.volumeVersion,
          loadVersion: s.loadVersion,
          computedAt: s.computedAt,
        },
      })
  }
}

export async function replacePersonalRecords(
  database: Database,
  athleteId: AthleteId,
  records: PersonalRecord[]
) {
  await database
    .delete(personalRecords)
    .where(eq(personalRecords.athleteId, athleteId))

  for (const r of records) {
    await database.insert(personalRecords).values({
      athleteId: r.athleteId,
      sport: r.sport,
      kind: r.kind,
      activityId: r.activityId,
      value: r.value,
      unit: r.unit,
      estimated: r.estimated,
      achievedAt: r.achievedAt,
      updatedAt: new Date(),
    })
  }
}

export async function saveAthleteMetricRollup(
  database: Database,
  athleteId: AthleteId,
  rollup: AthleteMetricRollup
) {
  await database
    .update(athleteProfiles)
    .set({
      metricsRollup: rollup,
      metricsVersion: rollup.metricsVersion,
      metricsComputedAt: rollup.computedAt,
      updatedAt: new Date(),
    })
    .where(eq(athleteProfiles.id, athleteId))
}

export async function getTrainingSummary(
  database: Database,
  athleteId: AthleteId,
  period: "week" | "month",
  periodStart: Date
): Promise<TrainingSummary | null> {
  const row = await database.query.trainingSummaries.findFirst({
    where: and(
      eq(trainingSummaries.athleteId, athleteId),
      eq(trainingSummaries.period, period),
      eq(trainingSummaries.periodStart, periodStart)
    ),
  })
  if (!row) return null
  return {
    athleteId: row.athleteId as AthleteId,
    period: row.period,
    periodStart: row.periodStart,
    sessionCount: row.sessionCount,
    totalDurationSeconds: row.totalDurationSeconds,
    totalDistanceMeters: row.totalDistanceMeters,
    totalLoad: row.totalLoad,
    bySport: row.bySport as SportVolumeBucket[],
    intensityCounts: row.intensityCounts as IntensityCounts,
    highIntensityCluster: row.highIntensityCluster,
    volumeVersion: row.volumeVersion,
    loadVersion: row.loadVersion,
    computedAt: row.computedAt,
  }
}

export async function getWeekSummary(
  database: Database,
  athleteId: AthleteId,
  periodStart: Date
): Promise<TrainingSummary | null> {
  return getTrainingSummary(database, athleteId, "week", periodStart)
}

export async function listPersonalRecordsForAthlete(
  database: Database,
  athleteId: AthleteId
): Promise<PersonalRecord[]> {
  const rows = await database
    .select()
    .from(personalRecords)
    .where(eq(personalRecords.athleteId, athleteId))
    .orderBy(desc(personalRecords.achievedAt))

  return rows.map((row) => ({
    athleteId: row.athleteId as AthleteId,
    sport: row.sport,
    kind: row.kind,
    activityId: row.activityId as ActivityId,
    value: row.value,
    unit: row.unit,
    estimated: row.estimated,
    achievedAt: row.achievedAt,
  }))
}

export async function getAthleteInsightsBundle(
  database: Database,
  athleteId: AthleteId,
  weekStart: Date
) {
  const profile = await database.query.athleteProfiles.findFirst({
    where: eq(athleteProfiles.id, athleteId),
  })
  const week = await getWeekSummary(database, athleteId, weekStart)
  const records = await listPersonalRecordsForAthlete(database, athleteId)
  return {
    timezone: profile?.timezone ?? "UTC",
    preferredUnits: profile?.preferredUnits ?? "metric",
    rollup: (profile?.metricsRollup as AthleteMetricRollup | null) ?? null,
    metricsVersion: profile?.metricsVersion ?? null,
    metricsComputedAt: profile?.metricsComputedAt ?? null,
    week,
    personalRecords: records,
  }
}
