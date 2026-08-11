import type { Sport } from "../value-objects/sport"
import type { AthleteId, GoalId } from "./ids"

export const GOAL_STATUSES = ["active", "completed", "abandoned"] as const

export type GoalStatus = (typeof GOAL_STATUSES)[number]

export const GOAL_METRICS = [
  "weekly_distance_meters",
  "weekly_duration_seconds",
  "weekly_activity_count",
  "target_pace_seconds_per_km",
] as const

export type GoalMetric = (typeof GOAL_METRICS)[number]

/**
 * Minimal Goal stub for Phase 0 foundation.
 */
export interface Goal {
  id: GoalId
  athleteId: AthleteId
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
