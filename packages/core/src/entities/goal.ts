import type { Sport } from "../value-objects/sport"

export type GoalStatus = "active" | "completed" | "abandoned"

export type GoalMetric =
  | "weekly_distance_meters"
  | "weekly_duration_seconds"
  | "weekly_activity_count"
  | "target_pace_seconds_per_km"

/**
 * Minimal Goal stub for Phase 0 foundation.
 */
export interface Goal {
  id: string
  athleteId: string
  sport: Sport | null
  title: string
  metric: GoalMetric
  targetValue: number
  status: GoalStatus
  startsAt: Date
  endsAt: Date | null
  createdAt: Date
  updatedAt: Date
}
