import type { PreferredUnits } from "@pacepilot/core"

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function formatDistance(
  meters: number | null | undefined,
  units: PreferredUnits = "metric"
): string | null {
  if (meters == null) return null
  if (units === "imperial") {
    const miles = meters / 1609.344
    if (miles >= 0.1) return `${miles.toFixed(2)} mi`
    return `${Math.round(meters * 3.28084)} ft`
  }
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`
  return `${Math.round(meters)} m`
}

export function formatPace(
  secondsPerKm: number | null,
  units: PreferredUnits = "metric"
): string | null {
  if (secondsPerKm == null || !Number.isFinite(secondsPerKm)) return null
  if (units === "imperial") {
    const secondsPerMile = secondsPerKm * 1.609344
    const minutes = Math.floor(secondsPerMile / 60)
    const seconds = Math.round(secondsPerMile % 60)
    return `${minutes}:${String(seconds).padStart(2, "0")}/mi`
  }
  const minutes = Math.floor(secondsPerKm / 60)
  const seconds = Math.round(secondsPerKm % 60)
  return `${minutes}:${String(seconds).padStart(2, "0")}/km`
}

export function formatSpeed(
  mps: number | null,
  units: PreferredUnits = "metric"
): string | null {
  if (mps == null || !Number.isFinite(mps)) return null
  if (units === "imperial") {
    return `${(mps * 2.236936).toFixed(1)} mph`
  }
  return `${(mps * 3.6).toFixed(1)} km/h`
}

/** @deprecated Prefer formatSpeed */
export function formatSpeedKmh(mps: number | null): string | null {
  return formatSpeed(mps, "metric")
}
