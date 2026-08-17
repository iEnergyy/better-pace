import type { AthleteId } from "@pacepilot/core"
import { computeMetricsBundle } from "@pacepilot/core"
import {
  type Database,
  listAllActivitiesForAthlete,
  replaceActivityMetrics,
  replacePersonalRecords,
  saveAthleteMetricRollup,
  upsertTrainingSummaries,
} from "@pacepilot/db"
import { athleteProfiles } from "@pacepilot/db/schema"
import { eq } from "drizzle-orm"

export type RecomputeMode = "full" | "incremental"

/**
 * Recompute deterministic metrics for an athlete.
 * Both modes load full history for correct rolling HR/pace windows;
 * founder-scale activity counts make a true partial window unnecessary.
 */
export async function recomputeAthleteMetrics(
  athleteId: AthleteId,
  database: Database,
  mode: RecomputeMode = "full"
): Promise<{ ok: true; activityCount: number } | { ok: false; error: string }> {
  try {
    const profile = await database.query.athleteProfiles.findFirst({
      where: eq(athleteProfiles.id, athleteId),
    })
    const timeZone = profile?.timezone ?? "UTC"
    const activities = await listAllActivitiesForAthlete(database, athleteId)
    const bundle = computeMetricsBundle(athleteId, activities, { timeZone })

    await replaceActivityMetrics(
      database,
      athleteId,
      bundle.activityMetrics,
      "full"
    )
    await upsertTrainingSummaries(
      database,
      bundle.summaries,
      "full",
      athleteId
    )
    await replacePersonalRecords(database, athleteId, bundle.personalRecords)
    await saveAthleteMetricRollup(database, athleteId, bundle.rollup)

    console.info("[metrics] recompute complete", {
      athleteId,
      mode,
      activityCount: activities.length,
      summaries: bundle.summaries.length,
      prs: bundle.personalRecords.length,
    })

    return { ok: true, activityCount: activities.length }
  } catch (error) {
    const message =
      error instanceof Error ? error.message.slice(0, 500) : "Recompute failed"
    console.error("[metrics] recompute failed", { athleteId, mode, message })
    return { ok: false, error: message }
  }
}
