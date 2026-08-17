import { listActivitiesForAthlete } from "@pacepilot/db"
import { Badge } from "@workspace/ui/components/badge"
import { EmptyState } from "@/components/empty-state"
import { StravaSyncActions } from "@/components/strava-sync-actions"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { getAthleteIdForUser, getStravaUiStatus } from "@/lib/strava/connection"

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatDistance(meters: number | null): string | null {
  if (meters == null) return null
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`
  return `${Math.round(meters)} m`
}

function formatPace(secondsPerKm: number | null): string | null {
  if (secondsPerKm == null || !Number.isFinite(secondsPerKm)) return null
  const minutes = Math.floor(secondsPerKm / 60)
  const seconds = Math.round(secondsPerKm % 60)
  return `${minutes}:${String(seconds).padStart(2, "0")}/km`
}

export default async function ActivitiesPage() {
  const session = await requireSession()
  const athleteId = await getAthleteIdForUser(session.user.id)
  const strava = athleteId
    ? await getStravaUiStatus(athleteId)
    : { connected: false, connection: null }

  const activities = athleteId
    ? await listActivitiesForAthlete(db, { athleteId, limit: 100 })
    : []

  const importedCount = strava.connection?.importedCount ?? activities.length
  const syncStatus = strava.connection?.syncStatus ?? null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Activities</h1>
        {strava.connected ? (
          <StravaSyncActions
            syncStatus={syncStatus}
            lastSyncAt={strava.connection?.lastSyncAt?.toISOString() ?? null}
            importedCount={importedCount}
            syncProgress={strava.connection?.syncProgress ?? null}
            showRetry={syncStatus === "error"}
          />
        ) : null}
      </div>

      {!strava.connected ? (
        <EmptyState
          title="Connect Strava to see activities"
          description="Authorize read access to import your training history. Sync runs when you click Update."
          actionHref="/api/strava/connect"
          actionLabel="Connect Strava"
        />
      ) : activities.length === 0 ? (
        <EmptyState
          title={
            syncStatus === "importing"
              ? "Import in progress"
              : syncStatus === "error"
                ? "Import failed"
                : "No activities yet"
          }
          description={
            syncStatus === "importing"
              ? (strava.connection?.syncProgress ??
                "Pulling your Strava history. This page refreshes automatically.")
              : syncStatus === "error"
                ? (strava.connection?.lastError ??
                  "Something went wrong. Use Retry import to try again.")
                : "Click Update on Settings or above to pull recent activities, or wait for the historical import after connect."
          }
        />
      ) : (
        <ul className="divide-border flex flex-col divide-y">
          {activities.map((activity) => {
            const distance = formatDistance(activity.distanceMeters)
            const pace = formatPace(activity.averagePaceSecondsPerKm)
            return (
              <li
                key={activity.id}
                className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {activity.sport}
                    </Badge>
                    <span className="truncate font-medium">
                      {activity.name}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {activity.startedAt.toLocaleString()}
                  </p>
                </div>
                <div className="text-muted-foreground flex flex-wrap gap-3 text-sm tabular-nums">
                  <span>{formatDuration(activity.durationSeconds)}</span>
                  {distance ? <span>{distance}</span> : null}
                  {pace ? <span>{pace}</span> : null}
                  {activity.averageHeartRate != null ? (
                    <span>{activity.averageHeartRate} bpm</span>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
