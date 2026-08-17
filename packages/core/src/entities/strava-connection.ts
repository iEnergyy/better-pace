import type { AthleteId, StravaConnectionId } from "./ids"

export const STRAVA_SYNC_STATUSES = [
  "idle",
  "importing",
  "synced",
  "error",
] as const

export type StravaSyncStatus = (typeof STRAVA_SYNC_STATUSES)[number]

/**
 * Scopes requested for PacePilot Phase 0 (activity read + athlete profile).
 * No write scopes.
 */
export const STRAVA_OAUTH_SCOPES = [
  "read",
  "activity:read_all",
  "profile:read_all",
] as const

export type StravaOAuthScope = (typeof STRAVA_OAUTH_SCOPES)[number]

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
  /** Human-readable import progress while syncStatus is importing. */
  syncProgress: string | null
}

/**
 * Client-safe connection view — no token material.
 */
export interface StravaConnectionPublic {
  athleteId: AthleteId
  stravaAthleteId: string
  scopes: string[]
  syncStatus: StravaSyncStatus
  connectedAt: Date
  disconnectedAt: Date | null
  lastSyncAt: Date | null
  lastError: string | null
  syncProgress: string | null
  /** Activity count for this athlete (filled by UI status helpers). */
  importedCount?: number
}

export function isStravaConnected(
  connection: StravaConnection | StravaConnectionPublic | null | undefined
): boolean {
  return connection != null && connection.disconnectedAt == null
}

export function toPublicStravaConnection(
  connection: StravaConnection,
  extras?: { importedCount?: number }
): StravaConnectionPublic {
  const pub: StravaConnectionPublic = {
    athleteId: connection.athleteId,
    stravaAthleteId: connection.stravaAthleteId,
    scopes: connection.scopes,
    syncStatus: connection.syncStatus,
    connectedAt: connection.connectedAt,
    disconnectedAt: connection.disconnectedAt,
    lastSyncAt: connection.lastSyncAt,
    lastError: connection.lastError,
    syncProgress: connection.syncProgress,
  }
  if (extras?.importedCount != null) {
    pub.importedCount = extras.importedCount
  }
  return pub
}
