import type { PreferredUnits, Sport } from "@pacepilot/core"
import {
  countByIntensity,
  identifyLongRuns,
  type IntensityLabel,
} from "@pacepilot/core"
import type { ActivityWithMetric } from "@pacepilot/db"
import { Badge } from "@workspace/ui/components/badge"
import { formatDistance, formatDuration, formatPace } from "@/lib/format"

export function RunningIntelligence({
  runs,
  units,
}: {
  runs: ActivityWithMetric[]
  units: PreferredUnits
}) {
  if (runs.length === 0) return null
  const long = identifyLongRuns(runs)
  const longRun = long.find((l) => l.isLongRun)?.activity
  const intensities = runs.map(
    (r) => (r.intensity ?? "unknown") as IntensityLabel
  )
  const counts = countByIntensity(intensities)
  const totalDistance = runs.reduce(
    (sum, r) => sum + (r.distanceMeters ?? 0),
    0
  )
  const paces = runs
    .map((r) => r.averagePaceSecondsPerKm)
    .filter((p): p is number => p != null && p > 0)
  const medianPace =
    paces.length === 0
      ? null
      : [...paces].sort((a, b) => a - b)[Math.floor(paces.length / 2)]!

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">Running</h3>
      <p className="text-muted-foreground text-sm">
        {runs.length} run{runs.length === 1 ? "" : "s"} ·{" "}
        {formatDistance(totalDistance, units)} · median pace{" "}
        {formatPace(medianPace, units) ?? "—"}
      </p>
      <p className="text-muted-foreground text-sm">
        Easy {counts.easy} · moderate {counts.moderate} · hard {counts.hard} ·
        unknown {counts.unknown}
      </p>
      {longRun ? (
        <p className="text-sm">
          Long run candidate:{" "}
          <span className="font-medium">{longRun.name}</span> (
          {formatDistance(longRun.distanceMeters, units)} ·{" "}
          {formatDuration(longRun.durationSeconds)})
        </p>
      ) : null}
    </section>
  )
}

export function PadelIntelligence({
  sessions,
}: {
  sessions: ActivityWithMetric[]
}) {
  if (sessions.length === 0) return null
  const totalDuration = sessions.reduce((s, a) => s + a.durationSeconds, 0)
  const hrs = sessions
    .map((s) => s.averageHeartRate)
    .filter((h): h is number => h != null)
  const avgHr =
    hrs.length === 0
      ? null
      : Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length)
  const load = sessions.reduce((s, a) => s + (a.sessionLoad ?? 0), 0)

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">Padel</h3>
      <p className="text-muted-foreground text-sm">
        Physiological / session data only — no match scores.
      </p>
      <p className="text-sm">
        {sessions.length} session{sessions.length === 1 ? "" : "s"} ·{" "}
        {formatDuration(totalDuration)}
        {avgHr != null ? ` · avg HR ~${avgHr}` : null}
        {load > 0 ? ` · load ${load.toFixed(0)}` : null}
      </p>
      <ul className="flex flex-wrap gap-2">
        {sessions.slice(0, 5).map((s) => (
          <Badge key={s.id} variant="outline">
            {s.name}
          </Badge>
        ))}
      </ul>
    </section>
  )
}

export function sportsFromActivities(
  items: { sport: Sport }[]
): Sport[] {
  return [...new Set(items.map((i) => i.sport))]
}
