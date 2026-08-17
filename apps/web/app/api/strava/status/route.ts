import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { getAthleteIdForUser, getStravaUiStatus } from "@/lib/strava/connection"

export const dynamic = "force-dynamic"

/**
 * Live Strava sync status for client polling (no RSC cache).
 */
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const athleteId = await getAthleteIdForUser(session.user.id, db)
  if (!athleteId) {
    return NextResponse.json({
      connected: false,
      syncStatus: null,
      syncProgress: null,
      importedCount: 0,
      lastSyncAt: null,
      lastError: null,
    })
  }

  const strava = await getStravaUiStatus(athleteId, db)

  return NextResponse.json(
    {
      connected: strava.connected,
      syncStatus: strava.connection?.syncStatus ?? null,
      syncProgress: strava.connection?.syncProgress ?? null,
      importedCount: strava.connection?.importedCount ?? 0,
      lastSyncAt: strava.connection?.lastSyncAt?.toISOString() ?? null,
      lastError: strava.connection?.lastError ?? null,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  )
}
