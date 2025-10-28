'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface TaskEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  initialTitle: string;
  initialDueAt: string | null;
  onSave: (taskId: string, updates: { title: string; due_at: string | null }) => Promise<void>;
}

export function TaskEditDialog({
  open,
  onOpenChange,
  taskId,
  initialTitle,
  initialDueAt,
  onSave,
}: TaskEditDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [dueAt, setDueAt] = useState<Date | undefined>(
    initialDueAt ? new Date(initialDueAt) : undefined
  );
  const [time, setTime] = useState<string>(
    initialDueAt ? format(new Date(initialDueAt), 'HH:mm') : '12:00'
  );
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when dialog opens with new task
  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setDueAt(initialDueAt ? new Date(initialDueAt) : undefined);
      setTime(initialDueAt ? format(new Date(initialDueAt), 'HH:mm') : '12:00');
    }
  }, [open, initialTitle, initialDueAt]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Combine date and time if both are set
      let combinedDueAt: string | null = null;
      if (dueAt) {
        const [hours, minutes] = time.split(':').map(Number);
        const dateWithTime = new Date(dueAt);
        dateWithTime.setHours(hours, minutes, 0, 0);
        combinedDueAt = dateWithTime.toISOString();
      }

      await onSave(taskId, {
        title: title.trim(),
        due_at: combinedDueAt,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Make changes to your task. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              className="col-span-3"
            />
          </div>
          <div className="grid gap-2">
            <Label>Due Date & Time</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'flex-1 justify-start text-left font-normal',
                      !dueAt && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueAt ? format(dueAt, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueAt}
                    onSelect={setDueAt}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-32"
                disabled={!dueAt}
              />
            </div>
            {dueAt && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDueAt(undefined)}
                className="w-fit text-xs"
              >
                Clear due date
              </Button>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
