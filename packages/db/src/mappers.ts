import type {
  Activity,
  ActivityId,
  AthleteId,
  AthleteProfile,
  Goal,
  GoalId,
  StravaConnection,
  StravaConnectionId,
} from "@pacepilot/core"
import type {
  activities,
  athleteProfiles,
  goals,
  stravaConnections,
} from "./schema/index"

type AthleteProfileRow = typeof athleteProfiles.$inferSelect
type ActivityRow = typeof activities.$inferSelect
type StravaConnectionRow = typeof stravaConnections.$inferSelect
type GoalRow = typeof goals.$inferSelect

export function toAthleteProfile(row: AthleteProfileRow): AthleteProfile {
  return {
    id: row.id as AthleteId,
    userId: row.userId,
    displayName: row.displayName,
    timezone: row.timezone,
    preferredUnits: row.preferredUnits,
    metricsRollup: (row.metricsRollup as AthleteProfile["metricsRollup"]) ?? null,
    metricsVersion: row.metricsVersion ?? null,
    metricsComputedAt: row.metricsComputedAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  }
}

export function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id as ActivityId,
    athleteId: row.athleteId as AthleteId,
    source: row.source,
    externalId: row.externalId,
    sport: row.sport,
    name: row.name,
    startedAt: row.startedAt,
    durationSeconds: row.durationSeconds,
    distanceMeters: row.distanceMeters,
    elevationGainMeters: row.elevationGainMeters,
    averageHeartRate: row.averageHeartRate,
    maxHeartRate: row.maxHeartRate,
    averagePaceSecondsPerKm: row.averagePaceSecondsPerKm,
    calories: row.calories,
    averageSpeedMetersPerSecond: row.averageSpeedMetersPerSecond,
    maxSpeedMetersPerSecond: row.maxSpeedMetersPerSecond,
    rawData: row.rawData ?? null,
    metricsVersion: row.metricsVersion,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function toStravaConnection(row: StravaConnectionRow): StravaConnection {
  return {
    id: row.id as StravaConnectionId,
    athleteId: row.athleteId as AthleteId,
    stravaAthleteId: row.stravaAthleteId,
    accessTokenEncrypted: row.accessTokenEncrypted,
    refreshTokenEncrypted: row.refreshTokenEncrypted,
    expiresAt: row.expiresAt,
    scopes: row.scopes ?? [],
    syncStatus: row.syncStatus,
    connectedAt: row.connectedAt,
    disconnectedAt: row.disconnectedAt,
    lastSyncAt: row.lastSyncAt,
    lastError: row.lastError,
    syncProgress: row.syncProgress,
  }
}

export function toGoal(row: GoalRow): Goal {
  return {
    id: row.id as GoalId,
    athleteId: row.athleteId as AthleteId,
    sport: row.sport,
    title: row.title,
    metric: row.metric,
    targetValue: row.targetValue,
    status: row.status,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
