import { EmptyState } from "@/components/empty-state"

export default function InsightsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
      <EmptyState
        title="No insights yet"
        description="Trends, training load, and patterns appear once metrics are computed from your activities."
      />
    </div>
  )
}
