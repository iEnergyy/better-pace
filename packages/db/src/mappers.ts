import type {
  Activity,
  ActivityId,
  AthleteId,
  AthleteProfile,
  Goal,
  StravaConnection,
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
    id: row.id,
    userId: row.userId,
    displayName: row.displayName,
    timezone: row.timezone,
    preferredUnits: row.preferredUnits,
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
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function toStravaConnection(row: StravaConnectionRow): StravaConnection {
  return {
    id: row.id,
    athleteId: row.athleteId,
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
  }
}

export function toGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    athleteId: row.athleteId,
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
