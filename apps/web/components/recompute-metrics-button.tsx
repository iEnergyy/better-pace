"use client"

import { Button } from "@workspace/ui/components/button"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { recomputeAllMetrics } from "@/lib/actions/metrics"

export function RecomputeMetricsButton() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const result = await recomputeAllMetrics()
            if ("error" in result && result.error) {
              setError(result.error)
              return
            }
            router.refresh()
          })
        }}
      >
        {pending ? "Recomputing…" : "Recompute all metrics"}
      </Button>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  )
}
