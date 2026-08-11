/**
 * Pace as seconds per kilometer (canonical internal unit).
 * Presentation (min/km, min/mi) happens at the UI/API boundary.
 */
export type PaceSecondsPerKm = number & { readonly __brand: "PaceSecondsPerKm" }

export function paceSecondsPerKm(seconds: number): PaceSecondsPerKm {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error("Pace must be a positive finite number of seconds per km")
  }
  return seconds as PaceSecondsPerKm
}

export function formatPaceMinPerKm(pace: PaceSecondsPerKm): string {
  const totalSeconds = Math.round(pace)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}
