import {
  type AthleteId,
  isStravaConnected,
  type StravaConnection,
  type StravaConnectionPublic,
  toPublicStravaConnection,
} from "@pacepilot/core"
import {
  athleteProfiles,
  countActivitiesForAthlete,
  type Database,
  stravaConnections,
  toStravaConnection,
} from "@pacepilot/db"
import {
  deauthorize,
  decryptToken,
  encryptToken,
  exchangeAuthorizationCode,
  getStravaOAuthConfig,
  hasRequiredScopes,
  parseGrantedScopes,
  requireTokenEncryptionKey,
  resolveAccessToken,
  StravaOAuthError,
} from "@pacepilot/strava"
import { and, eq, isNull } from "drizzle-orm"
import { db } from "@/lib/db"

const CLEARED_TOKEN = ""

export type ConnectionServiceDeps = {
  db: Database
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
  database: Database = db
): Promise<AthleteId | null> {
  const profile = await database.query.athleteProfiles.findFirst({
    where: eq(athleteProfiles.userId, userId),
  })
  return (profile?.id as AthleteId | undefined) ?? null
}

export async function findConnectionForAthlete(
  athleteId: AthleteId,
  database: Database = db
): Promise<StravaConnection | null> {
  const row = await database.query.stravaConnections.findFirst({
    where: eq(stravaConnections.athleteId, athleteId),
  })
  return row ? toStravaConnection(row) : null
}

export async function getConnectionStatus(
  athleteId: AthleteId,
  database: Database = db
): Promise<StravaConnectionPublic | null> {
  const connection = await findConnectionForAthlete(athleteId, database)
  if (!connection) return null
  const importedCount = await countActivitiesForAthlete(database, athleteId)
  return toPublicStravaConnection(connection, { importedCount })
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
  database: Database = db
): Promise<StravaUiStatus> {
  const connection = await findConnectionForAthlete(athleteId, database)
  if (!connection) {
    return { connected: false, connection: null }
  }
  const importedCount = await countActivitiesForAthlete(database, athleteId)
  const publicConnection = toPublicStravaConnection(connection, {
    importedCount,
  })
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
        syncProgress: "Starting historical import…",
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
        syncProgress: "Starting historical import…",
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
  return toPublicStravaConnection(connection, { importedCount: 0 })
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
  const importedCount = await countActivitiesForAthlete(deps.db, athleteId)
  return {
    connected: false,
    connection: toPublicStravaConnection(
      {
        ...next,
        disconnectedAt: next.disconnectedAt ?? now,
        accessTokenEncrypted: CLEARED_TOKEN,
        refreshTokenEncrypted: CLEARED_TOKEN,
      },
      { importedCount }
    ),
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
  const connection = await findConnectionForAthlete(athleteId, deps.db)

  if (!(connection && isStravaConnected(connection))) {
    throw new StravaOAuthError("Strava is not connected", 401)
  }
  if (!(connection.accessTokenEncrypted && connection.refreshTokenEncrypted)) {
    throw new StravaOAuthError("Strava tokens are missing", 401)
  }

  return resolveAccessToken({
    accessTokenEncrypted: connection.accessTokenEncrypted,
    refreshTokenEncrypted: connection.refreshTokenEncrypted,
    expiresAt: connection.expiresAt,
    encryptionKey: getKey(deps),
    config,
    now: deps.now?.(),
    fetchImpl: deps.fetchImpl,
    onRefreshed: async (tokens) => {
      await deps.db
        .update(stravaConnections)
        .set({
          accessTokenEncrypted: tokens.accessTokenEncrypted,
          refreshTokenEncrypted: tokens.refreshTokenEncrypted,
          expiresAt: tokens.expiresAt,
          lastError: null,
        })
        .where(eq(stravaConnections.id, connection.id))
    },
  })
}

export async function markConnectionSyncStatus(
  athleteId: AthleteId,
  update: {
    syncStatus: "idle" | "importing" | "synced" | "error"
    lastError?: string | null
    lastSyncAt?: Date | null
    syncProgress?: string | null
  },
  database: Database = db
): Promise<void> {
  const patch: {
    syncStatus: typeof update.syncStatus
    lastError?: string | null
    lastSyncAt?: Date | null
    syncProgress?: string | null
  } = { syncStatus: update.syncStatus }
  if (update.lastError !== undefined) patch.lastError = update.lastError
  if (update.lastSyncAt !== undefined) patch.lastSyncAt = update.lastSyncAt
  if (update.syncProgress !== undefined) patch.syncProgress = update.syncProgress

  await database
    .update(stravaConnections)
    .set(patch)
    .where(eq(stravaConnections.athleteId, athleteId))
}
