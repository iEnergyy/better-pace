import type { Activity, ActivityId, AthleteId } from "@pacepilot/core"
import { and, count, desc, eq, lt, type SQL } from "drizzle-orm"
import type { Database } from "./client"
import { toActivity } from "./mappers"
import { activities } from "./schema/index"

export type ActivityWrite = Omit<Activity, "id" | "createdAt" | "updatedAt">

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
  options: {
    athleteId: AthleteId
    limit?: number
    /** Exclusive cursor: return activities started before this date. */
    beforeStartedAt?: Date
  }
): Promise<Activity[]> {
  const limit = options.limit ?? 50
  const conditions: SQL[] = [eq(activities.athleteId, options.athleteId)]
  if (options.beforeStartedAt) {
    conditions.push(lt(activities.startedAt, options.beforeStartedAt))
  }

  const rows = await database
    .select()
    .from(activities)
    .where(and(...conditions))
    .orderBy(desc(activities.startedAt))
    .limit(limit)

  return rows.map(toActivity)
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
