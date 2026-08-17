import {
  parseStravaRateLimitHeaders,
  type StravaRateLimitSnapshot,
  shouldThrottleStrava,
} from "./rate-limit"

const API_BASE = "https://www.strava.com/api/v3"

export class StravaApiError extends Error {
  readonly status: number
  readonly rateLimit: StravaRateLimitSnapshot

  constructor(
    message: string,
    status: number,
    rateLimit: StravaRateLimitSnapshot
  ) {
    super(message)
    this.name = "StravaApiError"
    this.status = status
    this.rateLimit = rateLimit
  }
}

/** Narrow summary fields from GET /athlete/activities */
export type StravaActivitySummary = {
  id: number
  name: string
  type?: string
  sport_type?: string
  start_date: string
  elapsed_time: number
  moving_time?: number
  distance?: number
  total_elevation_gain?: number
  average_heartrate?: number | null
  max_heartrate?: number | null
  average_speed?: number | null
  max_speed?: number | null
  calories?: number | null
  has_heartrate?: boolean
}

export type ListAthleteActivitiesOptions = {
  page?: number
  perPage?: number
  after?: number
  before?: number
  fetchImpl?: typeof fetch
}

export type StravaListResult = {
  activities: StravaActivitySummary[]
  rateLimit: StravaRateLimitSnapshot
  shouldThrottle: boolean
}

export type StravaDetailResult = {
  activity: StravaActivitySummary
  rateLimit: StravaRateLimitSnapshot
  shouldThrottle: boolean
}

async function stravaGet(
  path: string,
  accessToken: string,
  fetchImpl: typeof fetch
): Promise<{ json: unknown; rateLimit: StravaRateLimitSnapshot }> {
  const response = await fetchImpl(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const rateLimit = parseStravaRateLimitHeaders(response.headers)
  const json = await response.json().catch(() => null)
  if (!response.ok) {
    throw new StravaApiError(
      "Strava API request failed",
      response.status,
      rateLimit
    )
  }
  return { json, rateLimit }
}

export async function listAthleteActivities(
  accessToken: string,
  options: ListAthleteActivitiesOptions = {}
): Promise<StravaListResult> {
  const page = options.page ?? 1
  const perPage = options.perPage ?? 200
  const fetchImpl = options.fetchImpl ?? fetch
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  })
  if (options.after != null) params.set("after", String(options.after))
  if (options.before != null) params.set("before", String(options.before))

  const { json, rateLimit } = await stravaGet(
    `/athlete/activities?${params}`,
    accessToken,
    fetchImpl
  )

  if (!Array.isArray(json)) {
    throw new StravaApiError(
      "Strava activities response was not an array",
      500,
      rateLimit
    )
  }

  return {
    activities: json as StravaActivitySummary[],
    rateLimit,
    shouldThrottle: shouldThrottleStrava(rateLimit),
  }
}

export async function getActivity(
  accessToken: string,
  activityId: string | number,
  fetchImpl: typeof fetch = fetch
): Promise<StravaDetailResult> {
  const { json, rateLimit } = await stravaGet(
    `/activities/${activityId}`,
    accessToken,
    fetchImpl
  )

  if (!json || typeof json !== "object" || !("id" in json)) {
    throw new StravaApiError(
      "Strava activity detail response was incomplete",
      500,
      rateLimit
    )
  }

  return {
    activity: json as StravaActivitySummary,
    rateLimit,
    shouldThrottle: shouldThrottleStrava(rateLimit),
  }
}

/** Whether list payload is missing fields we care about for timeline/metrics v1. */
export function needsActivityDetail(summary: StravaActivitySummary): boolean {
  if (summary.has_heartrate && summary.average_heartrate == null) {
    return true
  }
  return false
}
