"use server"

import { athleteProfiles, user } from "@pacepilot/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"

export async function updateDisplayName(formData: FormData) {
  const session = await requireSession()
  const displayName = String(formData.get("displayName") ?? "").trim()
  const preferredUnitsRaw = String(formData.get("preferredUnits") ?? "").trim()
  const preferredUnits =
    preferredUnitsRaw === "imperial" || preferredUnitsRaw === "metric"
      ? preferredUnitsRaw
      : null

  if (!displayName) {
    return { error: "Display name is required" }
  }

  const now = new Date()

  await db
    .update(athleteProfiles)
    .set({
      displayName,
      ...(preferredUnits ? { preferredUnits } : {}),
      updatedAt: now,
    })
    .where(eq(athleteProfiles.userId, session.user.id))

  await db
    .update(user)
    .set({
      name: displayName,
      updatedAt: now,
    })
    .where(eq(user.id, session.user.id))

  revalidatePath("/settings")
  revalidatePath("/")
  revalidatePath("/activities")
  revalidatePath("/insights")
  revalidatePath("/summaries/week")
  revalidatePath("/summaries/month")
  return { ok: true as const }
}

/**
 * Soft-delete stub (full wipe in 0.8): marks athlete profile deleted and
 * signs out. Auth user row remains so the same credentials can sign in again.
 */
export async function softDeleteAccount() {
  const session = await requireSession()
  const now = new Date()

  await db
    .update(athleteProfiles)
    .set({
      deletedAt: now,
      updatedAt: now,
    })
    .where(eq(athleteProfiles.userId, session.user.id))

  await auth.api.signOut({
    headers: await headers(),
  })

  return { ok: true as const }
}
