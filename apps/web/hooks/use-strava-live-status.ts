"use client"

import { useEffect, useState } from "react"

export type StravaLiveStatus = {
  connected: boolean
  syncStatus: string | null
  syncProgress: string | null
  importedCount: number
  lastSyncAt: string | null
  lastError: string | null
}

/**
 * Poll /api/strava/status only while a sync is in progress — not while idle.
 */
export function useStravaLiveStatus(
  enabled: boolean,
  initial: Partial<StravaLiveStatus> = {}
): StravaLiveStatus {
  const [status, setStatus] = useState<StravaLiveStatus>({
    connected: initial.connected ?? false,
    syncStatus: initial.syncStatus ?? null,
    syncProgress: initial.syncProgress ?? null,
    importedCount: initial.importedCount ?? 0,
    lastSyncAt: initial.lastSyncAt ?? null,
    lastError: initial.lastError ?? null,
  })

  useEffect(() => {
    setStatus({
      connected: initial.connected ?? false,
      syncStatus: initial.syncStatus ?? null,
      syncProgress: initial.syncProgress ?? null,
      importedCount: initial.importedCount ?? 0,
      lastSyncAt: initial.lastSyncAt ?? null,
      lastError: initial.lastError ?? null,
    })
  }, [
    initial.connected,
    initial.syncStatus,
    initial.syncProgress,
    initial.importedCount,
    initial.lastSyncAt,
    initial.lastError,
  ])

  const shouldPoll = enabled && status.syncStatus === "importing"

  useEffect(() => {
    if (!shouldPoll) return

    let cancelled = false
    let settledTicks = 0

    async function tick() {
      try {
        const response = await fetch("/api/strava/status", {
          cache: "no-store",
        })
        if (!response.ok || cancelled) return
        const data = (await response.json()) as StravaLiveStatus
        if (cancelled) return
        setStatus(data)
        settledTicks = data.syncStatus === "importing" ? 0 : settledTicks + 1
      } catch {
        // Ignore transient poll errors.
      }
    }

    void tick()
    const id = window.setInterval(() => {
      if (settledTicks >= 2) {
        window.clearInterval(id)
        return
      }
      void tick()
    }, 1000)

    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [shouldPoll])

  return status
}
