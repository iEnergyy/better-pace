"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { useStravaLiveStatus } from "@/hooks/use-strava-live-status"
import {
  disconnectStrava,
  retryStravaImport,
  updateStravaActivities,
} from "@/lib/actions/strava"

export type StravaConnectionCardProps = {
  connected: boolean
  stravaAthleteId: string | null
  syncStatus: string | null
  scopes: string[]
  connectedAt: string | null
  lastSyncAt: string | null
  lastError: string | null
  importedCount: number
  syncProgress: string | null
  flash: "connected" | "error" | null
  flashReason: string | null
}

function flashMessage(
  flash: StravaConnectionCardProps["flash"],
  reason: string | null
): string | null {
  if (flash === "connected") {
    return "Strava connected. Historical import is starting — activities will appear on your timeline."
  }
  if (flash === "error") {
    switch (reason) {
      case "denied":
        return "Strava authorization was denied."
      case "config":
        return "Strava is not configured. Set STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET."
      case "state":
        return "OAuth state mismatch. Try connecting again."
      case "oauth":
        return "Strava token exchange failed. Try again."
      default:
        return "Could not connect Strava. Try again."
    }
  }
  return null
}

export function StravaConnectionCard({
  connected: initialConnected,
  stravaAthleteId,
  syncStatus: initialSyncStatus,
  scopes,
  connectedAt,
  lastSyncAt: initialLastSyncAt,
  lastError: initialLastError,
  importedCount: initialImportedCount,
  syncProgress: initialSyncProgress,
  flash,
  flashReason,
}: StravaConnectionCardProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [forceImporting, setForceImporting] = useState(false)
  const notice = flashMessage(flash, flashReason)
  const effectiveInitialStatus =
    forceImporting || initialSyncStatus === "importing"
      ? "importing"
      : initialSyncStatus
  const live = useStravaLiveStatus(
    initialConnected && effectiveInitialStatus === "importing",
    {
      connected: initialConnected,
      syncStatus: effectiveInitialStatus,
      lastSyncAt: initialLastSyncAt,
      lastError: initialLastError,
      importedCount: initialImportedCount,
      syncProgress: forceImporting
        ? (initialSyncProgress ?? "Starting…")
        : initialSyncProgress,
    }
  )

  const connected = live.connected || initialConnected
  const syncStatus = live.syncStatus ?? effectiveInitialStatus
  const lastSyncAt = live.lastSyncAt ?? initialLastSyncAt
  const lastError = live.lastError ?? initialLastError
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
    <Card>
      <CardHeader>
        <CardTitle>Strava</CardTitle>
        <CardDescription>
          Connect your Strava account to import activities. Tokens are encrypted
          at rest and never shown here. New activities sync when you click
          Update — there is no background poll.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {notice ? (
          <p
            className={
              flash === "error"
                ? "text-destructive text-sm"
                : "text-muted-foreground text-sm"
            }
          >
            {notice}
          </p>
        ) : null}
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        {connected ? (
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Connected</Badge>
              {syncStatus ? (
                <Badge variant="outline">Sync: {syncStatus}</Badge>
              ) : null}
            </div>
            <p className="text-muted-foreground">
              {importedCount} {importedCount === 1 ? "activity" : "activities"}{" "}
              imported
              {lastSyncAt
                ? ` · last sync ${new Date(lastSyncAt).toLocaleString()}`
                : null}
            </p>
            {importing ? (
              <p
                className="text-primary text-sm font-medium"
                aria-live="polite"
              >
                {syncProgress ?? "Syncing with Strava…"}
              </p>
            ) : null}
            {stravaAthleteId ? (
              <p className="text-muted-foreground">
                Athlete ID {stravaAthleteId}
                {connectedAt
                  ? ` · since ${new Date(connectedAt).toLocaleString()}`
                  : null}
              </p>
            ) : null}
            {scopes.length > 0 ? (
              <p className="text-muted-foreground text-xs">
                Scopes: {scopes.join(", ")}
              </p>
            ) : null}
            {lastError ? (
              <p className="text-destructive text-xs">
                Last error: {lastError}
              </p>
            ) : null}
            <p className="text-muted-foreground text-xs">
              Disconnect revokes PacePilot access and clears tokens. Previously
              imported activities are kept until account deletion (0.8).
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Not connected. Authorize read access to your activities to continue.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {connected ? (
          <>
            {syncStatus === "error" || importing ? (
              <Button
                type="button"
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
                disabled={pending}
                onClick={() => run(updateStravaActivities)}
              >
                {pending ? "Updating…" : "Update"}
              </Button>
            )}
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => run(disconnectStrava)}
            >
              {pending ? "Working…" : "Disconnect Strava"}
            </Button>
          </>
        ) : (
          <a
            href="/api/strava/connect"
            className={cn(
              buttonVariants(),
              pending && "pointer-events-none opacity-50"
            )}
            aria-disabled={pending}
          >
            Connect Strava
          </a>
        )}
      </CardFooter>
    </Card>
  )
}
