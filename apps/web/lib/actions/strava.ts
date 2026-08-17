"use server"

import { isStravaConnected } from "@pacepilot/core"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import {
  disconnectConnection,
  findConnectionForAthlete,
  getAthleteIdForUser,
  markConnectionSyncStatus,
} from "@/lib/strava/connection"
import { triggerHistoricalImport } from "@/lib/strava/import-trigger"
import { triggerRecentSync } from "@/lib/strava/sync-trigger"

function revalidateStravaPaths() {
  revalidatePath("/settings")
  revalidatePath("/")
  revalidatePath("/activities")
}

export async function disconnectStrava() {
  const session = await requireSession()
  const athleteId = await getAthleteIdForUser(session.user.id, db)
  if (!athleteId) {
    return { error: "Athlete profile not found" }
  }

  await disconnectConnection(athleteId, { db })
  revalidateStravaPaths()
  return { ok: true as const }
}

/**
 * On-demand incremental sync via Next.js (no Inngest).
 */
export async function updateStravaActivities() {
  const session = await requireSession()
  const athleteId = await getAthleteIdForUser(session.user.id, db)
  if (!athleteId) {
    return { error: "Athlete profile not found" }
  }

  const connection = await findConnectionForAthlete(athleteId, db)
  if (!(connection && isStravaConnected(connection))) {
    return { error: "Strava is not connected" }
  }

  await markConnectionSyncStatus(athleteId, {
    syncStatus: "importing",
    lastError: null,
    syncProgress: "Starting update from Strava…",
  })
  triggerRecentSync(connection)
  revalidateStravaPaths()
  return { ok: true as const }
}

/**
 * Retry historical import via Next.js (no Inngest).
 */
export async function retryStravaImport() {
  const session = await requireSession()
  const athleteId = await getAthleteIdForUser(session.user.id, db)
  if (!athleteId) {
    return { error: "Athlete profile not found" }
  }

  const connection = await findConnectionForAthlete(athleteId, db)
  if (!(connection && isStravaConnected(connection))) {
    return { error: "Strava is not connected" }
  }

  await markConnectionSyncStatus(athleteId, {
    syncStatus: "importing",
    lastError: null,
    syncProgress: "Starting historical import…",
  })
  triggerHistoricalImport(connection)
  revalidateStravaPaths()
  return { ok: true as const }
}
