import type { StravaOAuthConfig } from "./config"
import { DEFAULT_STRAVA_SCOPES } from "./config"
import {
  parseStravaRateLimitHeaders,
  type StravaRateLimitSnapshot,
} from "./rate-limit"

const AUTHORIZE_URL = "https://www.strava.com/oauth/authorize"
const TOKEN_URL = "https://www.strava.com/api/v3/oauth/token"
const DEAUTHORIZE_URL = "https://www.strava.com/oauth/deauthorize"

export type StravaAthleteSummary = {
  id: number
  username?: string | null
  firstname?: string | null
  lastname?: string | null
}

export type StravaTokenResponse = {
  tokenType: string
  accessToken: string
  refreshToken: string
  expiresAt: Date
  expiresIn: number
  athlete?: StravaAthleteSummary
  rateLimit: StravaRateLimitSnapshot
}

export class StravaOAuthError extends Error {
  readonly status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = "StravaOAuthError"
    this.status = status
  }
}

export function buildAuthorizeUrl(
  config: StravaOAuthConfig,
  options: {
    state: string
    scopes?: string
    approvalPrompt?: "auto" | "force"
  }
): string {
  const url = new URL(AUTHORIZE_URL)
  url.searchParams.set("client_id", config.clientId)
  url.searchParams.set("redirect_uri", config.redirectUri)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("approval_prompt", options.approvalPrompt ?? "auto")
  url.searchParams.set("scope", options.scopes ?? DEFAULT_STRAVA_SCOPES)
  url.searchParams.set("state", options.state)
  return url.toString()
}

type TokenJson = {
  token_type?: string
  access_token?: string
  refresh_token?: string
  expires_at?: number
  expires_in?: number
  athlete?: {
    id?: number
    username?: string | null
    firstname?: string | null
    lastname?: string | null
  }
  message?: string
  errors?: unknown
}

async function postToken(
  body: URLSearchParams,
  fetchImpl: typeof fetch
): Promise<StravaTokenResponse> {
  const response = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })

  const rateLimit = parseStravaRateLimitHeaders(response.headers)
  const json = (await response.json().catch(() => ({}))) as TokenJson

  if (!response.ok) {
    throw new StravaOAuthError("Strava token request failed", response.status)
  }

  if (
    !(
      json.access_token &&
      json.refresh_token &&
      typeof json.expires_at === "number"
    )
  ) {
    throw new StravaOAuthError("Strava token response was incomplete")
  }

  return {
    tokenType: json.token_type ?? "Bearer",
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: new Date(json.expires_at * 1000),
    expiresIn: json.expires_in ?? 0,
    athlete:
      json.athlete?.id != null
        ? {
            id: json.athlete.id,
            username: json.athlete.username,
            firstname: json.athlete.firstname,
            lastname: json.athlete.lastname,
          }
        : undefined,
    rateLimit,
  }
}

export async function exchangeAuthorizationCode(
  config: StravaOAuthConfig,
  code: string,
  fetchImpl: typeof fetch = fetch
): Promise<StravaTokenResponse> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
  })
  return postToken(body, fetchImpl)
}

export async function refreshAccessToken(
  config: StravaOAuthConfig,
  refreshToken: string,
  fetchImpl: typeof fetch = fetch
): Promise<StravaTokenResponse> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  })
  return postToken(body, fetchImpl)
}

/**
 * Revoke the app's access for the athlete. Best-effort — local disconnect
 * still proceeds if Strava is unreachable.
 */
export async function deauthorize(
  accessToken: string,
  fetchImpl: typeof fetch = fetch
): Promise<{ ok: boolean; status: number }> {
  const body = new URLSearchParams({ access_token: accessToken })
  const response = await fetchImpl(DEAUTHORIZE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })
  return { ok: response.ok, status: response.status }
}

export function parseGrantedScopes(scopeParam: string | null): string[] {
  if (!scopeParam) return []
  return scopeParam
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function hasRequiredScopes(granted: string[]): boolean {
  return (
    granted.includes("activity:read_all") || granted.includes("activity:read")
  )
}
