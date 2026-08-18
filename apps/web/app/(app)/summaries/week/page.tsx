import type { AthleteId, PreferredUnits } from "@pacepilot/core"
import {
  generateInsightCards,
  zonedYmd,
} from "@pacepilot/core"
import {
  getWeekSummary,
  listActivitiesWithMetricsForAthlete,
  listPersonalRecordsForAthlete,
} from "@pacepilot/db"
import { athleteProfiles } from "@pacepilot/db/schema"
import { Badge } from "@workspace/ui/components/badge"
import { eq } from "drizzle-orm"
import { EmptyState } from "@/components/empty-state"
import { InsightCards } from "@/components/insight-cards"
import {
  PadelIntelligence,
  RunningIntelligence,
} from "@/components/sport-intelligence"
import { SummaryPeriodFilter } from "@/components/summary-period-filter"
import { db } from "@/lib/db"
import { formatDistance, formatDuration } from "@/lib/format"
import { requireSession } from "@/lib/session"
import { getAthleteIdForUser } from "@/lib/strava/connection"
import {
  formatWeekRangeLabel,
  formatYmd,
  resolveWeekStart,
  shiftWeekStart,
  weekHref,
} from "@/lib/summary-period"

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<{ week?: string; offset?: string }>
}

export default async function WeekSummaryPage({ searchParams }: PageProps) {
  const session = await requireSession()
  const params = await searchParams
  const athleteId = (await getAthleteIdForUser(
    session.user.id
  )) as AthleteId | null
  if (!athleteId) {
    return (
      <EmptyState
        title="No athlete profile"
        description="Finish account setup first."
      />
    )
  }

  const profile = await db.query.athleteProfiles.findFirst({
    where: eq(athleteProfiles.id, athleteId),
  })
  const timeZone = profile?.timezone ?? "UTC"
  const units: PreferredUnits = profile?.preferredUnits ?? "metric"
  const now = new Date()
  const thisWeekStart = resolveWeekStart({ timeZone, now })
  const lastWeekStart = shiftWeekStart(thisWeekStart, -1)
  const weekStart = resolveWeekStart({
    timeZone,
    week: params.week,
    offset: params.offset,
    now,
  })
  const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000)
  const priorWeekStart = shiftWeekStart(weekStart, -1)
  const weekKey = formatYmd(zonedYmd(weekStart, "UTC"))
  const isThisPeriod = weekKey === formatYmd(zonedYmd(thisWeekStart, "UTC"))
  const isLastPeriod = weekKey === formatYmd(zonedYmd(lastWeekStart, "UTC"))

  const [week, lastWeek, records, weekActivities] = await Promise.all([
    getWeekSummary(db, athleteId, weekStart),
    getWeekSummary(db, athleteId, priorWeekStart),
    listPersonalRecordsForAthlete(db, athleteId),
    listActivitiesWithMetricsForAthlete(db, {
      athleteId,
      from: weekStart,
      to: weekEnd,
      limit: 200,
    }),
  ])

  const rollup =
    (profile?.metricsRollup as import("@pacepilot/core").AthleteMetricRollup | null) ??
    null
  const cards = generateInsightCards({
    thisWeek: week,
    lastWeek,
    rollup,
    recentPrs: records,
    weekStart,
    weekEnd,
  })

  const runs = weekActivities.filter((a) => a.sport === "running")
  const padel = weekActivities.filter((a) => a.sport === "padel")

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Week summary
          </h1>
          <p className="text-muted-foreground text-sm">
            Training load, intensity, and sport breakdown for one ISO week.
          </p>
        </div>
        <SummaryPeriodFilter
          mode="week"
          periodKey={weekKey}
          label={formatWeekRangeLabel(weekStart)}
          prevHref={weekHref(shiftWeekStart(weekStart, -1))}
          nextHref={weekHref(shiftWeekStart(weekStart, 1))}
          thisPeriodHref={weekHref(thisWeekStart)}
          lastPeriodHref={weekHref(lastWeekStart)}
          isThisPeriod={isThisPeriod}
          isLastPeriod={isLastPeriod}
        />
      </div>

      {!week ? (
        <EmptyState
          title="No summary for this week"
          description="Recompute metrics after syncing activities."
          actionHref="/insights"
          actionLabel="Insights & recompute"
        />
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <p className="text-sm">
              {week.sessionCount} sessions ·{" "}
              {formatDuration(week.totalDurationSeconds)} ·{" "}
              {formatDistance(week.totalDistanceMeters, units)} · load{" "}
              {week.totalLoad.toFixed(0)}
            </p>
            <p className="text-muted-foreground text-sm">
              Intensity — easy {week.intensityCounts.easy}, moderate{" "}
              {week.intensityCounts.moderate}, hard {week.intensityCounts.hard},
              unknown {week.intensityCounts.unknown}
              {week.highIntensityCluster ? " · cluster warning" : null}
            </p>
            <ul className="flex flex-col gap-1 text-sm">
              {week.bySport.map((b) => (
                <li key={b.sport} className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{b.sport}</Badge>
                  <span>
                    {b.sessionCount}× · {formatDuration(b.durationSeconds)}
                    {b.distanceMeters > 0
                      ? ` · ${formatDistance(b.distanceMeters, units)}`
                      : null}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">Insight cards</h2>
            <InsightCards cards={cards} />
          </section>

          <RunningIntelligence runs={runs} units={units} />
          <PadelIntelligence sessions={padel} />
        </>
      )}
    </div>
  )
}
