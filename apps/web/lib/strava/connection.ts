import {
  type AthleteId,
  isStravaConnected,
  type StravaConnection,
  type StravaConnectionPublic,
  toPublicStravaConnection,
} from "@pacepilot/core"
import {
  athleteProfiles,
  stravaConnections,
  toStravaConnection,
} from "@pacepilot/db"
import { and, eq, isNull } from "drizzle-orm"
import {
  decryptToken,
  encryptToken,
  requireTokenEncryptionKey,
} from "@/lib/crypto/token-encryption"
import { db } from "@/lib/db"
import { getStravaOAuthConfig } from "./config"
import {
  deauthorize,
  exchangeAuthorizationCode,
  hasRequiredScopes,
  parseGrantedScopes,
  refreshAccessToken,
  StravaOAuthError,
} from "./oauth"

const REFRESH_SKEW_MS = 5 * 60 * 1000
const CLEARED_TOKEN = ""

export type ConnectionServiceDeps = {
  db: typeof db
  fetchImpl?: typeof fetch
  encryptionKey?: string
  now?: () => Date
  /** Optional hook after connect — used to trigger 0.4 import. */
  onConnected?: (connection: StravaConnection) => Promise<void> | void
}

function getKey(deps: ConnectionServiceDeps): string {
  return deps.encryptionKey ?? requireTokenEncryptionKey()
}

export async function getAthleteIdForUser(
  userId: string,
  database: typeof db = db
): Promise<AthleteId | null> {
  const profile = await database.query.athleteProfiles.findFirst({
    where: eq(athleteProfiles.userId, userId),
  })
  return (profile?.id as AthleteId | undefined) ?? null
}

export async function findConnectionForAthlete(
  athleteId: AthleteId,
  database: typeof db = db
): Promise<StravaConnection | null> {
  const row = await database.query.stravaConnections.findFirst({
    where: eq(stravaConnections.athleteId, athleteId),
  })
  return row ? toStravaConnection(row) : null
}

export async function getConnectionStatus(
  athleteId: AthleteId,
  database: typeof db = db
): Promise<StravaConnectionPublic | null> {
  const connection = await findConnectionForAthlete(athleteId, database)
  if (!connection || !isStravaConnected(connection)) {
    return connection ? toPublicStravaConnection(connection) : null
  }
  return toPublicStravaConnection(connection)
}

/**
 * Client-facing status used by Settings / dashboard.
 * Never includes token fields.
 */
export type StravaUiStatus = {
  connected: boolean
  connection: StravaConnectionPublic | null
}

export async function getStravaUiStatus(
  athleteId: AthleteId,
  database: typeof db = db
): Promise<StravaUiStatus> {
  const connection = await findConnectionForAthlete(athleteId, database)
  if (!connection) {
    return { connected: false, connection: null }
  }
  const publicConnection = toPublicStravaConnection(connection)
  return {
    connected: isStravaConnected(connection),
    connection: publicConnection,
  }
}

export async function completeOAuthConnection(
  input: {
    athleteId: AthleteId
    code: string
    scopeParam: string | null
  },
  deps: ConnectionServiceDeps = { db }
): Promise<StravaConnectionPublic> {
  const config = getStravaOAuthConfig()
  const fetchImpl = deps.fetchImpl ?? fetch
  const key = getKey(deps)
  const now = deps.now?.() ?? new Date()

  const scopes = parseGrantedScopes(input.scopeParam)
  if (!hasRequiredScopes(scopes)) {
    throw new StravaOAuthError(
      "Strava authorization is missing activity read scope"
    )
  }

  const tokens = await exchangeAuthorizationCode(config, input.code, fetchImpl)

  if (tokens.athlete?.id == null) {
    throw new StravaOAuthError("Strava token response missing athlete id")
  }

  const stravaAthleteId = String(tokens.athlete.id)
  const accessTokenEncrypted = encryptToken(tokens.accessToken, key)
  const refreshTokenEncrypted = encryptToken(tokens.refreshToken, key)

  const existing = await findConnectionForAthlete(input.athleteId, deps.db)

  type ConnectionRow = typeof stravaConnections.$inferSelect
  let row: ConnectionRow | undefined
  if (existing) {
    const [updated] = await deps.db
      .update(stravaConnections)
      .set({
        stravaAthleteId,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        expiresAt: tokens.expiresAt,
        scopes,
        syncStatus: "importing",
        connectedAt: now,
        disconnectedAt: null,
        lastError: null,
      })
      .where(eq(stravaConnections.id, existing.id))
      .returning()
    row = updated
  } else {
    const [inserted] = await deps.db
      .insert(stravaConnections)
      .values({
        athleteId: input.athleteId,
        stravaAthleteId,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        expiresAt: tokens.expiresAt,
        scopes,
        syncStatus: "importing",
        connectedAt: now,
        disconnectedAt: null,
        lastError: null,
      })
      .returning()
    row = inserted
  }

  if (!row) {
    throw new StravaOAuthError("Failed to persist Strava connection")
  }

  const connection = toStravaConnection(row)
  if (deps.onConnected) {
    await deps.onConnected(connection)
  }
  return toPublicStravaConnection(connection)
}

/**
 * Disconnect: best-effort Strava deauthorize, then clear local tokens.
 * Previously imported activities are retained (documented in README).
 */
export async function disconnectConnection(
  athleteId: AthleteId,
  deps: ConnectionServiceDeps = { db }
): Promise<StravaUiStatus> {
  const fetchImpl = deps.fetchImpl ?? fetch
  const key = getKey(deps)
  const now = deps.now?.() ?? new Date()
  const connection = await findConnectionForAthlete(athleteId, deps.db)

  if (!(connection && isStravaConnected(connection))) {
    return {
      connected: false,
      connection: connection ? toPublicStravaConnection(connection) : null,
    }
  }

  if (connection.accessTokenEncrypted) {
    try {
      const accessToken = decryptToken(connection.accessTokenEncrypted, key)
      await deauthorize(accessToken, fetchImpl)
    } catch {
      // Best-effort remote revoke; local clear still proceeds.
    }
  }

  const [updated] = await deps.db
    .update(stravaConnections)
    .set({
      accessTokenEncrypted: CLEARED_TOKEN,
      refreshTokenEncrypted: CLEARED_TOKEN,
      expiresAt: new Date(0),
      disconnectedAt: now,
      syncStatus: "idle",
      lastError: null,
    })
    .where(
      and(
        eq(stravaConnections.athleteId, athleteId),
        isNull(stravaConnections.disconnectedAt)
      )
    )
    .returning()

  const next = updated ? toStravaConnection(updated) : connection
  return {
    connected: false,
    connection: toPublicStravaConnection({
      ...next,
      disconnectedAt: next.disconnectedAt ?? now,
      accessTokenEncrypted: CLEARED_TOKEN,
      refreshTokenEncrypted: CLEARED_TOKEN,
    }),
  }
}

/**
 * Return a usable access token, refreshing when expired or within skew.
 * For use by server-side sync (0.4+); never expose to clients.
 */
export async function getValidAccessToken(
  athleteId: AthleteId,
  deps: ConnectionServiceDeps = { db }
): Promise<string> {
  const config = getStravaOAuthConfig()
  const fetchImpl = deps.fetchImpl ?? fetch
  const key = getKey(deps)
  const now = deps.now?.() ?? new Date()
  const connection = await findConnectionForAthlete(athleteId, deps.db)

  if (!(connection && isStravaConnected(connection))) {
    throw new StravaOAuthError("Strava is not connected", 401)
  }
  if (!(connection.accessTokenEncrypted && connection.refreshTokenEncrypted)) {
    throw new StravaOAuthError("Strava tokens are missing", 401)
  }

  const accessToken = decryptToken(connection.accessTokenEncrypted, key)
  const refreshToken = decryptToken(connection.refreshTokenEncrypted, key)

  if (connection.expiresAt.getTime() - now.getTime() > REFRESH_SKEW_MS) {
    return accessToken
  }

  const refreshed = await refreshAccessToken(config, refreshToken, fetchImpl)
  await deps.db
    .update(stravaConnections)
    .set({
      accessTokenEncrypted: encryptToken(refreshed.accessToken, key),
      refreshTokenEncrypted: encryptToken(refreshed.refreshToken, key),
      expiresAt: refreshed.expiresAt,
      lastError: null,
    })
    .where(eq(stravaConnections.id, connection.id))

  return refreshed.accessToken
}
