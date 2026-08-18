import type {
  AthleteId,
  IntensityLabel,
  PreferredUnits,
  Sport,
} from "@pacepilot/core"
import { INTENSITY_LABELS, isSport } from "@pacepilot/core"
import { listActivitiesWithMetricsForAthlete } from "@pacepilot/db"
import { athleteProfiles } from "@pacepilot/db/schema"
import { Badge } from "@workspace/ui/components/badge"
import { eq } from "drizzle-orm"
import Link from "next/link"
import { Suspense } from "react"
import { ActivityFilters } from "@/components/activity-filters"
import { EmptyState } from "@/components/empty-state"
import { StravaSyncActions } from "@/components/strava-sync-actions"
import { db } from "@/lib/db"
import { formatDistance, formatDuration, formatPace } from "@/lib/format"
import { requireSession } from "@/lib/session"
import { getAthleteIdForUser, getStravaUiStatus } from "@/lib/strava/connection"

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

function parseFilters(
  raw: Record<string, string | string[] | undefined>,
  athleteId: AthleteId
) {
  const sportRaw = first(raw.sport)
  const intensityRaw = first(raw.intensity)
  const fromRaw = first(raw.from)
  const toRaw = first(raw.to)
  const minRaw = first(raw.minDuration)

  const sport =
    sportRaw && sportRaw !== "all" && isSport(sportRaw)
      ? (sportRaw as Sport)
      : undefined
  const intensity =
    intensityRaw &&
    intensityRaw !== "all" &&
    (INTENSITY_LABELS as readonly string[]).includes(intensityRaw)
      ? (intensityRaw as IntensityLabel)
      : undefined

  return {
    athleteId,
    limit: 100,
    sport,
    intensity,
    from: fromRaw ? new Date(`${fromRaw}T00:00:00.000Z`) : undefined,
    to: toRaw ? new Date(`${toRaw}T23:59:59.999Z`) : undefined,
    minDurationSeconds: minRaw ? Number(minRaw) * 60 : undefined,
  }
}

export default async function ActivitiesPage({ searchParams }: PageProps) {
  const session = await requireSession()
  const raw = await searchParams
  const athleteId = (await getAthleteIdForUser(
    session.user.id
  )) as AthleteId | null
  const strava = athleteId
    ? await getStravaUiStatus(athleteId)
    : { connected: false, connection: null }

  const profile = athleteId
    ? await db.query.athleteProfiles.findFirst({
        where: eq(athleteProfiles.id, athleteId),
      })
    : null
  const units: PreferredUnits = profile?.preferredUnits ?? "metric"

  const activities =
    athleteId != null
      ? await listActivitiesWithMetricsForAthlete(
          db,
          parseFilters(raw, athleteId)
        )
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

      {strava.connected ? (
        <Suspense fallback={null}>
          <ActivityFilters />
        </Suspense>
      ) : null}

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
                : "No matching activities"
          }
          description={
            syncStatus === "importing"
              ? (strava.connection?.syncProgress ??
                "Pulling your Strava history.")
              : syncStatus === "error"
                ? (strava.connection?.lastError ??
                  "Something went wrong. Use Retry import.")
                : "Try clearing filters or click Update to pull recent activities."
          }
        />
      ) : (
        <ul className="divide-border flex flex-col divide-y">
          {activities.map((activity) => {
            const distance = formatDistance(activity.distanceMeters, units)
            const pace = formatPace(activity.averagePaceSecondsPerKm, units)
            return (
              <li key={activity.id} className="py-4">
                <Link
                  href={`/activities/${activity.id}`}
                  className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {activity.sport}
                      </Badge>
                      {activity.intensity ? (
                        <Badge variant="secondary">{activity.intensity}</Badge>
                      ) : null}
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
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
