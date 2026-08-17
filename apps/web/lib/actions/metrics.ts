"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { recomputeAthleteMetrics } from "@/lib/metrics/recompute"
import { requireSession } from "@/lib/session"
import { getAthleteIdForUser } from "@/lib/strava/connection"

/**
 * Founder action: full metrics recompute without re-importing Strava.
 * Awaits completion so Insights can refresh with fresh numbers.
 */
export async function recomputeAllMetrics() {
  const session = await requireSession()
  const athleteId = await getAthleteIdForUser(session.user.id, db)
  if (!athleteId) {
    return { error: "Athlete profile not found" }
  }

  const result = await recomputeAthleteMetrics(athleteId, db, "full")
  if (!result.ok) {
    return { error: result.error }
  }

  revalidatePath("/insights")
  revalidatePath("/")
  return { ok: true as const, activityCount: result.activityCount }
}
