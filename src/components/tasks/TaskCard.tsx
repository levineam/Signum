'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Check, X, Edit2, Calendar, Repeat } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  taskId: string;
  title: string;
  dueAt: string | null;
  rrule: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  onAccept?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  onComplete?: () => void;
  compact?: boolean;
}

export function TaskCard({
  title,
  dueAt,
  rrule,
  status,
  onAccept,
  onReject,
  onEdit,
  onComplete,
  compact = true,
}: Omit<TaskCardProps, 'taskId'>) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await onAccept?.();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onReject?.();
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();

    if (isToday) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy \'at\' h:mm a');
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <Check className="size-3" />
            Accepted
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <X className="size-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            Pending
          </span>
        );
    }
  };

  return (
    <Card
      className={cn(
        'my-2 flex flex-row items-center justify-between gap-3 py-3 shadow-xs',
        compact && 'px-4'
      )}
    >
      {/* Task info */}
      <div className="flex flex-col gap-1.5">
        {/* Task title */}
        <div className="font-medium text-sm">{title}</div>

        {/* Due date/time and recurrence info */}
        <div className="flex items-center gap-3 text-sm">
          {dueAt && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="size-4" />
              <span>{formatDueDate(dueAt)}</span>
            </div>
          )}
          {rrule && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Repeat className="size-3.5" />
              <span className="text-xs">Recurring</span>
            </div>
          )}
          {getStatusBadge()}
        </div>
      </div>

      {/* Actions */}
      {status === 'pending' && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAccept}
            disabled={isProcessing}
            className="h-7 px-2 text-green-600 hover:bg-green-100 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-900/30"
          >
            <Check className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            disabled={isProcessing}
            className="h-7 px-2"
          >
            <Edit2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReject}
            disabled={isProcessing}
            className="h-7 px-2 text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* Completion checkbox for accepted tasks */}
      {status === 'accepted' && (
        <button
          onClick={onComplete}
          className="flex size-5 items-center justify-center rounded border-2 border-gray-300 transition-colors hover:border-green-600 dark:border-gray-600 dark:hover:border-green-500"
          aria-label="Mark as complete"
        />
      )}

      {/* Completed checkbox (checked) */}
      {status === 'completed' && (
        <button
          onClick={onComplete}
          className="flex size-5 items-center justify-center rounded border-2 border-green-600 bg-green-600 text-white transition-colors dark:border-green-500 dark:bg-green-500"
          aria-label="Mark as incomplete"
        >
          <Check className="size-3.5" />
        </button>
      )}
    </Card>
  );
}
