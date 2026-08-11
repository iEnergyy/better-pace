import { Separator } from "@workspace/ui/components/separator"
import { EmptyState } from "@/components/empty-state"
import { SportCatalog } from "@/components/sport-catalog"
import { requireSession } from "@/lib/session"
import { getAthleteIdForUser, getStravaUiStatus } from "@/lib/strava/connection"

export default async function Page() {
  const session = await requireSession()
  const athleteId = await getAthleteIdForUser(session.user.id)
  const strava = athleteId
    ? await getStravaUiStatus(athleteId)
    : { connected: false, connection: null }

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
        <EmptyState
          title="Waiting for activity import"
          description="Strava is connected. Historical sync lands in phase 0.4 — your timeline will fill in once import jobs run."
        />
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
