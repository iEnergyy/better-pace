import type { AthleteId } from "@pacepilot/core"
import { describe, expect, it, vi } from "vitest"
import { listAthleteActivities } from "./activities"
import { getStravaOAuthConfig } from "./config"
import {
  decryptToken,
  encryptToken,
  requireTokenEncryptionKey,
  TokenEncryptionError,
} from "./crypto/token-encryption"
import { normalizeStravaActivity } from "./normalize"
import {
  buildAuthorizeUrl,
  deauthorize,
  exchangeAuthorizationCode,
  hasRequiredScopes,
  parseGrantedScopes,
  refreshAccessToken,
} from "./oauth"
import { parseStravaRateLimitHeaders, shouldThrottleStrava } from "./rate-limit"
import { mapStravaSportType } from "./sport-map"

const config = {
  clientId: "12345",
  clientSecret: "secret",
  redirectUri: "http://localhost:3000/api/strava/callback",
}

const KEY = Buffer.alloc(32, 7).toString("base64")

describe("token encryption", () => {
  it("round-trips a Strava-like access token", () => {
    const plaintext = "a4b945687g-example-access-token"
    const encrypted = encryptToken(plaintext, KEY)
    expect(encrypted).not.toContain(plaintext)
    expect(encrypted.split(":")).toHaveLength(3)
    expect(decryptToken(encrypted, KEY)).toBe(plaintext)
  })

  it("rejects tampered ciphertext", () => {
    const encrypted = encryptToken("secret", KEY)
    const [iv, tag] = encrypted.split(":")
    const tampered = `${iv}:${tag}:${Buffer.from("nope").toString("base64")}`
    expect(() => decryptToken(tampered, KEY)).toThrow(TokenEncryptionError)
  })

  it("requireTokenEncryptionKey validates length", () => {
    expect(() =>
      requireTokenEncryptionKey({ TOKEN_ENCRYPTION_KEY: "short" })
    ).toThrow(TokenEncryptionError)
    expect(requireTokenEncryptionKey({ TOKEN_ENCRYPTION_KEY: KEY })).toBe(KEY)
  })
})

describe("strava oauth helpers", () => {
  it("builds authorize URL with required scopes and state", () => {
    const url = buildAuthorizeUrl(config, { state: "csrf-state" })
    const parsed = new URL(url)
    expect(parsed.origin + parsed.pathname).toBe(
      "https://www.strava.com/oauth/authorize"
    )
    expect(parsed.searchParams.get("client_id")).toBe("12345")
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
    expect(result.athlete?.id).toBe(99)
    expect(result.rateLimit.limit?.fifteenMinute).toBe(100)
  })

  it("refreshes and deauthorizes", async () => {
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

    const deauth = vi.fn(async () => new Response(null, { status: 200 }))
    expect(
      (await deauthorize("access-abc", deauth as unknown as typeof fetch)).ok
    ).toBe(true)
  })

  it("parses scopes and requires activity read", () => {
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
  })
})

describe("mapStravaSportType", () => {
  it("maps common Strava types", () => {
    expect(mapStravaSportType("Run")).toBe("running")
    expect(mapStravaSportType("TrailRun")).toBe("running")
    expect(mapStravaSportType("Ride")).toBe("cycling")
    expect(mapStravaSportType("Swim")).toBe("swimming")
    expect(mapStravaSportType("Walk")).toBe("walking")
    expect(mapStravaSportType("Hike")).toBe("hiking")
    expect(mapStravaSportType("WeightTraining")).toBe("strength")
    expect(mapStravaSportType("UnknownThing")).toBe("other")
  })

  it("detects padel from activity name", () => {
    expect(mapStravaSportType("Workout", "Evening padel")).toBe("padel")
    expect(mapStravaSportType("Workout", "Gym session")).toBe("strength")
  })
})

describe("listAthleteActivities", () => {
  it("requests page and per_page query params", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      expect(url).toContain("page=2")
      expect(url).toContain("per_page=50")
      return Response.json([
        {
          id: 1,
          name: "Morning Run",
          sport_type: "Run",
          start_date: "2026-01-01T10:00:00Z",
          elapsed_time: 1800,
          distance: 5000,
        },
      ])
    })

    const result = await listAthleteActivities("token", {
      page: 2,
      perPage: 50,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    expect(result.activities).toHaveLength(1)
    expect(result.activities[0]?.id).toBe(1)
  })
})

describe("normalizeStravaActivity", () => {
  it("maps summary fields and derives pace", () => {
    const activity = normalizeStravaActivity(
      {
        id: 42,
        name: "Tempo",
        sport_type: "Run",
        start_date: "2026-03-01T12:00:00Z",
        elapsed_time: 1800,
        moving_time: 1700,
        distance: 5000,
        total_elevation_gain: 40,
        average_heartrate: 150,
        max_heartrate: 170,
        average_speed: 2.94,
        max_speed: 4.1,
        calories: 320,
      },
      "ath-1" as AthleteId
    )

    expect(activity.externalId).toBe("42")
    expect(activity.sport).toBe("running")
    expect(activity.durationSeconds).toBe(1700)
    expect(activity.distanceMeters).toBe(5000)
    expect(activity.averagePaceSecondsPerKm).toBeCloseTo(340)
    expect(activity.metricsVersion).toBe("activity.v1")
    expect(activity.calories).toBe(320)
  })
})
