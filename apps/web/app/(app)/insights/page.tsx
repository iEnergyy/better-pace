import type { AthleteId, PersonalRecord } from "@pacepilot/core"
import { startOfIsoWeekDate } from "@pacepilot/core"
import { athleteProfiles, getAthleteInsightsBundle } from "@pacepilot/db"
import { Badge } from "@workspace/ui/components/badge"
import { eq } from "drizzle-orm"
import { EmptyState } from "@/components/empty-state"
import { RecomputeMetricsButton } from "@/components/recompute-metrics-button"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { getAthleteIdForUser } from "@/lib/strava/connection"

export const dynamic = "force-dynamic"

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatDistance(meters: number, units: "metric" | "imperial"): string {
  if (units === "imperial") {
    const miles = meters / 1609.344
    return `${miles.toFixed(1)} mi`
  }
  return `${(meters / 1000).toFixed(1)} km`
}

function formatPrValue(pr: PersonalRecord): string {
  switch (pr.unit) {
    case "meters":
      return formatDistance(pr.value, "metric")
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
      return `${(pr.value * 3.6).toFixed(1)} km/h`
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
              Deterministic metrics from your synced activities (no AI).
            </p>
          </div>
          <RecomputeMetricsButton />
        </div>
        <EmptyState
          title="No metrics yet"
          description="Import or update Strava activities, then recompute metrics. Full dashboard polish lands in 0.6."
        />
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
            Validation view for Phase 0.5 — not a medical measurement. Full
            dashboard is 0.6.
          </p>
        </div>
        <RecomputeMetricsButton />
      </div>

      {week ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">This week</h2>
          <p className="text-muted-foreground text-sm">
            {week.sessionCount} sessions · {formatDuration(week.totalDurationSeconds)}{" "}
            total ·{" "}
            {formatDistance(week.totalDistanceMeters, units)} distance sports ·
            load {week.totalLoad.toFixed(0)}
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
                <span>{formatPrValue(pr)}</span>
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
