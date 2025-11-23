'use client'

import { ReactNode, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HelperAddOnProps {
  title: string
  description: string
  children: ReactNode
  badge?: string
}

/**
 * Lightweight accordion-style wrapper for optional helper content.
 * Used to surface retired helpers inside other flows without crowding the grid.
 */
export function HelperAddOn({ title, description, children, badge }: HelperAddOnProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <section
      className={cn(
        'mt-6 rounded-lg border border-dashed border-gray-300 dark:border-gray-700',
        'bg-white/60 dark:bg-gray-900/40'
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={cn(
          'w-full flex items-start justify-between gap-3 px-4 py-3 text-left',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
        )}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 dark:text-gray-100">{title}</p>
            {badge && (
              <span className="text-xs font-medium uppercase tracking-wide text-primary">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {description}
          </p>
        </div>
        <ChevronDown
          className={cn(
            'mt-1 flex-shrink-0 text-gray-500 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-3 border-t border-gray-200 dark:border-gray-800">
          {children}
        </div>
      )}
    </section>
  )
}
