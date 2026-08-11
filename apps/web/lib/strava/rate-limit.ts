export type StravaRateLimitWindow = {
  fifteenMinute: number
  daily: number
}

export type StravaRateLimitSnapshot = {
  limit: StravaRateLimitWindow | null
  usage: StravaRateLimitWindow | null
  readLimit: StravaRateLimitWindow | null
  readUsage: StravaRateLimitWindow | null
}

function parsePair(value: string | null): StravaRateLimitWindow | null {
  if (!value) return null
  const parts = value.split(",").map((part) => Number.parseInt(part.trim(), 10))
  const fifteenMinute = parts[0]
  const daily = parts[1]
  if (
    fifteenMinute === undefined ||
    daily === undefined ||
    !Number.isFinite(fifteenMinute) ||
    !Number.isFinite(daily)
  ) {
    return null
  }
  return { fifteenMinute, daily }
}

function header(
  headers: Headers | Record<string, string | null | undefined>,
  name: string
): string | null {
  if (headers instanceof Headers) {
    return headers.get(name) ?? headers.get(name.toLowerCase())
  }
  const lower = name.toLowerCase()
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lower && value != null) {
      return value
    }
  }
  return null
}

/**
 * Parse Strava rate-limit headers from an API response.
 * @see https://developers.strava.com/docs/rate-limits/
 */
export function parseStravaRateLimitHeaders(
  headers: Headers | Record<string, string | null | undefined>
): StravaRateLimitSnapshot {
  return {
    limit: parsePair(header(headers, "X-RateLimit-Limit")),
    usage: parsePair(header(headers, "X-RateLimit-Usage")),
    readLimit: parsePair(header(headers, "X-ReadRateLimit-Limit")),
    readUsage: parsePair(header(headers, "X-ReadRateLimit-Usage")),
  }
}

function windowNearLimit(
  usage: StravaRateLimitWindow | null,
  limit: StravaRateLimitWindow | null,
  threshold: number
): boolean {
  if (!(usage && limit)) return false
  if (
    limit.fifteenMinute > 0 &&
    usage.fifteenMinute / limit.fifteenMinute >= threshold
  ) {
    return true
  }
  if (limit.daily > 0 && usage.daily / limit.daily >= threshold) {
    return true
  }
  return false
}

/**
 * Return true when overall or read usage is at/above `threshold` (default 0.9)
 * of either the 15-minute or daily window — callers should back off.
 */
export function shouldThrottleStrava(
  snapshot: StravaRateLimitSnapshot,
  threshold = 0.9
): boolean {
  return (
    windowNearLimit(snapshot.usage, snapshot.limit, threshold) ||
    windowNearLimit(snapshot.readUsage, snapshot.readLimit, threshold)
  )
}
