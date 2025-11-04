/**
 * Feature flags for gradual rollout
 * Story 2.10 AC9: Feature flag for encryption
 */

/**
 * Checks if end-to-end encryption is enabled
 * Controlled by NEXT_PUBLIC_ENABLE_ENCRYPTION environment variable
 */
export function isEncryptionEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_ENCRYPTION === 'true'
}

/**
 * Feature flags object for easy access
 */
export const featureFlags = {
  encryption: isEncryptionEnabled(),
} as const
