import { randomBytes } from "node:crypto"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import {
  getStravaOAuthConfig,
  STRAVA_OAUTH_STATE_COOKIE,
  type StravaOAuthConfig,
} from "@/lib/strava/config"
import { buildAuthorizeUrl } from "@/lib/strava/oauth"

function appOrigin(): string {
  return (
    process.env.BETTER_AUTH_URL?.replace(/\/$/, "") ||
    process.env.WEB_ORIGIN?.replace(/\/$/, "") ||
    "http://localhost:3000"
  )
}

/**
 * Start Strava OAuth. Requires an authenticated session.
 */
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.redirect(
      new URL("/sign-in?next=%2Fapi%2Fstrava%2Fconnect", appOrigin())
    )
  }

  let config: StravaOAuthConfig
  try {
    config = getStravaOAuthConfig()
  } catch {
    return NextResponse.redirect(
      new URL("/settings?strava=error&reason=config", appOrigin())
    )
  }

  const state = randomBytes(24).toString("hex")
  const authorizeUrl = buildAuthorizeUrl(config, { state })

  const response = NextResponse.redirect(authorizeUrl)
  response.cookies.set(STRAVA_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  })
  return response
}
