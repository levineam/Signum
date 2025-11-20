/**
 * Feature flags for controlling unreleased or incomplete features
 *
 * Usage:
 * - Set environment variables in .env.local (dev) or Vercel dashboard (production)
 * - Default to false for safety (features are hidden in production unless explicitly enabled)
 */

export const FEATURES = {
  /**
   * Enable Tasks & Reminders widgets
   *
   * Status: In Development (Phase 3/6 complete)
   * - Phase 0: UI Prototype ✅
   * - Phase 1: Clean Slate ✅
   * - Phase 2: Database Schema ✅
   * - Phase 3: Supabase Integration ✅
   * - Phase 4: Database Triggers (pending)
   * - Phase 5: API Routes (pending)
   * - Phase 6: Full Integration (pending)
   *
   * Set NEXT_PUBLIC_ENABLE_TEMPORAL=true in .env.local to enable in development
   */
  TEMPORAL_SYSTEM_ENABLED: process.env.NEXT_PUBLIC_ENABLE_TEMPORAL === 'true',
} as const
