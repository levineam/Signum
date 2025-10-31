/**
 * Settings > Privacy Page
 * Story 2.10 AC7, AC8: Privacy settings with encryption controls
 *
 * Allows users to:
 * - Enable end-to-end encryption
 * - View encryption status
 * - See count of encrypted vs plain text notes
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Lock, Shield, Key, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EnableEncryptionButton } from '@/components/settings/EnableEncryptionButton'
import { featureFlags } from '@/lib/feature-flags'

export const metadata: Metadata = {
  title: 'Privacy & Security | Signum',
  description: 'Manage your privacy settings and end-to-end encryption',
}

// Force dynamic rendering - this page requires authentication
export const dynamic = 'force-dynamic'

export default function PrivacyPage() {
  // Check if encryption feature is enabled via feature flag
  const encryptionEnabled = featureFlags.encryption

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to App
              </Button>
            </Link>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Privacy & Security
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage your data encryption and privacy settings
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Encryption Section */}
        {encryptionEnabled ? (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-gray-900 dark:text-gray-100" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                End-to-End Encryption
              </h2>
            </div>

            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mb-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/20">
                  <Shield className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Your notes are private
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Enable encryption to ensure that only you can read your notes. Even we
                    can&apos;t access your encrypted content. Your encryption key is stored
                    locally on your device and never leaves your browser.
                  </p>
                  <EnableEncryptionButton userId={user.id} />
                </div>
              </div>
            </div>

            {/* How it Works */}
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mb-6">
              <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
                How Encryption Works
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded bg-gray-100 dark:bg-gray-800 mt-0.5">
                    <Key className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      Local Key Generation
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      A unique encryption key is generated on your device using AES-256-GCM
                      encryption standard. This key never leaves your browser.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded bg-gray-100 dark:bg-gray-800 mt-0.5">
                    <Lock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      Client-Side Encryption
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your notes are encrypted in your browser before being sent to our
                      servers. We only store encrypted data.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded bg-gray-100 dark:bg-gray-800 mt-0.5">
                    <Database className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      Zero-Knowledge Storage
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your encrypted notes are stored in our database, but we cannot decrypt
                      them. Only you have the key.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="p-6 rounded-lg border-2 border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950">
              <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Important Information
              </h3>

              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-500">⚠️</span>
                  <span>
                    <strong>Key Storage</strong>: Your encryption key is stored in your
                    browser&apos;s IndexedDB. Clearing browser data will delete your key.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-500">⚠️</span>
                  <span>
                    <strong>Device-Specific</strong>: Each device has its own encryption key.
                    Encrypted notes from one device won&apos;t be readable on another.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-500">⚠️</span>
                  <span>
                    <strong>No Recovery</strong>: If you lose your encryption key, we cannot
                    recover your encrypted notes. They will be permanently inaccessible.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-500">ℹ️</span>
                  <span>
                    <strong>AI Features</strong>: Encrypted notes cannot be analyzed by AI
                    features, as they require access to plain text content.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-500">ℹ️</span>
                  <span>
                    <strong>Migration</strong>: Enabling encryption will encrypt all your
                    existing notes. This process is one-way and cannot be reversed.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          // Feature flag disabled message
          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-3 mb-3">
              <Lock className="h-5 w-5 text-gray-400 dark:text-gray-600" />
              <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                Encryption Coming Soon
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              End-to-end encryption is currently in development and will be available soon.
              Check back later for updates.
            </p>
          </div>
        )}

        {/* Additional Privacy Settings */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Privacy Settings
          </h2>

          <div className="space-y-4">
            {/* Data Collection */}
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Data Collection
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                We collect minimal data to provide our service. Your notes are stored
                securely and are only accessible to you.
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                Read our{' '}
                <Link
                  href="/privacy"
                  className="text-amber-600 dark:text-amber-500 hover:underline"
                >
                  Privacy Policy
                </Link>{' '}
                for details.
              </div>
            </div>

            {/* Account Data */}
            <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Account Data
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                You can export or delete your account data at any time. Note that encrypted
                notes can only be exported if you have access to your encryption key.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" disabled>
                  Export Data
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Delete Account
                </Button>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Coming in a future update
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
