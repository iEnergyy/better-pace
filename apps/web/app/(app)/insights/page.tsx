import type { AthleteId, PersonalRecord, PreferredUnits } from "@pacepilot/core"
import { startOfIsoWeekDate } from "@pacepilot/core"
import { athleteProfiles, getAthleteInsightsBundle } from "@pacepilot/db"
import { Badge } from "@workspace/ui/components/badge"
import { eq } from "drizzle-orm"
import Link from "next/link"
import { EmptyState } from "@/components/empty-state"
import { RecomputeMetricsButton } from "@/components/recompute-metrics-button"
import { db } from "@/lib/db"
import { formatDistance, formatDuration } from "@/lib/format"
import { requireSession } from "@/lib/session"
import { getAthleteIdForUser } from "@/lib/strava/connection"

export const dynamic = "force-dynamic"

function formatPrValue(pr: PersonalRecord, units: PreferredUnits): string {
  switch (pr.unit) {
    case "meters":
      return formatDistance(pr.value, units) ?? String(pr.value)
    case "seconds": {
      const m = Math.floor(pr.value / 60)
      const s = Math.round(pr.value % 60)
      return `${m}:${String(s).padStart(2, "0")}`
    }
    case "bpm":
      return `${Math.round(pr.value)} bpm`
    case "load":
      return `${pr.value.toFixed(0)} load`
    case "meters_per_second":
      return units === "imperial"
        ? `${(pr.value * 2.236936).toFixed(1)} mph`
        : `${(pr.value * 3.6).toFixed(1)} km/h`
    default:
      return String(pr.value)
  }
}

export default async function InsightsPage() {
  const session = await requireSession()
  const athleteId = (await getAthleteIdForUser(session.user.id)) as AthleteId | null

  if (!athleteId) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
        <EmptyState
          title="No athlete profile"
          description="Finish account setup to see metrics."
        />
      </div>
    )
  }

  const profile = await db.query.athleteProfiles.findFirst({
    where: eq(athleteProfiles.id, athleteId),
  })
  const timeZone = profile?.timezone ?? "UTC"
  const weekStart = startOfIsoWeekDate(new Date(), timeZone)
  const bundle = await getAthleteInsightsBundle(db, athleteId, weekStart)
  const week = bundle.week
  const rollup = bundle.rollup

  if (!(week || rollup)) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Deep-dive metrics, PRs, and recompute — the home dashboard is at{" "}
              <Link href="/" className="underline underline-offset-2">
                Dashboard
              </Link>
              .
            </p>
          </div>
          <RecomputeMetricsButton />
        </div>
        <EmptyState
          title="No metrics yet"
          description="Import or update Strava activities, then recompute metrics from here or the dashboard Update control."
        />
        <nav
          aria-label="Period summaries"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"
        >
          <span className="text-muted-foreground">Summaries</span>
          <Link
            href="/summaries/week"
            className="font-medium underline-offset-4 hover:underline"
          >
            This week
          </Link>
          <Link
            href="/summaries/month"
            className="font-medium underline-offset-4 hover:underline"
          >
            This month
          </Link>
        </nav>
      </div>
    )
  }

  const units = bundle.preferredUnits

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Deep-dive for PRs, rollups, and recompute. Daily “how am I doing?”
            lives on the{" "}
            <Link href="/" className="underline underline-offset-2">
              Dashboard
            </Link>
            . Not a medical measurement.
          </p>
        </div>
        <RecomputeMetricsButton />
      </div>

      <nav
        aria-label="Period summaries"
        className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"
      >
        <span className="text-muted-foreground">Summaries</span>
        <Link
          href="/summaries/week"
          className="font-medium underline-offset-4 hover:underline"
        >
          This week
        </Link>
        <Link
          href="/summaries/month"
          className="font-medium underline-offset-4 hover:underline"
        >
          This month
        </Link>
      </nav>

      {week ? (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-medium">This week</h2>
            <Link
              href="/summaries/week"
              className="text-muted-foreground text-sm underline-offset-4 hover:underline"
            >
              Full week summary
            </Link>
          </div>
          <p className="text-muted-foreground text-sm">
            {week.sessionCount} sessions · {formatDuration(week.totalDurationSeconds)}{" "}
            total · {formatDistance(week.totalDistanceMeters, units)} distance
            sports · load {week.totalLoad.toFixed(0)}
          </p>
          {week.highIntensityCluster ? (
            <p className="text-sm text-amber-700 dark:text-amber-400">
              High-intensity cluster: 3+ hard sessions in 7 days.
            </p>
          ) : null}
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
          <p className="text-muted-foreground text-sm">
            Intensity — easy {week.intensityCounts.easy}, moderate{" "}
            {week.intensityCounts.moderate}, hard {week.intensityCounts.hard},
            unknown {week.intensityCounts.unknown}
          </p>
        </section>
      ) : null}

      {rollup ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">Rollup</h2>
          <p className="text-sm">
            Consistency {rollup.consistencyScore}% · streak{" "}
            {rollup.currentStreakDays}d · fitness {rollup.fitnessTrend.direction}{" "}
            · recovery {rollup.recoveryTrend.direction} · performance{" "}
            {rollup.performanceTrend.direction}
          </p>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Personal records</h2>
        {bundle.personalRecords.length === 0 ? (
          <p className="text-muted-foreground text-sm">No PRs computed yet.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {bundle.personalRecords.map((pr) => (
              <li
                key={`${pr.sport}-${pr.kind}`}
                className="flex flex-wrap items-center gap-2"
              >
                <Badge variant="outline">{pr.sport}</Badge>
                <span className="font-medium">{pr.kind.replaceAll("_", " ")}</span>
                <span>{formatPrValue(pr, units)}</span>
                {pr.estimated ? (
                  <Badge variant="secondary">estimated</Badge>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-muted-foreground text-xs">
        Versions: {bundle.metricsVersion ?? "—"}
        {bundle.metricsComputedAt
          ? ` · computed ${bundle.metricsComputedAt.toLocaleString()}`
          : null}
        . See docs/metrics-methodology.md.
      </p>
    </div>
  )
}
