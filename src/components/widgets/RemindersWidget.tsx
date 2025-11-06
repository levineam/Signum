'use client';

import React, { useState, useEffect } from 'react';
import { Bell, ChevronDown, CheckCircle, Clock, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { mockReminders, formatDueTime, type MockReminder } from '@/lib/mock/temporalMockData';

interface RemindersWidgetProps {
  className?: string;
}

export function RemindersWidget({ className }: RemindersWidgetProps) {
  // Initialize to false to match server render, avoiding hydration mismatch
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync from localStorage after mount
  useEffect(() => {
    const saved = localStorage.getItem('reminders-widget-expanded');
    if (saved === 'true') {
      setIsExpanded(true);
    }
  }, []);

  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('reminders-widget-expanded', String(newState));
  };

  const pendingCount = mockReminders.filter((r) => r.status === 'pending').length;

  return (
    <Card className={cn('transition-all duration-300', className)}>
      <CardHeader
        className="flex cursor-pointer flex-row items-center justify-between space-y-0 py-3 hover:bg-accent/50"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-base font-semibold">Reminders</h3>
          <Badge variant="secondary" className="ml-1">
            {pendingCount}
          </Badge>
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-muted-foreground transition-transform duration-300',
            isExpanded && 'rotate-180'
          )}
        />
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-2 pt-0">
          {mockReminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="mb-2 h-12 w-12 text-muted-foreground/50" />
              <p className="mb-4 text-sm text-muted-foreground">No reminders</p>
              <Button size="sm" variant="outline">
                <Plus className="mr-1 h-4 w-4" />
                New Reminder
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-2 flex justify-end">
                <Button size="sm" variant="outline">
                  <Plus className="mr-1 h-4 w-4" />
                  New Reminder
                </Button>
              </div>
              <div className="space-y-1">
                {mockReminders.map((reminder) => (
                  <ReminderRow key={reminder.id} reminder={reminder} />
                ))}
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function ReminderRow({ reminder }: { reminder: MockReminder }) {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = () => {
    setIsCompleting(true);
    // Mock action - just visual feedback
    setTimeout(() => {
      alert(`Completed: ${reminder.title}`);
      setIsCompleting(false);
    }, 300);
  };

  const handleSnooze = () => {
    alert(`Snooze menu would open for: ${reminder.title}`);
  };

  return (
    <div className="group flex items-center justify-between rounded-md border bg-card p-2 hover:bg-accent/50">
      <div className="flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{reminder.title}</p>
          {reminder.recurrence && (
            <Badge variant="outline" className="text-xs">
              {reminder.recurrence}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{formatDueTime(reminder.dueAt)}</p>
      </div>

      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={handleComplete}
          disabled={isCompleting}
          title="Complete"
        >
          <CheckCircle className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleSnooze} title="Snooze">
          <Clock className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
