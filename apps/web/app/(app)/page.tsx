import type { AthleteId } from "@pacepilot/core"
import {
  addDaysYmd,
  generateInsightCards,
  greetingInTimeZone,
  startOfIsoWeekDate,
  zonedYmd,
} from "@pacepilot/core"
import {
  getWeekSummary,
  listActivitiesWithMetricsForAthlete,
  listPersonalRecordsForAthlete,
} from "@pacepilot/db"
import { athleteProfiles } from "@pacepilot/db/schema"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import { eq } from "drizzle-orm"
import Link from "next/link"
import { EmptyState } from "@/components/empty-state"
import { InsightCards } from "@/components/insight-cards"
import { RecomputeMetricsButton } from "@/components/recompute-metrics-button"
import {
  PadelIntelligence,
  RunningIntelligence,
  sportsFromActivities,
} from "@/components/sport-intelligence"
import { StravaSyncActions } from "@/components/strava-sync-actions"
import { db } from "@/lib/db"
import { formatDistance, formatDuration } from "@/lib/format"
import { requireSession } from "@/lib/session"
import { getAthleteIdForUser, getStravaUiStatus } from "@/lib/strava/connection"

export const dynamic = "force-dynamic"

function weekEndFromStart(weekStart: Date): Date {
  return new Date(weekStart.getTime() + 7 * 86_400_000)
}

function priorWeekStart(weekStart: Date, timeZone: string): Date {
  const ymd = zonedYmd(weekStart, timeZone)
  const prior = addDaysYmd(ymd, -7)
  return new Date(Date.UTC(prior.year, prior.month - 1, prior.day))
}

export default async function Page() {
  const session = await requireSession()
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

  const timeZone = profile?.timezone ?? "UTC"
  const units = profile?.preferredUnits ?? "metric"
  const displayName = profile?.displayName ?? session.user.name
  const greeting = greetingInTimeZone(new Date(), timeZone)
  const weekStart = startOfIsoWeekDate(new Date(), timeZone)
  const lastWeekStart = priorWeekStart(weekStart, timeZone)
  const weekEnd = weekEndFromStart(weekStart)

  const [thisWeek, lastWeek, recent, records] = athleteId
    ? await Promise.all([
        getWeekSummary(db, athleteId, weekStart),
        getWeekSummary(db, athleteId, lastWeekStart),
        listActivitiesWithMetricsForAthlete(db, {
          athleteId,
          limit: 5,
        }),
        listPersonalRecordsForAthlete(db, athleteId),
      ])
    : [null, null, [], []]

  const weekActivities =
    athleteId && thisWeek
      ? await listActivitiesWithMetricsForAthlete(db, {
          athleteId,
          from: weekStart,
          to: weekEnd,
          limit: 100,
        })
      : []

  const rollup =
    (profile?.metricsRollup as import("@pacepilot/core").AthleteMetricRollup | null) ??
    null

  const cards = generateInsightCards({
    thisWeek,
    lastWeek,
    rollup,
    recentPrs: records,
    weekStart,
    weekEnd,
  })

  const importedCount = strava.connection?.importedCount ?? 0
  const syncStatus = strava.connection?.syncStatus ?? null
  const sports = thisWeek
    ? thisWeek.bySport.map((b) => b.sport)
    : sportsFromActivities(weekActivities)

  const runs = weekActivities.filter((a) => a.sport === "running")
  const padel = weekActivities.filter((a) => a.sport === "padel")

  if (!strava.connected) {
    return (
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            {greeting}, {displayName}
          </h1>
          <p className="text-muted-foreground max-w-xl text-base">
            Connect Strava to see how your week is shaping up across sports.
          </p>
        </section>
        <EmptyState
          title="No activities yet"
          description="Authorize read access to import your training history."
          actionHref="/api/strava/connect"
          actionLabel="Connect Strava"
        />
      </div>
    )
  }

  if (!(rollup || thisWeek) && importedCount > 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          {greeting}, {displayName}
        </h1>
        <StravaSyncActions
          syncStatus={syncStatus}
          lastSyncAt={strava.connection?.lastSyncAt?.toISOString() ?? null}
          importedCount={importedCount}
          syncProgress={strava.connection?.syncProgress ?? null}
          showRetry={syncStatus === "error"}
        />
        <EmptyState
          title="Metrics not computed yet"
          description="Recompute metrics to unlock your week snapshot and insight cards."
        />
        <RecomputeMetricsButton />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          {greeting}, {displayName}
        </h1>
        <p className="text-muted-foreground max-w-xl text-sm">
          Deterministic view of this week — no AI. Load is an internal score, not
          a medical measurement.
        </p>
        <StravaSyncActions
          syncStatus={syncStatus}
          lastSyncAt={strava.connection?.lastSyncAt?.toISOString() ?? null}
          importedCount={importedCount}
          syncProgress={strava.connection?.syncProgress ?? null}
          showRetry={syncStatus === "error"}
        />
      </section>

      {thisWeek ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">This week</h2>
          <p className="text-sm leading-relaxed">
            {thisWeek.sessionCount} sessions ·{" "}
            {formatDuration(thisWeek.totalDurationSeconds)} ·{" "}
            {formatDistance(thisWeek.totalDistanceMeters, units)} · load{" "}
            {thisWeek.totalLoad.toFixed(0)}
            {rollup ? ` · consistency ${rollup.consistencyScore}%` : null}
          </p>
          {rollup ? (
            <p className="text-muted-foreground text-sm">
              Trends — fitness {rollup.fitnessTrend.direction} · recovery{" "}
              {rollup.recoveryTrend.direction} · performance{" "}
              {rollup.performanceTrend.direction}
              {rollup.currentStreakDays > 0
                ? ` · streak ${rollup.currentStreakDays}d`
                : null}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {sports.map((sport) => (
              <Badge key={sport} variant="secondary">
                {sport}
              </Badge>
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          title="Waiting for this week’s summary"
          description="Import or update activities, then recompute if needed."
          actionHref="/activities"
          actionLabel="View activities"
        />
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Insights</h2>
        <InsightCards cards={cards} />
      </section>

      {(runs.length > 0 || padel.length > 0) && (
        <>
          <Separator />
          <div className="flex flex-col gap-6">
            <RunningIntelligence runs={runs} units={units} />
            <PadelIntelligence sessions={padel} />
          </div>
        </>
      )}

      <Separator />

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-medium">Recent activities</h2>
          <Link
            href="/activities"
            className="text-primary text-sm font-medium underline-offset-4 hover:underline"
          >
            Full timeline
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activities yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/activities/${a.id}`}
                  className="hover:bg-muted/50 flex flex-wrap items-center gap-2 rounded-md px-1 py-2 text-sm"
                >
                  <Badge variant="outline">{a.sport}</Badge>
                  <span className="font-medium">{a.name}</span>
                  <span className="text-muted-foreground">
                    {a.startedAt.toLocaleString()} ·{" "}
                    {formatDuration(a.durationSeconds)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-muted-foreground flex flex-wrap gap-3 text-sm">
        <Link href="/summaries/week" className="underline-offset-4 hover:underline">
          Week summary
        </Link>
        <Link
          href="/summaries/month"
          className="underline-offset-4 hover:underline"
        >
          Month summary
        </Link>
        <Link href="/insights" className="underline-offset-4 hover:underline">
          Insights &amp; recompute
        </Link>
      </p>
    </div>
  )
}
