export type StravaSyncStatus = "idle" | "importing" | "synced" | "error"

/**
 * Strava OAuth connection for an athlete.
 * Tokens are encrypted at rest in infrastructure; never expose to clients.
 */
export interface StravaConnection {
  id: string
  athleteId: string
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
