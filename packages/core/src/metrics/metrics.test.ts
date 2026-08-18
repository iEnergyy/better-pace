import type { Activity } from "../entities/activity"
import type { ActivityId, AthleteId } from "../entities/ids"
import { classifyIntensity } from "./intensity"
import { computeSessionLoad } from "./load"
import { detectPersonalRecords } from "./personal-records"
import { hasHighIntensityCluster } from "./volume"
import { describe, expect, it } from "vitest"

function activity(
  overrides: Partial<Activity> & Pick<Activity, "id" | "sport" | "startedAt">
): Activity {
  return {
    athleteId: "athlete-1" as AthleteId,
    source: "strava",
    externalId: overrides.id,
    name: "Test",
    durationSeconds: 3600,
    distanceMeters: 10_000,
    elevationGainMeters: null,
    averageHeartRate: null,
    maxHeartRate: null,
    averagePaceSecondsPerKm: null,
    calories: null,
    averageSpeedMetersPerSecond: null,
    maxSpeedMetersPerSecond: null,
    rawData: null,
    metricsVersion: "activity.v1",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  }
}

describe("classifyIntensity intensity.v1", () => {
  it("labels easy/moderate/hard from HR vs rolling max", () => {
    const easy = activity({
      id: "a1" as ActivityId,
      sport: "running",
      startedAt: new Date("2026-06-01T10:00:00Z"),
      averageHeartRate: 120,
      maxHeartRate: 150,
    })
    expect(
      classifyIntensity(easy, {
        rolling90DayMaxHr: 190,
        medianPaceSecondsPerKm28d: null,
      }).intensity
    ).toBe("easy")

    const hard = activity({
      id: "a2" as ActivityId,
      sport: "running",
      startedAt: new Date("2026-06-02T10:00:00Z"),
      averageHeartRate: 170,
      maxHeartRate: 185,
    })
    expect(
      classifyIntensity(hard, {
        rolling90DayMaxHr: 190,
        medianPaceSecondsPerKm28d: null,
      }).intensity
    ).toBe("hard")
  })

  it("returns unknown when no HR, pace context, or effort", () => {
    const strength = activity({
      id: "a3" as ActivityId,
      sport: "strength",
      startedAt: new Date("2026-06-01T10:00:00Z"),
      distanceMeters: null,
    })
    expect(
      classifyIntensity(strength, {
        rolling90DayMaxHr: null,
        medianPaceSecondsPerKm28d: null,
      }).intensity
    ).toBe("unknown")
  })
})

describe("computeSessionLoad load.v1", () => {
  it("scales duration by intensity and sport factors", () => {
    const run = activity({
      id: "a4" as ActivityId,
      sport: "running",
      startedAt: new Date("2026-06-01T10:00:00Z"),
      durationSeconds: 3600,
    })
    // 60 min × 2.5 hard × 1.0 running = 150
    expect(computeSessionLoad(run, "hard").sessionLoad).toBe(150)
  })
})

describe("detectPersonalRecords", () => {
  it("estimates running 5k from avg pace when distance allows", () => {
    const run = activity({
      id: "a5" as ActivityId,
      sport: "running",
      startedAt: new Date("2026-06-01T10:00:00Z"),
      distanceMeters: 10_000,
      averagePaceSecondsPerKm: 300,
      durationSeconds: 3000,
    })
    const prs = detectPersonalRecords("athlete-1" as AthleteId, [
      { activity: run, sessionLoad: 100 },
    ])
    const fiveK = prs.find((p) => p.kind === "fastest_5k")
    expect(fiveK).toMatchObject({
      value: 1500,
      estimated: true,
      unit: "seconds",
    })
  })

  it("does not invent 10k PR for a 5k activity", () => {
    const run = activity({
      id: "a6" as ActivityId,
      sport: "running",
      startedAt: new Date("2026-06-01T10:00:00Z"),
      distanceMeters: 5000,
      averagePaceSecondsPerKm: 300,
    })
    const prs = detectPersonalRecords("athlete-1" as AthleteId, [
      { activity: run, sessionLoad: 80 },
    ])
    expect(prs.find((p) => p.kind === "fastest_10k")).toBeUndefined()
    expect(prs.find((p) => p.kind === "fastest_5k")?.estimated).toBe(true)
  })
})

describe("hasHighIntensityCluster", () => {
  it("flags when 3 hard sessions fall in 7 local days", () => {
    expect(
      hasHighIntensityCluster([
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
      ])
    ).toBe(true)
    expect(hasHighIntensityCluster(["2026-06-01", "2026-06-10"])).toBe(false)
  })
})
