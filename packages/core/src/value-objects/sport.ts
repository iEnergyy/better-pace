/**
 * Canonical sport taxonomy for PacePilot.
 * Classification from Strava (and future sources) maps into these values.
 */
export const SPORTS = [
  "running",
  "padel",
  "cycling",
  "swimming",
  "walking",
  "hiking",
  "strength",
  "other",
] as const

export type Sport = (typeof SPORTS)[number]

export function isSport(value: string): value is Sport {
  return (SPORTS as readonly string[]).includes(value)
}
