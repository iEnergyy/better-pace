import type { AthleteId, PreferredUnits } from "@pacepilot/core"
import { getTrainingSummary } from "@pacepilot/db"
import { athleteProfiles } from "@pacepilot/db/schema"
import { Badge } from "@workspace/ui/components/badge"
import { eq } from "drizzle-orm"
import { EmptyState } from "@/components/empty-state"
import { SummaryPeriodFilter } from "@/components/summary-period-filter"
import { db } from "@/lib/db"
import { formatDistance, formatDuration } from "@/lib/format"
import { requireSession } from "@/lib/session"
import { getAthleteIdForUser } from "@/lib/strava/connection"
import {
  formatMonthLabel,
  monthHref,
  resolveMonthStart,
  shiftMonthStart,
} from "@/lib/summary-period"

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<{ month?: string; offset?: string }>
}

export default async function MonthSummaryPage({ searchParams }: PageProps) {
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
  const thisMonthStart = resolveMonthStart({ timeZone, now })
  const lastMonthStart = shiftMonthStart(thisMonthStart, -1)
  const monthStart = resolveMonthStart({
    timeZone,
    month: params.month,
    offset: params.offset,
    now,
  })
  const periodKey = `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, "0")}`
  const thisKey = `${thisMonthStart.getUTCFullYear()}-${String(thisMonthStart.getUTCMonth() + 1).padStart(2, "0")}`
  const lastKey = `${lastMonthStart.getUTCFullYear()}-${String(lastMonthStart.getUTCMonth() + 1).padStart(2, "0")}`
  const month = await getTrainingSummary(db, athleteId, "month", monthStart)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Month summary
          </h1>
          <p className="text-muted-foreground text-sm">
            Calendar-month totals across sports — pick a month or jump with the
            date control.
          </p>
        </div>
        <SummaryPeriodFilter
          mode="month"
          periodKey={periodKey}
          label={formatMonthLabel(monthStart)}
          prevHref={monthHref(shiftMonthStart(monthStart, -1))}
          nextHref={monthHref(shiftMonthStart(monthStart, 1))}
          thisPeriodHref={monthHref(thisMonthStart)}
          lastPeriodHref={monthHref(lastMonthStart)}
          isThisPeriod={periodKey === thisKey}
          isLastPeriod={periodKey === lastKey}
        />
      </div>

      {!month ? (
        <EmptyState
          title="No summary for this month"
          description="Recompute metrics after syncing activities."
          actionHref="/insights"
          actionLabel="Insights & recompute"
        />
      ) : (
        <section className="flex flex-col gap-3">
          <p className="text-sm">
            {month.sessionCount} sessions ·{" "}
            {formatDuration(month.totalDurationSeconds)} ·{" "}
            {formatDistance(month.totalDistanceMeters, units)} · load{" "}
            {month.totalLoad.toFixed(0)}
          </p>
          <p className="text-muted-foreground text-sm">
            Intensity — easy {month.intensityCounts.easy}, moderate{" "}
            {month.intensityCounts.moderate}, hard {month.intensityCounts.hard},
            unknown {month.intensityCounts.unknown}
          </p>
          <ul className="flex flex-col gap-1 text-sm">
            {month.bySport.map((b) => (
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
      )}
    </div>
  )
}
