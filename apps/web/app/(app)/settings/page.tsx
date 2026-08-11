import { athleteProfiles } from "@pacepilot/db/schema"
import { eq } from "drizzle-orm"
import { AccountSettings } from "@/components/account-settings"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"

export default async function SettingsPage() {
  const session = await requireSession()
  const profile = await db.query.athleteProfiles.findFirst({
    where: eq(athleteProfiles.userId, session.user.id),
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account. Strava connection arrives in phase 0.3.
        </p>
      </div>
      <AccountSettings
        email={session.user.email}
        displayName={profile?.displayName ?? session.user.name}
        deletedAt={profile?.deletedAt ?? null}
      />
    </div>
  )
}
