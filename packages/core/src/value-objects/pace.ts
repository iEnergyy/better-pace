import { ValidationError } from "../errors/index"

/**
 * Pace as seconds per kilometer (canonical internal unit).
 * Presentation (min/km, min/mi) happens at the UI/API boundary.
 */
export type PaceSecondsPerKm = number & { readonly __brand: "PaceSecondsPerKm" }

export function paceSecondsPerKm(seconds: number): PaceSecondsPerKm {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new ValidationError(
      "Pace must be a positive finite number of seconds per km"
    )
  }
  return seconds as PaceSecondsPerKm
}
