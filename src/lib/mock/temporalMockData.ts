/**
 * Mock data for Tasks & Reminders prototype (Story 1.10.0.2)
 *
 * This data is hardcoded for UI prototyping only.
 * Will be replaced with real API calls in Phase 3.
 */

export type MockReminder = {
  id: string;
  title: string;
  dueAt: string; // ISO 8601 timestamp
  status: 'pending' | 'notified' | 'completed';
  recurrence?: string; // Human-readable recurrence description
};

export type MockTask = {
  id: string;
  title: string;
  dueAt: string; // ISO 8601 timestamp
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
  estimate?: number; // Minutes
  recurrence?: string;
};

export const mockReminders: MockReminder[] = [
  {
    id: '1',
    title: 'Call mom',
    dueAt: '2025-11-06T17:00:00Z',
    status: 'pending',
  },
  {
    id: '2',
    title: 'Doctor appointment',
    dueAt: '2025-11-07T09:30:00Z',
    status: 'pending',
    recurrence: 'Every 6 months',
  },
  {
    id: '3',
    title: 'Team standup',
    dueAt: '2025-11-06T10:00:00Z',
    status: 'pending',
    recurrence: 'Every weekday at 10am',
  },
];

export const mockTasks: MockTask[] = [
  {
    id: '1',
    title: 'Finish report',
    dueAt: '2025-11-08T17:00:00Z',
    priority: 'high',
    status: 'pending',
    estimate: 120,
  },
  {
    id: '2',
    title: 'Review PRs',
    dueAt: '2025-11-06T16:00:00Z',
    priority: 'medium',
    status: 'pending',
    estimate: 30,
  },
  {
    id: '3',
    title: 'Update docs',
    dueAt: '2025-11-09T12:00:00Z',
    priority: 'low',
    status: 'pending',
  },
  {
    id: '4',
    title: 'Grocery shopping',
    dueAt: '2025-11-07T18:00:00Z',
    priority: 'medium',
    status: 'pending',
  },
  {
    id: '5',
    title: 'Plan sprint',
    dueAt: '2025-11-08T14:00:00Z',
    priority: 'high',
    status: 'pending',
    estimate: 60,
    recurrence: 'Every 2 weeks',
  },
];

// Helper to format due time for display
export function formatDueTime(dueAt: string): string {
  const date = new Date(dueAt);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 0) {
    const overdueMins = Math.abs(diffMins);
    if (overdueMins < 60) return `${overdueMins}m overdue`;
    if (overdueMins < 1440) return `${Math.floor(overdueMins / 60)}h overdue`;
    return `${Math.floor(overdueMins / 1440)}d overdue`;
  }

  if (diffMins < 60) return `in ${diffMins}m`;
  if (diffMins < 1440) return `in ${Math.floor(diffMins / 60)}h`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
