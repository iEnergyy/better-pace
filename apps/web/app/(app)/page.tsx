import { Separator } from "@workspace/ui/components/separator"
import { EmptyState } from "@/components/empty-state"
import { SportCatalog } from "@/components/sport-catalog"
import { StravaSyncActions } from "@/components/strava-sync-actions"
import { requireSession } from "@/lib/session"
import { getAthleteIdForUser, getStravaUiStatus } from "@/lib/strava/connection"

export default async function Page() {
  const session = await requireSession()
  const athleteId = await getAthleteIdForUser(session.user.id)
  const strava = athleteId
    ? await getStravaUiStatus(athleteId)
    : { connected: false, connection: null }

  const importedCount = strava.connection?.importedCount ?? 0
  const syncStatus = strava.connection?.syncStatus ?? null

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <p className="text-primary text-sm font-medium tracking-wide uppercase">
          Foundation
        </p>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          PacePilot
        </h1>
        <p className="text-muted-foreground max-w-xl text-base leading-relaxed">
          Strava tells you what you did. PacePilot tells you what it means.
          Domain sports below come from{" "}
          <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
            @pacepilot/core
          </code>
          — not redefined in the UI.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Tracked sports</h2>
        <SportCatalog />
      </section>

      <Separator />

      {strava.connected ? (
        <section className="flex flex-col gap-4">
          <StravaSyncActions
            syncStatus={syncStatus}
            lastSyncAt={strava.connection?.lastSyncAt?.toISOString() ?? null}
            importedCount={importedCount}
            syncProgress={strava.connection?.syncProgress ?? null}
            showRetry={syncStatus === "error"}
          />
          {importedCount > 0 ? (
            <EmptyState
              title={`${importedCount} activities synced`}
              description="Browse your multi-sport timeline. Click Update after new Strava activities — sync is on-demand, not background."
              actionHref="/activities"
              actionLabel="View activities"
            />
          ) : (
            <EmptyState
              title={
                syncStatus === "importing"
                  ? "Importing from Strava"
                  : "Waiting for activities"
              }
              description={
                syncStatus === "importing"
                  ? (strava.connection?.syncProgress ??
                    "Historical import is running. This page refreshes while sync is in progress.")
                  : "Click Update to pull activities, or wait for the post-connect historical import to finish."
              }
              actionHref="/activities"
              actionLabel="Open activities"
            />
          )}
        </section>
      ) : (
        <EmptyState
          title="No activities yet"
          description="Connect Strava to import your training history. Tokens stay encrypted server-side."
          actionHref="/api/strava/connect"
          actionLabel="Connect Strava"
        />
      )}
    </div>
  )
}
