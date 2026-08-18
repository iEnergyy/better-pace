import type { StravaConnection } from "@pacepilot/core"
import { after } from "next/server"
import { db } from "@/lib/db"
import { endAthleteSync, tryBeginAthleteSync } from "@/lib/strava/sync-lock"
import { runRecentSync } from "@/lib/strava/sync-runner"

/**
 * Start on-demand recent sync after the current response finishes (no Inngest).
 */
export function triggerRecentSync(connection: StravaConnection): void {
  const athleteId = connection.athleteId
  if (!tryBeginAthleteSync(athleteId)) {
    console.info("[strava] recent sync skipped; sync already running", {
      athleteId,
    })
    return
  }

  after(async () => {
    try {
      await runRecentSync(athleteId, db)
    } catch (error) {
      console.error("[strava] recent sync crashed", {
        athleteId,
        error: error instanceof Error ? error.message : "unknown",
      })
    } finally {
      endAthleteSync(athleteId)
    }
  })
}
