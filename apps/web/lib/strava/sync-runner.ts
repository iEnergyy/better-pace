import type { AthleteId } from "@pacepilot/core"
import {
  type Database,
  stravaConnections,
  toStravaConnection,
  upsertActivity,
} from "@pacepilot/db"
import {
  getActivity,
  getStravaOAuthConfig,
  listAthleteActivities,
  needsActivityDetail,
  normalizeStravaActivity,
  requireTokenEncryptionKey,
  resolveAccessToken,
  StravaApiError,
  shouldThrottleStrava,
} from "@pacepilot/strava"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"

const PER_PAGE = 200
const RECENT_BUFFER_SECONDS = 60 * 60 * 24
const THROTTLE_SLEEP_MS = 5_000
const MAX_THROTTLE_RETRIES = 12

export type SyncRunResult = {
  ok: boolean
  imported: number
  error?: string
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function safeErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof StravaApiError) {
    return `Strava API error (${error.status})`
  }
  if (error instanceof Error) {
    return error.message
      .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
      .slice(0, 500)
  }
  return fallback
}

async function loadConnectedConnection(
  athleteId: AthleteId,
  database: Database = db
) {
  const row = await database.query.stravaConnections.findFirst({
    where: eq(stravaConnections.athleteId, athleteId),
  })
  if (!row || row.disconnectedAt != null) {
    return null
  }
  return { database, connection: toStravaConnection(row) }
}

async function getAccessTokenForAthlete(
  athleteId: AthleteId,
  database: Database = db
): Promise<string> {
  const loaded = await loadConnectedConnection(athleteId, database)
  if (!loaded) {
    throw new Error("Strava is not connected")
  }
  const { connection } = loaded
  const config = getStravaOAuthConfig()
  const encryptionKey = requireTokenEncryptionKey()

  return resolveAccessToken({
    accessTokenEncrypted: connection.accessTokenEncrypted,
    refreshTokenEncrypted: connection.refreshTokenEncrypted,
    expiresAt: connection.expiresAt,
    encryptionKey,
    config,
    onRefreshed: async (tokens) => {
      await database
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

async function setSyncStatus(
  athleteId: AthleteId,
  update: {
    syncStatus?: "idle" | "importing" | "synced" | "error"
    lastError?: string | null
    lastSyncAt?: Date | null
    syncProgress?: string | null
  },
  database: Database = db
) {
  const patch: {
    syncStatus?: "idle" | "importing" | "synced" | "error"
    lastError?: string | null
    lastSyncAt?: Date | null
    syncProgress?: string | null
  } = {}
  if (update.syncStatus !== undefined) patch.syncStatus = update.syncStatus
  if (update.lastError !== undefined) patch.lastError = update.lastError
  if (update.lastSyncAt !== undefined) patch.lastSyncAt = update.lastSyncAt
  if (update.syncProgress !== undefined) patch.syncProgress = update.syncProgress

  if (Object.keys(patch).length === 0) return

  await database
    .update(stravaConnections)
    .set(patch)
    .where(eq(stravaConnections.athleteId, athleteId))
}

async function importPage(options: {
  athleteId: AthleteId
  page: number
  after?: number
  database?: Database
}): Promise<{
  imported: number
  detailIds: string[]
  done: boolean
  throttled: boolean
}> {
  const database = options.database ?? db
  const accessToken = await getAccessTokenForAthlete(
    options.athleteId,
    database
  )
  const result = await listAthleteActivities(accessToken, {
    page: options.page,
    perPage: PER_PAGE,
    after: options.after,
  })

  if (result.shouldThrottle || shouldThrottleStrava(result.rateLimit)) {
    return { imported: 0, detailIds: [], done: false, throttled: true }
  }

  const detailIds: string[] = []
  for (const summary of result.activities) {
    const normalized = normalizeStravaActivity(summary, options.athleteId)
    await upsertActivity(database, normalized)
    if (needsActivityDetail(summary)) {
      detailIds.push(String(summary.id))
    }
  }

  return {
    imported: result.activities.length,
    detailIds,
    done: result.activities.length < PER_PAGE,
    throttled: false,
  }
}

async function fetchDetails(
  athleteId: AthleteId,
  detailIds: string[],
  database: Database = db
) {
  if (detailIds.length === 0) return

  await setSyncStatus(
    athleteId,
    {
      syncProgress: `Enriching ${detailIds.length} activities with detail…`,
    },
    database
  )

  let done = 0
  for (const externalId of detailIds) {
    try {
      const accessToken = await getAccessTokenForAthlete(athleteId, database)
      const detail = await getActivity(accessToken, externalId)
      if (detail.shouldThrottle || shouldThrottleStrava(detail.rateLimit)) {
        await sleep(THROTTLE_SLEEP_MS)
        const retry = await getActivity(accessToken, externalId)
        if (retry.shouldThrottle) continue
        const normalized = normalizeStravaActivity(retry.activity, athleteId)
        await upsertActivity(database, normalized)
      } else {
        const normalized = normalizeStravaActivity(detail.activity, athleteId)
        await upsertActivity(database, normalized)
      }
      done += 1
      if (done === 1 || done % 10 === 0 || done === detailIds.length) {
        await setSyncStatus(
          athleteId,
          {
            syncProgress: `Enriching details ${done}/${detailIds.length}…`,
          },
          database
        )
      }
    } catch (error) {
      console.warn("[strava] detail fetch skipped", {
        externalId,
        error: error instanceof Error ? error.message : "unknown",
      })
    }
  }
}

async function paginateImport(options: {
  athleteId: AthleteId
  after?: number
  database?: Database
}): Promise<{ imported: number; detailIds: string[] }> {
  const database = options.database ?? db
  let page = 1
  let total = 0
  const detailIds: string[] = []
  let throttleRetries = 0

  while (true) {
    await setSyncStatus(
      options.athleteId,
      {
        syncProgress:
          total === 0
            ? `Fetching page ${page} from Strava…`
            : `Imported ${total} activities · fetching page ${page}…`,
      },
      database
    )

    const pageResult = await importPage({
      athleteId: options.athleteId,
      page,
      after: options.after,
      database,
    })

    if (pageResult.throttled) {
      throttleRetries += 1
      if (throttleRetries > MAX_THROTTLE_RETRIES) {
        throw new Error("Strava rate limit persisted; try again later")
      }
      await setSyncStatus(
        options.athleteId,
        {
          syncProgress: `Rate limited by Strava — waiting, then retrying page ${page} (${total} imported so far)…`,
        },
        database
      )
      await sleep(THROTTLE_SLEEP_MS)
      continue
    }

    throttleRetries = 0
    total += pageResult.imported
    detailIds.push(...pageResult.detailIds)

    await setSyncStatus(
      options.athleteId,
      {
        syncProgress: pageResult.done
          ? `Imported ${total} activities · finishing up…`
          : `Imported ${total} activities · page ${page} done`,
      },
      database
    )

    if (pageResult.done) break
    page += 1
  }

  return { imported: total, detailIds }
}

/**
 * Full historical backfill — runs in-process (Next.js), no Inngest.
 */
export async function runHistoricalImport(
  athleteId: AthleteId,
  database: Database = db
): Promise<SyncRunResult> {
  await setSyncStatus(
    athleteId,
    {
      syncStatus: "importing",
      lastError: null,
      syncProgress: "Starting historical import…",
    },
    database
  )

  try {
    const { imported, detailIds } = await paginateImport({
      athleteId,
      database,
    })
    await fetchDetails(athleteId, detailIds, database)
    await setSyncStatus(
      athleteId,
      {
        syncStatus: "synced",
        lastError: null,
        lastSyncAt: new Date(),
        syncProgress: null,
      },
      database
    )
    return { ok: true, imported }
  } catch (error) {
    const message = safeErrorMessage(error, "Historical import failed")
    await setSyncStatus(
      athleteId,
      { syncStatus: "error", lastError: message, syncProgress: null },
      database
    )
    console.error("[strava] historical import failed", { athleteId, message })
    return { ok: false, imported: 0, error: message }
  }
}

/**
 * Incremental sync since lastSyncAt — runs in-process (Next.js), no Inngest.
 */
export async function runRecentSync(
  athleteId: AthleteId,
  database: Database = db
): Promise<SyncRunResult> {
  await setSyncStatus(
    athleteId,
    {
      syncStatus: "importing",
      lastError: null,
      syncProgress: "Starting update from Strava…",
    },
    database
  )

  try {
    const loaded = await loadConnectedConnection(athleteId, database)
    if (!loaded) {
      throw new Error("Strava is not connected")
    }

    const after = loaded.connection.lastSyncAt
      ? Math.floor(loaded.connection.lastSyncAt.getTime() / 1000) -
        RECENT_BUFFER_SECONDS
      : undefined

    const { imported, detailIds } = await paginateImport({
      athleteId,
      after,
      database,
    })
    await fetchDetails(athleteId, detailIds, database)
    await setSyncStatus(
      athleteId,
      {
        syncStatus: "synced",
        lastError: null,
        lastSyncAt: new Date(),
        syncProgress: null,
      },
      database
    )
    return { ok: true, imported }
  } catch (error) {
    const message = safeErrorMessage(error, "Recent sync failed")
    await setSyncStatus(
      athleteId,
      { syncStatus: "error", lastError: message, syncProgress: null },
      database
    )
    console.error("[strava] recent sync failed", { athleteId, message })
    return { ok: false, imported: 0, error: message }
  }
}
