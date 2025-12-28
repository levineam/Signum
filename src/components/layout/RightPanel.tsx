'use client'

import { RemindersWidget } from '@/components/widgets/RemindersWidget'
import { TasksWidget } from '@/components/widgets/TasksWidget'

export function RightPanel() {
  return (
    <aside
      aria-label="Daily reminders and tasks"
      className="fixed right-0 top-0 z-40 hidden h-dvh w-80 flex-col border-l border-sidebar-border bg-sidebar pt-16 transition-all duration-300 ease-in-out lg:flex"
    >
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6">
        <RemindersWidget />
        <TasksWidget />
      </div>
    </aside>
  )
}
