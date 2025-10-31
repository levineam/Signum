/**
 * Unit tests for encryption utilities
 * Story 2.10 AC5: Test encryption/decryption functionality
 */

import { describe, it, expect, beforeAll } from '@jest/globals'
import { encryptNote, decryptNote } from '../encryption'
import { generateUserKey } from '../keyManagement'

describe('Encryption', () => {
  let testKey: CryptoKey

  beforeAll(async () => {
    testKey = await generateUserKey()
  })

  it('should encrypt and decrypt text correctly', async () => {
    const plaintext = 'My secret journal entry'

    const encrypted = await encryptNote(plaintext, testKey)
    const decrypted = await decryptNote(encrypted, testKey)

    expect(decrypted).toBe(plaintext)
  })

  it('should produce different ciphertexts for same plaintext (unique IVs)', async () => {
    const plaintext = 'Same text'

    const encrypted1 = await encryptNote(plaintext, testKey)
    const encrypted2 = await encryptNote(plaintext, testKey)

    // Different ciphertexts due to different IVs
    expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext)
    expect(encrypted1.iv).not.toBe(encrypted2.iv)

    // But both decrypt to same plaintext
    const decrypted1 = await decryptNote(encrypted1, testKey)
    const decrypted2 = await decryptNote(encrypted2, testKey)
    expect(decrypted1).toBe(plaintext)
    expect(decrypted2).toBe(plaintext)
  })

  it('should fail to decrypt with wrong key', async () => {
    const key1 = await generateUserKey()
    const key2 = await generateUserKey()
    const plaintext = 'Secret'

    const encrypted = await encryptNote(plaintext, key1)

    await expect(decryptNote(encrypted, key2)).rejects.toThrow()
  })

  it('should handle empty strings', async () => {
    const plaintext = ''

    const encrypted = await encryptNote(plaintext, testKey)
    const decrypted = await decryptNote(encrypted, testKey)

    expect(decrypted).toBe('')
  })

  it('should handle Unicode characters', async () => {
    const plaintext = '你好世界 🌍 Здравствуй мир'

    const encrypted = await encryptNote(plaintext, testKey)
    const decrypted = await decryptNote(encrypted, testKey)

    expect(decrypted).toBe(plaintext)
  })

  it('should handle long text', async () => {
    const plaintext = 'a'.repeat(10000)

    const encrypted = await encryptNote(plaintext, testKey)
    const decrypted = await decryptNote(encrypted, testKey)

    expect(decrypted).toBe(plaintext)
  })

  it('should return encrypted data with correct structure', async () => {
    const plaintext = 'Test'
    const encrypted = await encryptNote(plaintext, testKey)

    expect(encrypted).toHaveProperty('ciphertext')
    expect(encrypted).toHaveProperty('iv')
    expect(encrypted).toHaveProperty('version')
    expect(encrypted.version).toBe(1)
    expect(typeof encrypted.ciphertext).toBe('string')
    expect(typeof encrypted.iv).toBe('string')
  })

  it('should produce base64-encoded ciphertext and IV', async () => {
    const plaintext = 'Test'
    const encrypted = await encryptNote(plaintext, testKey)

    // Base64 regex pattern
    const base64Pattern = /^[A-Za-z0-9+/=]+$/

    expect(encrypted.ciphertext).toMatch(base64Pattern)
    expect(encrypted.iv).toMatch(base64Pattern)
  })
})

describe('Encryption Performance', () => {
  let testKey: CryptoKey

  beforeAll(async () => {
    testKey = await generateUserKey()
  })

  it('should encrypt/decrypt 100 notes in < 500ms', async () => {
    const notes = Array.from({ length: 100 }, (_, i) => `Note ${i}`)

    const startTime = performance.now()

    // Encrypt all notes
    const encrypted = await Promise.all(
      notes.map((note) => encryptNote(note, testKey))
    )

    // Decrypt all notes
    const decrypted = await Promise.all(
      encrypted.map((enc) => decryptNote(enc, testKey))
    )

    const endTime = performance.now()
    const duration = endTime - startTime

    expect(duration).toBeLessThan(500)
    expect(decrypted).toEqual(notes)
  })
})
