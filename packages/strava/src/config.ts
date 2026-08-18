import { STRAVA_OAUTH_SCOPES } from "@pacepilot/core"

export type StravaOAuthConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export class StravaConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StravaConfigError"
  }
}

export function getStravaOAuthConfig(
  env: Record<string, string | undefined> = process.env
): StravaOAuthConfig {
  const clientId = env.STRAVA_CLIENT_ID?.trim()
  const clientSecret = env.STRAVA_CLIENT_SECRET?.trim()
  const redirectUri =
    env.STRAVA_REDIRECT_URI?.trim() ||
    "http://localhost:3000/api/strava/callback"

  if (!clientId || !clientSecret) {
    throw new StravaConfigError(
      "STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET must be set"
    )
  }

  return { clientId, clientSecret, redirectUri }
}

export const DEFAULT_STRAVA_SCOPES = STRAVA_OAUTH_SCOPES.join(",")

/** httpOnly cookie used to validate OAuth `state` on callback. */
export const STRAVA_OAUTH_STATE_COOKIE = "strava_oauth_state"
