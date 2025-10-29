/**
 * HelperSkeleton Component
 * Story 2.8: Loading skeleton for dynamically imported helpers
 *
 * Displays while helper component is being lazy-loaded.
 */

export function HelperSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Header skeleton */}
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />

      {/* Description skeleton */}
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />

      {/* Form skeleton */}
      <div className="space-y-3 mt-6">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      </div>
    </div>
  )
}
