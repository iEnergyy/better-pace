import { Separator } from "@workspace/ui/components/separator"
import { EmptyState } from "@/components/empty-state"
import { SportCatalog } from "@/components/sport-catalog"

export default function Page() {
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

      <EmptyState
        title="No activities yet"
        description="Connect Strava in a later Phase 0 step to import your history. Sync and metrics land after auth."
        actionLabel="Connect Strava (soon)"
      />
    </div>
  )
}
