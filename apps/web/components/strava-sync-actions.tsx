"use client"

import { Button } from "@workspace/ui/components/button"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { useStravaLiveStatus } from "@/hooks/use-strava-live-status"
import { retryStravaImport, updateStravaActivities } from "@/lib/actions/strava"

type Props = {
  syncStatus: string | null
  lastSyncAt: string | null
  importedCount: number
  syncProgress: string | null
  showRetry?: boolean
}

export function StravaSyncActions({
  syncStatus: initialSyncStatus,
  lastSyncAt: initialLastSyncAt,
  importedCount: initialImportedCount,
  syncProgress: initialSyncProgress,
  showRetry = false,
}: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [forceImporting, setForceImporting] = useState(false)
  const effectiveInitialStatus =
    forceImporting || initialSyncStatus === "importing"
      ? "importing"
      : initialSyncStatus
  const live = useStravaLiveStatus(effectiveInitialStatus === "importing", {
    syncStatus: effectiveInitialStatus,
    lastSyncAt: initialLastSyncAt,
    importedCount: initialImportedCount,
    syncProgress: forceImporting
      ? (initialSyncProgress ?? "Starting…")
      : initialSyncProgress,
  })

  const syncStatus = live.syncStatus ?? effectiveInitialStatus
  const lastSyncAt = live.lastSyncAt ?? initialLastSyncAt
  const importedCount = live.importedCount
  const syncProgress = live.syncProgress ?? initialSyncProgress
  const importing = syncStatus === "importing"
  const wasImporting = useRef(importing)

  useEffect(() => {
    if (wasImporting.current && !importing) {
      setForceImporting(false)
      router.refresh()
    }
    wasImporting.current = importing
  }, [importing, router])

  function run(action: () => Promise<{ ok?: true; error?: string }>) {
    setError(null)
    setForceImporting(true)
    startTransition(async () => {
      const result = await action()
      if ("error" in result && result.error) {
        setForceImporting(false)
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
        <span>
          {importedCount} {importedCount === 1 ? "activity" : "activities"}
          {syncStatus ? ` · ${syncStatus}` : null}
          {lastSyncAt
            ? ` · last sync ${new Date(lastSyncAt).toLocaleString()}`
            : null}
        </span>
        {showRetry || syncStatus === "error" || importing ? (
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() => run(retryStravaImport)}
          >
            {pending
              ? "Retrying…"
              : importing
                ? "Restart import"
                : "Retry import"}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() => run(updateStravaActivities)}
          >
            {pending ? "Updating…" : "Update"}
          </Button>
        )}
      </div>
      {importing ? (
        <p className="text-primary text-sm font-medium" aria-live="polite">
          {syncProgress ?? "Syncing with Strava…"}
        </p>
      ) : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  )
}
