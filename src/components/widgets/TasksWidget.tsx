'use client';

import React, { useState, useEffect, useId } from 'react';
import { CheckSquare, ChevronDown, CheckCircle, Pencil, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { mockTasks, formatDueTime, type MockTask } from '@/lib/mock/temporalMockData';

interface TasksWidgetProps {
  className?: string;
}

export function TasksWidget({ className }: TasksWidgetProps) {
  // Initialize to false to match server render, avoiding hydration mismatch
  const [isExpanded, setIsExpanded] = useState(false);
  const baseId = useId();
  const headerId = `${baseId}-header`;
  const panelId = `${baseId}-panel`;

  // Sync from localStorage after mount
  useEffect(() => {
    const saved = localStorage.getItem('tasks-widget-expanded');
    if (saved === 'true') {
      setIsExpanded(true);
    }
  }, []);

  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('tasks-widget-expanded', String(newState));
  };

  const pendingCount = mockTasks.filter((t) => t.status === 'pending').length;

  return (
    <Card className={cn('py-0 transition-all duration-300', className)}>
      <CardHeader className="p-0">
        <button
          id={headerId}
          type="button"
          onClick={toggleExpanded}
          className="flex w-full cursor-pointer flex-row items-center justify-between space-y-0 py-2 px-4 text-left hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-expanded={isExpanded}
          aria-controls={panelId}
        >
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Tasks</h3>
            <Badge variant="secondary" className="ml-1">
              {pendingCount}
            </Badge>
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-300',
              isExpanded && 'rotate-180'
            )}
          />
        </button>
      </CardHeader>

      {isExpanded && (
        <CardContent
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          className="space-y-2 pt-0"
        >
          {mockTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckSquare className="mb-2 h-12 w-12 text-muted-foreground/50" />
              <p className="mb-4 text-sm text-muted-foreground">No tasks</p>
              <Button size="sm" variant="outline">
                <Plus className="mr-1 h-4 w-4" />
                New Task
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-2 flex justify-end">
                <Button size="sm" variant="outline">
                  <Plus className="mr-1 h-4 w-4" />
                  New Task
                </Button>
              </div>
              <div className="space-y-1">
                {mockTasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function TaskRow({ task }: { task: MockTask }) {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = () => {
    setIsCompleting(true);
    // Mock action - just visual feedback
    setTimeout(() => {
      alert(`Completed: ${task.title}`);
      setIsCompleting(false);
    }, 300);
  };

  const handleEdit = () => {
    alert(`Edit dialog would open for: ${task.title}`);
  };

  const handleDelete = () => {
    if (confirm(`Delete task: ${task.title}?`)) {
      alert(`Deleted: ${task.title}`);
    }
  };

  const priorityColor = {
    high: 'destructive',
    medium: 'default',
    low: 'secondary',
  } as const;

  return (
    <div className="group flex items-center justify-between rounded-md border bg-card p-2 hover:bg-accent/50">
      <div className="flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{task.title}</p>
          <Badge variant={priorityColor[task.priority]} className="text-xs">
            {task.priority}
          </Badge>
          {task.recurrence && (
            <Badge variant="outline" className="text-xs">
              {task.recurrence}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDueTime(task.dueAt)}</span>
          {task.estimate && <span>• {task.estimate}m</span>}
        </div>
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
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleEdit} title="Edit">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          onClick={handleDelete}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
