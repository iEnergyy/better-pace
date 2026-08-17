import type { Sport } from "@pacepilot/core"

/**
 * Map Strava sport_type / type strings to PacePilot Sport.
 * Unknown values → other. Padel is not a first-class Strava type; we use
 * Workout/VirtualRide-style fallbacks plus name heuristics when provided.
 */
const DIRECT_MAP: Record<string, Sport> = {
  Run: "running",
  TrailRun: "running",
  VirtualRun: "running",
  Ride: "cycling",
  VirtualRide: "cycling",
  GravelRide: "cycling",
  MountainBikeRide: "cycling",
  EBikeRide: "cycling",
  EMountainBikeRide: "cycling",
  Swim: "swimming",
  Walk: "walking",
  Hike: "hiking",
  WeightTraining: "strength",
  Workout: "strength",
  Crossfit: "strength",
  Yoga: "other",
  RockClimbing: "other",
}

const PADEL_NAME = /\bpadel\b/i

export function mapStravaSportType(
  sportTypeOrType: string | null | undefined,
  activityName?: string | null
): Sport {
  if (activityName && PADEL_NAME.test(activityName)) {
    return "padel"
  }

  if (!sportTypeOrType) return "other"
  const mapped = DIRECT_MAP[sportTypeOrType]
  if (mapped) {
    // Workout + "padel" already handled; plain Workout stays strength.
    return mapped
  }
  return "other"
}
