import type { StravaConnection } from "@pacepilot/core"
import { after } from "next/server"
import { db } from "@/lib/db"
import { endAthleteSync, tryBeginAthleteSync } from "@/lib/strava/sync-lock"
import { runHistoricalImport } from "@/lib/strava/sync-runner"

/**
 * Start historical import after the current response finishes (no Inngest).
 * Uses `after()` so the work survives OAuth redirects / short server actions.
 */
export function triggerHistoricalImport(connection: StravaConnection): void {
  const athleteId = connection.athleteId
  if (!tryBeginAthleteSync(athleteId)) {
    console.info("[strava] historical import already running", { athleteId })
    return
  }

  after(async () => {
    try {
      await runHistoricalImport(athleteId, db)
    } catch (error) {
      console.error("[strava] historical import crashed", {
        athleteId,
        error: error instanceof Error ? error.message : "unknown",
      })
    } finally {
      endAthleteSync(athleteId)
    }
  })
}
