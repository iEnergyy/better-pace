export {
  getActivity,
  type ListAthleteActivitiesOptions,
  listAthleteActivities,
  needsActivityDetail,
  type StravaActivitySummary,
  StravaApiError,
  type StravaDetailResult,
  type StravaListResult,
} from "./activities"
export {
  DEFAULT_STRAVA_SCOPES,
  getStravaOAuthConfig,
  STRAVA_OAUTH_STATE_COOKIE,
  StravaConfigError,
  type StravaOAuthConfig,
} from "./config"
export {
  decryptToken,
  encryptToken,
  requireTokenEncryptionKey,
  TokenEncryptionError,
} from "./crypto/token-encryption"
export {
  ACTIVITY_METRICS_VERSION,
  type NormalizedActivityInput,
  normalizeStravaActivity,
} from "./normalize"
export {
  buildAuthorizeUrl,
  deauthorize,
  exchangeAuthorizationCode,
  hasRequiredScopes,
  parseGrantedScopes,
  refreshAccessToken,
  type StravaAthleteSummary,
  StravaOAuthError,
  type StravaTokenResponse,
} from "./oauth"
export {
  parseStravaRateLimitHeaders,
  type StravaRateLimitSnapshot,
  type StravaRateLimitWindow,
  shouldThrottleStrava,
} from "./rate-limit"
export {
  type ResolveAccessTokenInput,
  resolveAccessToken,
} from "./resolve-access-token"
export { mapStravaSportType } from "./sport-map"
