import type { Sport } from "../value-objects/sport"
import type { IntensityLabel } from "./types"

export const DISTANCE_SPORTS: ReadonlySet<Sport> = new Set([
  "running",
  "cycling",
  "swimming",
  "walking",
  "hiking",
])

export function isDistanceSport(sport: Sport): boolean {
  return DISTANCE_SPORTS.has(sport)
}

export function intensityFactor(label: IntensityLabel): number {
  switch (label) {
    case "easy":
      return 1.0
    case "moderate":
      return 1.5
    case "hard":
      return 2.5
    case "unknown":
      return 1.2
  }
}

export function sportFactor(sport: Sport): number {
  switch (sport) {
    case "running":
      return 1.0
    case "cycling":
      return 0.9
    case "swimming":
      return 1.1
    case "padel":
      return 1.2
    case "strength":
      return 0.8
    case "walking":
    case "hiking":
      return 0.7
    case "other":
      return 1.0
  }
}
