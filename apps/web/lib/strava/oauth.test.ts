import { describe, expect, it, vi } from "vitest"
import { getStravaOAuthConfig } from "./config"
import {
  buildAuthorizeUrl,
  deauthorize,
  exchangeAuthorizationCode,
  hasRequiredScopes,
  parseGrantedScopes,
  refreshAccessToken,
} from "./oauth"
import { parseStravaRateLimitHeaders, shouldThrottleStrava } from "./rate-limit"

const config = {
  clientId: "12345",
  clientSecret: "secret",
  redirectUri: "http://localhost:3000/api/strava/callback",
}

describe("strava oauth helpers", () => {
  it("builds authorize URL with required scopes and state", () => {
    const url = buildAuthorizeUrl(config, { state: "csrf-state" })
    const parsed = new URL(url)
    expect(parsed.origin + parsed.pathname).toBe(
      "https://www.strava.com/oauth/authorize"
    )
    expect(parsed.searchParams.get("client_id")).toBe("12345")
    expect(parsed.searchParams.get("redirect_uri")).toBe(config.redirectUri)
    expect(parsed.searchParams.get("response_type")).toBe("code")
    expect(parsed.searchParams.get("state")).toBe("csrf-state")
    expect(parsed.searchParams.get("scope")).toContain("activity:read_all")
  })

  it("exchanges authorization code without leaking tokens into errors", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json(
        {
          token_type: "Bearer",
          access_token: "access-abc",
          refresh_token: "refresh-xyz",
          expires_at: 1_700_000_000,
          expires_in: 21600,
          athlete: { id: 99, username: "founder" },
        },
        {
          headers: {
            "X-RateLimit-Limit": "100,1000",
            "X-RateLimit-Usage": "1,1",
          },
        }
      )
    )

    const result = await exchangeAuthorizationCode(
      config,
      "auth-code",
      fetchImpl as unknown as typeof fetch
    )

    expect(result.accessToken).toBe("access-abc")
    expect(result.refreshToken).toBe("refresh-xyz")
    expect(result.athlete?.id).toBe(99)
    expect(result.expiresAt.toISOString()).toBe(
      new Date(1_700_000_000 * 1000).toISOString()
    )
    expect(result.rateLimit.limit?.fifteenMinute).toBe(100)
  })

  it("refreshes access tokens and persists rotated refresh token", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        token_type: "Bearer",
        access_token: "new-access",
        refresh_token: "new-refresh",
        expires_at: 1_800_000_000,
        expires_in: 21600,
      })
    )

    const result = await refreshAccessToken(
      config,
      "old-refresh",
      fetchImpl as unknown as typeof fetch
    )
    expect(result.accessToken).toBe("new-access")
    expect(result.refreshToken).toBe("new-refresh")

    const calls = fetchImpl.mock.calls as unknown as Array<
      [string, { body?: string }]
    >
    const body = String(calls[0]?.[1]?.body ?? "")
    expect(body).toContain("grant_type=refresh_token")
    expect(body).toContain("refresh_token=old-refresh")
  })

  it("deauthorizes with access token", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 200 }))
    const result = await deauthorize(
      "access-abc",
      fetchImpl as unknown as typeof fetch
    )
    expect(result.ok).toBe(true)
  })

  it("parses granted scopes and requires activity read", () => {
    expect(parseGrantedScopes("read,activity:read_all")).toEqual([
      "read",
      "activity:read_all",
    ])
    expect(hasRequiredScopes(["read", "activity:read_all"])).toBe(true)
    expect(hasRequiredScopes(["read"])).toBe(false)
  })

  it("requires Strava env for config", () => {
    expect(() => getStravaOAuthConfig({})).toThrow(/STRAVA_CLIENT_ID/)
  })
})

describe("strava rate limits", () => {
  it("parses headers and throttles near the limit", () => {
    const snapshot = parseStravaRateLimitHeaders({
      "X-RateLimit-Limit": "100,1000",
      "X-RateLimit-Usage": "95,100",
      "X-ReadRateLimit-Limit": "100,1000",
      "X-ReadRateLimit-Usage": "10,10",
    })
    expect(shouldThrottleStrava(snapshot)).toBe(true)
    expect(
      shouldThrottleStrava({
        ...snapshot,
        usage: { fifteenMinute: 10, daily: 10 },
      })
    ).toBe(false)
  })
})
