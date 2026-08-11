import type { AthleteId } from "@pacepilot/core"
import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { STRAVA_OAUTH_STATE_COOKIE } from "@/lib/strava/config"
import {
  completeOAuthConnection,
  getAthleteIdForUser,
} from "@/lib/strava/connection"
import { triggerHistoricalImport } from "@/lib/strava/import-trigger"
import { StravaOAuthError } from "@/lib/strava/oauth"

function appOrigin(): string {
  return (
    process.env.BETTER_AUTH_URL?.replace(/\/$/, "") ||
    process.env.WEB_ORIGIN?.replace(/\/$/, "") ||
    "http://localhost:3000"
  )
}

function settingsRedirect(params: Record<string, string>): NextResponse {
  const url = new URL("/settings", appOrigin())
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  const response = NextResponse.redirect(url)
  response.cookies.set(STRAVA_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  })
  return response
}

/**
 * Strava OAuth callback — exchange code, store encrypted tokens, trigger import stub.
 */
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.redirect(
      new URL("/sign-in?next=%2Fsettings", appOrigin())
    )
  }

  const { searchParams } = request.nextUrl
  const error = searchParams.get("error")
  if (error) {
    return settingsRedirect({ strava: "error", reason: "denied" })
  }

  const code = searchParams.get("code")
  const scope = searchParams.get("scope")
  const state = searchParams.get("state")
  const expectedState = request.cookies.get(STRAVA_OAUTH_STATE_COOKIE)?.value

  if (!(code && state && expectedState && state === expectedState)) {
    return settingsRedirect({ strava: "error", reason: "state" })
  }

  const athleteId = (await getAthleteIdForUser(
    session.user.id
  )) as AthleteId | null
  if (!athleteId) {
    return settingsRedirect({ strava: "error", reason: "profile" })
  }

  try {
    await completeOAuthConnection(
      { athleteId, code, scopeParam: scope },
      {
        db,
        onConnected: async (connection) => {
          await triggerHistoricalImport(connection)
        },
      }
    )
    return settingsRedirect({ strava: "connected" })
  } catch (err) {
    const reason = err instanceof StravaOAuthError ? "oauth" : "persist"
    console.error("[strava] callback failed", {
      reason,
      message: err instanceof Error ? err.message : "unknown",
    })
    return settingsRedirect({ strava: "error", reason })
  }
}
