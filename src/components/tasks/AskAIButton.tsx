'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Sparkles, Loader2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

type ButtonState = 'idle' | 'loading' | 'success' | 'error';

interface AskAIButtonProps {
  taskId: string;
  taskText: string;
  onAnswerCreated?: (noteId: string) => void;
}

export function AskAIButton({ taskId, taskText, onAnswerCreated }: AskAIButtonProps) {
  const [state, setState] = useState<ButtonState>('idle');

  const handleClick = async () => {
    setState('loading');

    try {
      const response = await fetch('/api/ai/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId, taskText }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Daily AI limit reached. Try again tomorrow.');
        }
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to generate answer');
      }

      const data = await response.json();
      setState('success');

      if (data.noteId) {
        onAnswerCreated?.(data.noteId);
      }

      toast.success('AI answer created');

      // Reset to idle after 2 seconds
      setTimeout(() => setState('idle'), 2000);
    } catch (error) {
      setState('error');
      const errorMessage = error instanceof Error ? error.message : 'Unable to generate answer. Please try again.';

      toast.error(errorMessage);

      // Reset to idle after 3 seconds
      setTimeout(() => setState('idle'), 3000);
    }
  };

  const getButtonContent = () => {
    switch (state) {
      case 'idle':
        return (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Ask AI
          </>
        );
      case 'loading':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        );
      case 'success':
        return (
          <>
            <Check className="mr-2 h-4 w-4" />
            Answer Created
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="mr-2 h-4 w-4" />
            Try Again
          </>
        );
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleClick}
          disabled={state === 'loading'}
          variant={state === 'error' ? 'destructive' : 'secondary'}
          size="sm"
          aria-label="Get AI-powered answer to this research question"
        >
          {getButtonContent()}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Get an AI-powered answer to this research question
      </TooltipContent>
    </Tooltip>
  );
}
