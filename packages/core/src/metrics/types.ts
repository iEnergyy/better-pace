import type { ActivityId, AthleteId } from "../entities/ids"
import type { Sport } from "../value-objects/sport"

export const INTENSITY_LABELS = [
  "easy",
  "moderate",
  "hard",
  "unknown",
] as const

export type IntensityLabel = (typeof INTENSITY_LABELS)[number]

export const TREND_DIRECTIONS = ["up", "flat", "down", "unknown"] as const

export type TrendDirection = (typeof TREND_DIRECTIONS)[number]

export const TRAINING_SUMMARY_PERIODS = ["week", "month"] as const

export type TrainingSummaryPeriod = (typeof TRAINING_SUMMARY_PERIODS)[number]

export const PERSONAL_RECORD_KINDS = [
  "fastest_1k",
  "fastest_5k",
  "fastest_10k",
  "longest_distance",
  "fastest_ride",
  "fastest_distance",
  "longest_duration",
  "highest_avg_hr",
  "highest_session_load",
] as const

export type PersonalRecordKind = (typeof PERSONAL_RECORD_KINDS)[number]

export const PERSONAL_RECORD_UNITS = [
  "seconds",
  "meters",
  "bpm",
  "load",
  "meters_per_second",
] as const

export type PersonalRecordUnit = (typeof PERSONAL_RECORD_UNITS)[number]

export const INTENSITY_VERSION = "intensity.v1"
export const LOAD_VERSION = "load.v1"
export const VOLUME_VERSION = "volume.v1"
export const METRICS_BUNDLE_VERSION = "metrics.bundle.v1"

export const HR_MAX_FALLBACK = 190

/** Per-activity derived metrics. */
export interface ActivityMetric {
  activityId: ActivityId
  athleteId: AthleteId
  intensity: IntensityLabel
  intensityVersion: string
  sessionLoad: number
  loadVersion: string
  hrMaxUsed: number | null
  estimated: boolean
  computedAt: Date
}

export interface SportVolumeBucket {
  sport: Sport
  sessionCount: number
  distanceMeters: number
  durationSeconds: number
}

export interface IntensityCounts {
  easy: number
  moderate: number
  hard: number
  unknown: number
}

/** Week or month rollup. */
export interface TrainingSummary {
  athleteId: AthleteId
  period: TrainingSummaryPeriod
  /** Local period start (UTC instant of local midnight / week start). */
  periodStart: Date
  sessionCount: number
  totalDurationSeconds: number
  totalDistanceMeters: number
  totalLoad: number
  bySport: SportVolumeBucket[]
  intensityCounts: IntensityCounts
  highIntensityCluster: boolean
  volumeVersion: string
  loadVersion: string
  computedAt: Date
}

export interface PersonalRecord {
  athleteId: AthleteId
  sport: Sport
  kind: PersonalRecordKind
  activityId: ActivityId
  value: number
  unit: PersonalRecordUnit
  estimated: boolean
  achievedAt: Date
}

export interface TrendSignal {
  direction: TrendDirection
  /** Relative delta vs prior window; null when unknown. */
  delta: number | null
}

/** Snapshot stored on athlete profile for Insights / 0.6. */
export interface AthleteMetricRollup {
  sports: Sport[]
  trainingFrequency: number
  weeklyVolumeDistanceMeters: number
  weeklyVolumeDurationSeconds: number
  trainingLoad: number
  consistencyScore: number
  currentStreakDays: number
  fitnessTrend: TrendSignal
  recoveryTrend: TrendSignal
  performanceTrend: TrendSignal
  metricsVersion: string
  computedAt: Date
}
