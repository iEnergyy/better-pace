import { athleteProfiles } from "@pacepilot/db/schema"
import { eq } from "drizzle-orm"
import { AccountSettings } from "@/components/account-settings"
import { StravaConnectionCard } from "@/components/strava-connection-card"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { getAthleteIdForUser, getStravaUiStatus } from "@/lib/strava/connection"

type SettingsPageProps = {
  searchParams: Promise<{ strava?: string; reason?: string }>
}

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const session = await requireSession()
  const params = await searchParams
  const profile = await db.query.athleteProfiles.findFirst({
    where: eq(athleteProfiles.userId, session.user.id),
  })

  const athleteId = await getAthleteIdForUser(session.user.id)
  const strava = athleteId
    ? await getStravaUiStatus(athleteId)
    : { connected: false, connection: null }

  const flash =
    params.strava === "connected"
      ? "connected"
      : params.strava === "error"
        ? "error"
        : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account and Strava connection.
        </p>
      </div>

      <StravaConnectionCard
        connected={strava.connected}
        stravaAthleteId={strava.connection?.stravaAthleteId ?? null}
        syncStatus={strava.connection?.syncStatus ?? null}
        scopes={strava.connection?.scopes ?? []}
        connectedAt={strava.connection?.connectedAt?.toISOString() ?? null}
        lastSyncAt={strava.connection?.lastSyncAt?.toISOString() ?? null}
        lastError={strava.connection?.lastError ?? null}
        importedCount={strava.connection?.importedCount ?? 0}
        syncProgress={strava.connection?.syncProgress ?? null}
        flash={flash}
        flashReason={params.reason ?? null}
      />

      <AccountSettings
        email={session.user.email}
        displayName={profile?.displayName ?? session.user.name}
        preferredUnits={profile?.preferredUnits ?? "metric"}
        deletedAt={profile?.deletedAt ?? null}
      />
    </div>
  )
}
