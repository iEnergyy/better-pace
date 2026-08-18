import type { StravaOAuthConfig } from "./config"
import { decryptToken, encryptToken } from "./crypto/token-encryption"
import { refreshAccessToken, type StravaTokenResponse } from "./oauth"

const DEFAULT_REFRESH_SKEW_MS = 5 * 60 * 1000

export type ResolveAccessTokenInput = {
  accessTokenEncrypted: string
  refreshTokenEncrypted: string
  expiresAt: Date
  encryptionKey: string
  config: StravaOAuthConfig
  now?: Date
  refreshSkewMs?: number
  fetchImpl?: typeof fetch
  onRefreshed?: (tokens: {
    accessTokenEncrypted: string
    refreshTokenEncrypted: string
    expiresAt: Date
  }) => Promise<void>
}

/**
 * Decrypt and return a usable access token, refreshing when near expiry.
 * Persistence of rotated tokens is the caller's responsibility via onRefreshed.
 */
export async function resolveAccessToken(
  input: ResolveAccessTokenInput
): Promise<string> {
  const now = input.now ?? new Date()
  const skew = input.refreshSkewMs ?? DEFAULT_REFRESH_SKEW_MS
  const fetchImpl = input.fetchImpl ?? fetch
  const accessToken = decryptToken(
    input.accessTokenEncrypted,
    input.encryptionKey
  )
  const refreshToken = decryptToken(
    input.refreshTokenEncrypted,
    input.encryptionKey
  )

  if (input.expiresAt.getTime() - now.getTime() > skew) {
    return accessToken
  }

  const refreshed: StravaTokenResponse = await refreshAccessToken(
    input.config,
    refreshToken,
    fetchImpl
  )

  if (input.onRefreshed) {
    await input.onRefreshed({
      accessTokenEncrypted: encryptToken(
        refreshed.accessToken,
        input.encryptionKey
      ),
      refreshTokenEncrypted: encryptToken(
        refreshed.refreshToken,
        input.encryptionKey
      ),
      expiresAt: refreshed.expiresAt,
    })
  }

  return refreshed.accessToken
}
