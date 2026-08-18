import type {
  Activity,
  ActivityId,
  AthleteId,
  IntensityLabel,
  Sport,
} from "@pacepilot/core"
import { and, count, desc, eq, gte, lt, type SQL } from "drizzle-orm"
import type { Database } from "./client"
import { toActivity } from "./mappers"
import { activities, activityMetrics } from "./schema/index"

export type ActivityWrite = Omit<Activity, "id" | "createdAt" | "updatedAt">

export type ActivityListFilters = {
  athleteId: AthleteId
  limit?: number
  /** Exclusive cursor: return activities started before this date. */
  beforeStartedAt?: Date
  sport?: Sport
  from?: Date
  to?: Date
  intensity?: IntensityLabel
  minDurationSeconds?: number
}

export type ActivityWithMetric = Activity & {
  intensity: IntensityLabel | null
  sessionLoad: number | null
}

export async function upsertActivity(
  database: Database,
  input: ActivityWrite,
  now: Date = new Date()
): Promise<Activity> {
  const [row] = await database
    .insert(activities)
    .values({
      athleteId: input.athleteId,
      source: input.source,
      externalId: input.externalId,
      sport: input.sport,
      name: input.name,
      startedAt: input.startedAt,
      durationSeconds: input.durationSeconds,
      distanceMeters: input.distanceMeters,
      elevationGainMeters: input.elevationGainMeters,
      averageHeartRate: input.averageHeartRate,
      maxHeartRate: input.maxHeartRate,
      averagePaceSecondsPerKm: input.averagePaceSecondsPerKm,
      calories: input.calories,
      averageSpeedMetersPerSecond: input.averageSpeedMetersPerSecond,
      maxSpeedMetersPerSecond: input.maxSpeedMetersPerSecond,
      rawData: input.rawData,
      metricsVersion: input.metricsVersion,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [activities.athleteId, activities.source, activities.externalId],
      set: {
        sport: input.sport,
        name: input.name,
        startedAt: input.startedAt,
        durationSeconds: input.durationSeconds,
        distanceMeters: input.distanceMeters,
        elevationGainMeters: input.elevationGainMeters,
        averageHeartRate: input.averageHeartRate,
        maxHeartRate: input.maxHeartRate,
        averagePaceSecondsPerKm: input.averagePaceSecondsPerKm,
        calories: input.calories,
        averageSpeedMetersPerSecond: input.averageSpeedMetersPerSecond,
        maxSpeedMetersPerSecond: input.maxSpeedMetersPerSecond,
        rawData: input.rawData,
        metricsVersion: input.metricsVersion,
        updatedAt: now,
      },
    })
    .returning()

  if (!row) {
    throw new Error("Failed to upsert activity")
  }
  return toActivity(row)
}

export async function listActivitiesForAthlete(
  database: Database,
  options: ActivityListFilters
): Promise<Activity[]> {
  const limit = options.limit ?? 50
  const conditions: SQL[] = [eq(activities.athleteId, options.athleteId)]
  if (options.beforeStartedAt) {
    conditions.push(lt(activities.startedAt, options.beforeStartedAt))
  }
  if (options.sport) {
    conditions.push(eq(activities.sport, options.sport))
  }
  if (options.from) {
    conditions.push(gte(activities.startedAt, options.from))
  }
  if (options.to) {
    conditions.push(lt(activities.startedAt, options.to))
  }
  if (options.minDurationSeconds != null) {
    conditions.push(gte(activities.durationSeconds, options.minDurationSeconds))
  }

  if (options.intensity) {
    const rows = await database
      .select({ activity: activities })
      .from(activities)
      .innerJoin(
        activityMetrics,
        eq(activityMetrics.activityId, activities.id)
      )
      .where(
        and(...conditions, eq(activityMetrics.intensity, options.intensity))
      )
      .orderBy(desc(activities.startedAt))
      .limit(limit)
    return rows.map((r) => toActivity(r.activity))
  }

  const rows = await database
    .select()
    .from(activities)
    .where(and(...conditions))
    .orderBy(desc(activities.startedAt))
    .limit(limit)

  return rows.map(toActivity)
}

export async function listActivitiesWithMetricsForAthlete(
  database: Database,
  options: ActivityListFilters
): Promise<ActivityWithMetric[]> {
  const limit = options.limit ?? 50
  const conditions: SQL[] = [eq(activities.athleteId, options.athleteId)]
  if (options.beforeStartedAt) {
    conditions.push(lt(activities.startedAt, options.beforeStartedAt))
  }
  if (options.sport) {
    conditions.push(eq(activities.sport, options.sport))
  }
  if (options.from) {
    conditions.push(gte(activities.startedAt, options.from))
  }
  if (options.to) {
    conditions.push(lt(activities.startedAt, options.to))
  }
  if (options.minDurationSeconds != null) {
    conditions.push(gte(activities.durationSeconds, options.minDurationSeconds))
  }
  if (options.intensity) {
    conditions.push(eq(activityMetrics.intensity, options.intensity))
  }

  const rows = await database
    .select({
      activity: activities,
      intensity: activityMetrics.intensity,
      sessionLoad: activityMetrics.sessionLoad,
    })
    .from(activities)
    .leftJoin(activityMetrics, eq(activityMetrics.activityId, activities.id))
    .where(and(...conditions))
    .orderBy(desc(activities.startedAt))
    .limit(limit)

  return rows.map((r) => ({
    ...toActivity(r.activity),
    intensity: r.intensity ?? null,
    sessionLoad: r.sessionLoad ?? null,
  }))
}

export async function getActivityForAthlete(
  database: Database,
  athleteId: AthleteId,
  activityId: ActivityId
): Promise<ActivityWithMetric | null> {
  const rows = await database
    .select({
      activity: activities,
      intensity: activityMetrics.intensity,
      sessionLoad: activityMetrics.sessionLoad,
    })
    .from(activities)
    .leftJoin(activityMetrics, eq(activityMetrics.activityId, activities.id))
    .where(
      and(eq(activities.id, activityId), eq(activities.athleteId, athleteId))
    )
    .limit(1)

  const row = rows[0]
  if (!row) return null
  return {
    ...toActivity(row.activity),
    intensity: row.intensity ?? null,
    sessionLoad: row.sessionLoad ?? null,
  }
}

export async function countActivitiesForAthlete(
  database: Database,
  athleteId: AthleteId
): Promise<number> {
  const [row] = await database
    .select({ value: count() })
    .from(activities)
    .where(eq(activities.athleteId, athleteId))
  return Number(row?.value ?? 0)
}

export async function findActivityByExternalId(
  database: Database,
  athleteId: AthleteId,
  externalId: string
): Promise<Activity | null> {
  const row = await database.query.activities.findFirst({
    where: and(
      eq(activities.athleteId, athleteId),
      eq(activities.source, "strava"),
      eq(activities.externalId, externalId)
    ),
  })
  return row ? toActivity(row) : null
}

export type { ActivityId }
