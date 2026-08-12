import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
const KEY_LENGTH = 32

export class TokenEncryptionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TokenEncryptionError"
  }
}

function parseKey(keyBase64: string): Buffer {
  let key: Buffer
  try {
    key = Buffer.from(keyBase64, "base64")
  } catch {
    throw new TokenEncryptionError("TOKEN_ENCRYPTION_KEY must be valid base64")
  }
  if (key.length !== KEY_LENGTH) {
    throw new TokenEncryptionError(
      `TOKEN_ENCRYPTION_KEY must decode to ${KEY_LENGTH} bytes`
    )
  }
  return key
}

/**
 * Encrypt a secret (OAuth token) with AES-256-GCM.
 * Output format: `iv:authTag:ciphertext` (each segment base64).
 */
export function encryptToken(plaintext: string, keyBase64: string): string {
  if (!plaintext) {
    throw new TokenEncryptionError("Cannot encrypt empty token")
  }
  const key = parseKey(keyBase64)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":")
}

/**
 * Decrypt a value produced by {@link encryptToken}.
 */
export function decryptToken(payload: string, keyBase64: string): string {
  const parts = payload.split(":")
  if (parts.length !== 3) {
    throw new TokenEncryptionError("Invalid encrypted token format")
  }
  const [ivB64, tagB64, dataB64] = parts
  if (!(ivB64 && tagB64 && dataB64)) {
    throw new TokenEncryptionError("Invalid encrypted token format")
  }
  const key = parseKey(keyBase64)
  const iv = Buffer.from(ivB64, "base64")
  const authTag = Buffer.from(tagB64, "base64")
  const data = Buffer.from(dataB64, "base64")
  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new TokenEncryptionError("Invalid encrypted token format")
  }
  try {
    const decipher = createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    })
    decipher.setAuthTag(authTag)
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
    return decrypted.toString("utf8")
  } catch {
    throw new TokenEncryptionError("Failed to decrypt token")
  }
}

export function requireTokenEncryptionKey(
  env: Record<string, string | undefined> = process.env
): string {
  const key = env.TOKEN_ENCRYPTION_KEY?.trim()
  if (!key) {
    throw new TokenEncryptionError("TOKEN_ENCRYPTION_KEY is not configured")
  }
  parseKey(key)
  return key
}
