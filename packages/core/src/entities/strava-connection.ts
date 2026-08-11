import type { AthleteId, StravaConnectionId } from "./ids"

export const STRAVA_SYNC_STATUSES = [
  "idle",
  "importing",
  "synced",
  "error",
] as const

export type StravaSyncStatus = (typeof STRAVA_SYNC_STATUSES)[number]

/**
 * Strava OAuth connection for an athlete.
 * Tokens are encrypted at rest in infrastructure; never expose to clients.
 */
export interface StravaConnection {
  id: StravaConnectionId
  athleteId: AthleteId
  stravaAthleteId: string
  accessTokenEncrypted: string
  refreshTokenEncrypted: string
  expiresAt: Date
  scopes: string[]
  syncStatus: StravaSyncStatus
  connectedAt: Date
  disconnectedAt: Date | null
  lastSyncAt: Date | null
  lastError: string | null
}
