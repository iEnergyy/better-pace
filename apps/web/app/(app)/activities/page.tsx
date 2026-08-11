import { EmptyState } from "@/components/empty-state"

export default function ActivitiesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Activities</h1>
      <EmptyState
        title="Activity feed coming soon"
        description="Synced Strava activities will land here after the sync pipeline is wired."
      />
    </div>
  )
}
