/**
 * Client-side encryption utilities using Web Crypto API
 * Implements AES-256-GCM encryption for note content
 */

// Polyfills for btoa/atob to support Node.js test environment
// In browser: use native btoa/atob
// In Node.js: use Buffer-based conversion
const base64Encode =
  typeof btoa !== 'undefined'
    ? btoa
    : (str: string) => Buffer.from(str, 'binary').toString('base64')

const base64Decode =
  typeof atob !== 'undefined'
    ? atob
    : (str: string) => Buffer.from(str, 'base64').toString('binary')

export interface EncryptedData {
  ciphertext: string // Base64-encoded encrypted data
  iv: string // Base64-encoded initialization vector
  version: number // Encryption version (1 = AES-256-GCM)
}

/**
 * Encrypts plain text using AES-256-GCM
 * @param plainText - The text to encrypt
 * @param key - CryptoKey for encryption
 * @returns EncryptedData object with ciphertext, IV, and version
 */
export async function encryptNote(
  plainText: string,
  key: CryptoKey
): Promise<EncryptedData> {
  // Generate random IV (12 bytes for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // Convert string to bytes
  const encoder = new TextEncoder()
  const data = encoder.encode(plainText)

  // Encrypt using Web Crypto API
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  )

  // Return as base64 strings for storage
  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
    version: 1,
  }
}

/**
 * Decrypts encrypted data using AES-256-GCM
 * @param encrypted - EncryptedData object
 * @param key - CryptoKey for decryption
 * @returns Decrypted plain text
 */
export async function decryptNote(
  encrypted: EncryptedData,
  key: CryptoKey
): Promise<string> {
  // Convert base64 back to ArrayBuffer
  const ciphertext = base64ToArrayBuffer(encrypted.ciphertext)
  const iv = base64ToArrayBuffer(encrypted.iv)

  // Decrypt
  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    ciphertext
  )

  // Convert bytes back to string
  const decoder = new TextDecoder()
  return decoder.decode(plaintext)
}

/**
 * Converts ArrayBuffer to base64 string
 * Works in both browser and Node.js environments
 * @param buffer - ArrayBuffer to convert
 * @returns Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return base64Encode(binary)
}

/**
 * Converts base64 string to ArrayBuffer
 * Works in both browser and Node.js environments
 * @param base64 - Base64 string to convert
 * @returns ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = base64Decode(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}
