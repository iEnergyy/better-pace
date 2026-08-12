"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import {
  disconnectConnection,
  getAthleteIdForUser,
} from "@/lib/strava/connection"

export async function disconnectStrava() {
  const session = await requireSession()
  const athleteId = await getAthleteIdForUser(session.user.id, db)
  if (!athleteId) {
    return { error: "Athlete profile not found" }
  }

  await disconnectConnection(athleteId, { db })
  revalidatePath("/settings")
  revalidatePath("/")
  return { ok: true as const }
}
