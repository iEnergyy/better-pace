import type { ActivityId, AthleteId, PreferredUnits } from "@pacepilot/core"
import { getActivityForAthlete } from "@pacepilot/db"
import { athleteProfiles } from "@pacepilot/db/schema"
import { Badge } from "@workspace/ui/components/badge"
import { buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { eq } from "drizzle-orm"
import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatSpeed,
} from "@/lib/format"
import { requireSession } from "@/lib/session"
import { getAthleteIdForUser } from "@/lib/strava/connection"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ActivityDetailPage({ params }: PageProps) {
  const session = await requireSession()
  const { id } = await params
  const athleteId = (await getAthleteIdForUser(
    session.user.id
  )) as AthleteId | null
  if (!athleteId) notFound()

  const activity = await getActivityForAthlete(
    db,
    athleteId,
    id as ActivityId
  )
  if (!activity) notFound()

  const profile = await db.query.athleteProfiles.findFirst({
    where: eq(athleteProfiles.id, athleteId),
  })
  const units: PreferredUnits = profile?.preferredUnits ?? "metric"

  const stravaUrl =
    activity.source === "strava"
      ? `https://www.strava.com/activities/${activity.externalId}`
      : null

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/activities"
          className="text-muted-foreground text-sm underline-offset-4 hover:underline"
        >
          ← Activities
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {activity.sport}
          </Badge>
          {activity.intensity ? (
            <Badge variant="secondary">{activity.intensity}</Badge>
          ) : null}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {activity.name}
        </h1>
        <p className="text-muted-foreground text-sm">
          {activity.startedAt.toLocaleString()}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Duration</dt>
          <dd className="font-medium tabular-nums">
            {formatDuration(activity.durationSeconds)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Distance</dt>
          <dd className="font-medium tabular-nums">
            {formatDistance(activity.distanceMeters, units) ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Pace</dt>
          <dd className="font-medium tabular-nums">
            {formatPace(activity.averagePaceSecondsPerKm, units) ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Avg HR</dt>
          <dd className="font-medium tabular-nums">
            {activity.averageHeartRate != null
              ? `${activity.averageHeartRate} bpm`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Max HR</dt>
          <dd className="font-medium tabular-nums">
            {activity.maxHeartRate != null
              ? `${activity.maxHeartRate} bpm`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Calories</dt>
          <dd className="font-medium tabular-nums">
            {activity.calories != null ? Math.round(activity.calories) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Session load</dt>
          <dd className="font-medium tabular-nums">
            {activity.sessionLoad != null
              ? activity.sessionLoad.toFixed(0)
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Avg speed</dt>
          <dd className="font-medium tabular-nums">
            {formatSpeed(activity.averageSpeedMetersPerSecond, units) ?? "—"}
          </dd>
        </div>
        {activity.sport === "padel" ? (
          <div className="col-span-2 sm:col-span-3">
            <dt className="text-muted-foreground">Padel note</dt>
            <dd className="text-sm">
              Physiological / session metrics only — PacePilot does not claim
              match scores or win/loss.
            </dd>
          </div>
        ) : null}
      </dl>

      {stravaUrl ? (
        <a
          href={stravaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
        >
          Open on Strava
        </a>
      ) : null}
    </div>
  )
}
