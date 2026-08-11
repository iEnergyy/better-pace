import { EmptyState } from "@/components/empty-state"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <EmptyState
        title="Account settings shell"
        description="Profile, units, and Strava connection controls will live here after authentication is added."
      />
    </div>
  )
}
