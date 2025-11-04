/**
 * Key management utilities for user encryption keys
 * Handles key generation, storage, and retrieval using IndexedDB
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface EncryptionDB extends DBSchema {
  keys: {
    key: string // userId
    value: JsonWebKey // JWK format
  }
}

const DB_NAME = 'signum-encryption'
const DB_VERSION = 1
const STORE_NAME = 'keys'

/**
 * Opens or creates the IndexedDB database
 */
async function getDB(): Promise<IDBPDatabase<EncryptionDB>> {
  return openDB<EncryptionDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    },
  })
}

/**
 * Generates a new 256-bit AES-GCM encryption key
 * @returns CryptoKey for encryption/decryption
 */
export async function generateUserKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  )
}

/**
 * Stores a user's encryption key in IndexedDB
 * @param userId - User's ID
 * @param key - CryptoKey to store
 */
export async function storeUserKey(
  userId: string,
  key: CryptoKey
): Promise<void> {
  // Export key as JWK
  const jwk = await crypto.subtle.exportKey('jwk', key)

  // Store in IndexedDB
  const db = await getDB()
  await db.put(STORE_NAME, jwk, userId)
}

/**
 * Retrieves a user's encryption key from IndexedDB
 * @param userId - User's ID
 * @returns CryptoKey for encryption/decryption
 * @throws Error if key not found
 */
export async function getUserEncryptionKey(userId: string): Promise<CryptoKey> {
  const db = await getDB()
  const jwk = await db.get(STORE_NAME, userId)

  if (!jwk) {
    throw new Error('Encryption key not found. Please enable encryption.')
  }

  // Import JWK back to CryptoKey
  return await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

/**
 * Checks if a user has an encryption key stored
 * @param userId - User's ID
 * @returns true if key exists, false otherwise
 */
export async function hasEncryptionKey(userId: string): Promise<boolean> {
  const db = await getDB()
  const jwk = await db.get(STORE_NAME, userId)
  return jwk !== undefined
}

/**
 * Deletes a user's encryption key from IndexedDB
 * @param userId - User's ID
 */
export async function deleteUserKey(userId: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, userId)
}

/**
 * Initializes encryption for a new user
 * Generates and stores encryption key
 * @param userId - User's ID
 */
export async function initializeEncryptionForUser(
  userId: string
): Promise<void> {
  // Check if key already exists
  if (await hasEncryptionKey(userId)) {
    return // Already initialized
  }

  // Generate new encryption key
  const key = await generateUserKey()

  // Store in IndexedDB
  await storeUserKey(userId, key)
}
