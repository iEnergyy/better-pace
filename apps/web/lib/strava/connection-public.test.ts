import {
  isStravaConnected,
  type StravaConnection,
  toPublicStravaConnection,
} from "@pacepilot/core"
import { describe, expect, it } from "vitest"

const sample: StravaConnection = {
  id: "conn-1" as StravaConnection["id"],
  athleteId: "ath-1" as StravaConnection["athleteId"],
  stravaAthleteId: "99",
  accessTokenEncrypted: "iv:tag:ciphertext-secret",
  refreshTokenEncrypted: "iv:tag:ciphertext-refresh",
  expiresAt: new Date("2030-01-01T00:00:00.000Z"),
  scopes: ["read", "activity:read_all"],
  syncStatus: "idle",
  connectedAt: new Date("2026-01-01T00:00:00.000Z"),
  disconnectedAt: null,
  lastSyncAt: null,
  lastError: null,
  syncProgress: null,
}

describe("StravaConnection public view", () => {
  it("strips encrypted tokens from the public DTO", () => {
    const pub = toPublicStravaConnection(sample)
    expect(pub).toEqual({
      athleteId: sample.athleteId,
      stravaAthleteId: "99",
      scopes: ["read", "activity:read_all"],
      syncStatus: "idle",
      connectedAt: sample.connectedAt,
      disconnectedAt: null,
      lastSyncAt: null,
      lastError: null,
      syncProgress: null,
    })
    expect(JSON.stringify(pub)).not.toContain("accessToken")
    expect(JSON.stringify(pub)).not.toContain("refreshToken")
    expect(JSON.stringify(pub)).not.toContain("ciphertext")
  })

  it("treats disconnectedAt as not connected", () => {
    expect(isStravaConnected(sample)).toBe(true)
    expect(
      isStravaConnected({
        ...sample,
        disconnectedAt: new Date("2026-02-01T00:00:00.000Z"),
      })
    ).toBe(false)
    expect(isStravaConnected(null)).toBe(false)
  })
})
