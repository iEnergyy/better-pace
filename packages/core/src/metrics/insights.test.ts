import type { AthleteId } from "../entities/ids"
import { generateInsightCards } from "./insights"
import type {
  AthleteMetricRollup,
  IntensityCounts,
  PersonalRecord,
  TrainingSummary,
} from "./types"
import { describe, expect, it } from "vitest"

function emptyCounts(): IntensityCounts {
  return { easy: 0, moderate: 0, hard: 0, unknown: 0 }
}

function summary(
  overrides: Partial<TrainingSummary> & Pick<TrainingSummary, "periodStart">
): TrainingSummary {
  return {
    athleteId: "a1" as AthleteId,
    period: "week",
    sessionCount: 4,
    totalDurationSeconds: 20_000,
    totalDistanceMeters: 20_000,
    totalLoad: 200,
    bySport: [],
    intensityCounts: emptyCounts(),
    highIntensityCluster: false,
    volumeVersion: "volume.v1",
    loadVersion: "load.v1",
    computedAt: new Date(),
    ...overrides,
  }
}

describe("generateInsightCards", () => {
  const weekStart = new Date("2026-08-10T00:00:00Z")
  const weekEnd = new Date("2026-08-17T00:00:00Z")

  it("emits volume delta when weeks differ", () => {
    const cards = generateInsightCards({
      thisWeek: summary({
        periodStart: weekStart,
        totalDurationSeconds: 30_000,
      }),
      lastWeek: summary({
        periodStart: new Date("2026-08-03T00:00:00Z"),
        totalDurationSeconds: 20_000,
      }),
      rollup: null,
      recentPrs: [],
      weekStart,
      weekEnd,
    })
    expect(cards.some((c) => c.id === "volume-delta")).toBe(true)
  })

  it("emits cluster and cross-sport cards", () => {
    const cards = generateInsightCards({
      thisWeek: summary({
        periodStart: weekStart,
        highIntensityCluster: true,
        intensityCounts: { easy: 1, moderate: 1, hard: 3, unknown: 0 },
        totalLoad: 250,
        bySport: [
          {
            sport: "running",
            sessionCount: 2,
            distanceMeters: 15_000,
            durationSeconds: 5000,
          },
          {
            sport: "padel",
            sessionCount: 3,
            distanceMeters: 0,
            durationSeconds: 10_000,
          },
        ],
      }),
      lastWeek: summary({ periodStart: new Date("2026-08-03T00:00:00Z") }),
      rollup: null,
      recentPrs: [],
      weekStart,
      weekEnd,
    })
    expect(cards.some((c) => c.id === "high-intensity-cluster")).toBe(true)
    expect(cards.some((c) => c.id === "cross-sport-load")).toBe(true)
  })

  it("emits PR and recovery stretch cards", () => {
    const rollup: AthleteMetricRollup = {
      sports: ["running"],
      trainingFrequency: 3,
      weeklyVolumeDistanceMeters: 20_000,
      weeklyVolumeDurationSeconds: 10_000,
      trainingLoad: 100,
      consistencyScore: 40,
      currentStreakDays: 1,
      fitnessTrend: { direction: "flat", delta: 0 },
      recoveryTrend: { direction: "down", delta: -2 },
      performanceTrend: { direction: "unknown", delta: null },
      metricsVersion: "metrics.bundle.v1",
      computedAt: new Date(),
    }
    const pr: PersonalRecord = {
      athleteId: "a1" as AthleteId,
      sport: "running",
      kind: "longest_distance",
      activityId: "act1" as never,
      value: 12_000,
      unit: "meters",
      estimated: false,
      achievedAt: new Date("2026-08-12T12:00:00Z"),
    }
    const cards = generateInsightCards({
      thisWeek: summary({ periodStart: weekStart }),
      lastWeek: null,
      rollup,
      recentPrs: [pr],
      weekStart,
      weekEnd,
    })
    expect(cards.some((c) => c.id === "new-pr")).toBe(true)
    expect(cards.some((c) => c.id === "consistency")).toBe(true)
    expect(cards.some((c) => c.id === "recovery-pressure")).toBe(true)
  })
})
