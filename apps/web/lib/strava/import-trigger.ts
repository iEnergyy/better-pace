import type { AthleteId, StravaConnection } from "@pacepilot/core"

/**
 * Trigger historical import after a successful Strava connect.
 * Full job handler lands in phase 0.4 — this only emits an event when
 * INNGEST_EVENT_KEY is configured, otherwise it's a no-op log.
 */
export async function triggerHistoricalImport(
  connection: StravaConnection
): Promise<{ emitted: boolean }> {
  const eventKey = process.env.INNGEST_EVENT_KEY?.trim()
  if (!eventKey) {
    console.info(
      "[strava] import trigger deferred (no INNGEST_EVENT_KEY); syncStatus=importing",
      {
        athleteId: connection.athleteId,
        stravaAthleteId: connection.stravaAthleteId,
      }
    )
    return { emitted: false }
  }

  try {
    const response = await fetch(`https://inn.gs/e/${eventKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "strava/import.historical",
        data: {
          athleteId: connection.athleteId as AthleteId,
          stravaAthleteId: connection.stravaAthleteId,
          connectionId: connection.id,
        },
      }),
    })
    if (!response.ok) {
      console.warn("[strava] failed to emit import event", {
        status: response.status,
        athleteId: connection.athleteId,
      })
      return { emitted: false }
    }
    return { emitted: true }
  } catch (error) {
    console.warn("[strava] failed to emit import event", {
      athleteId: connection.athleteId,
      error: error instanceof Error ? error.message : "unknown",
    })
    return { emitted: false }
  }
}
