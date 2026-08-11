import { describe, expect, it } from "vitest"
import {
  decryptToken,
  encryptToken,
  requireTokenEncryptionKey,
  TokenEncryptionError,
} from "./token-encryption"

const KEY = Buffer.alloc(32, 7).toString("base64")

describe("token encryption", () => {
  it("round-trips a Strava-like access token", () => {
    const plaintext = "a4b945687g-example-access-token"
    const encrypted = encryptToken(plaintext, KEY)
    expect(encrypted).not.toContain(plaintext)
    expect(encrypted.split(":")).toHaveLength(3)
    expect(decryptToken(encrypted, KEY)).toBe(plaintext)
  })

  it("produces different ciphertext for the same plaintext", () => {
    const a = encryptToken("refresh-token-1", KEY)
    const b = encryptToken("refresh-token-1", KEY)
    expect(a).not.toBe(b)
  })

  it("rejects tampered ciphertext", () => {
    const encrypted = encryptToken("secret", KEY)
    const [iv, tag] = encrypted.split(":")
    const tampered = `${iv}:${tag}:${Buffer.from("nope").toString("base64")}`
    expect(() => decryptToken(tampered, KEY)).toThrow(TokenEncryptionError)
  })

  it("rejects empty plaintext", () => {
    expect(() => encryptToken("", KEY)).toThrow(TokenEncryptionError)
  })

  it("requireTokenEncryptionKey validates length", () => {
    expect(() =>
      requireTokenEncryptionKey({ TOKEN_ENCRYPTION_KEY: "short" })
    ).toThrow(TokenEncryptionError)
    expect(requireTokenEncryptionKey({ TOKEN_ENCRYPTION_KEY: KEY })).toBe(KEY)
  })
})
