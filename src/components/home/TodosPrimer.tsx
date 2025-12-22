'use client'

import { useMemo, useState } from 'react'
import { CheckSquare, ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MOCK_TODOS = [
  { id: '1', text: 'Complete project proposal', done: false },
  { id: '2', text: 'Call mentor', done: false },
  { id: '3', text: 'Update journal', done: true },
]

export function TodosPrimer() {
  const [isOpen, setIsOpen] = useState(true)

  const remaining = useMemo(() => MOCK_TODOS.filter((t) => !t.done).length, [])

  return (
    <Card spacing="compact" className="p-4">
      <Button
        variant="ghost"
        className="w-full justify-start px-2"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="todos-primer-content"
      >
        <CheckSquare className="h-5 w-5 mr-3" />
        <span className="text-lg">Todos</span>
        {remaining > 0 && (
          <Badge variant="secondary" className="ml-auto text-xs tabular-nums min-w-[1.75rem] justify-center">
            {remaining}
          </Badge>
        )}
        <ChevronDown className={cn('h-4 w-4 ml-2 transition-transform', isOpen && 'rotate-180')} />
      </Button>

      {isOpen && (
        <div id="todos-primer-content" className="mt-3 space-y-2">
          {MOCK_TODOS.length === 0 ? (
            <p className="text-sm text-muted-foreground px-2 py-2">No todos</p>
          ) : (
            MOCK_TODOS.map((todo) => (
              <div
                key={todo.id}
                className={cn(
                  'w-full flex items-start gap-2 px-3 py-2 rounded-md text-base border',
                  todo.done ? 'bg-muted/20 text-muted-foreground line-through opacity-70' : 'bg-muted/10'
                )}
              >
                <CheckSquare className="h-4 w-4 flex-shrink-0 mt-1" />
                <span className="flex-1 whitespace-normal break-words">{todo.text}</span>
              </div>
            ))
          )}

          <Button variant="ghost" size="sm" className="w-full text-sm text-muted-foreground hover:text-foreground">
            + Add Todo
          </Button>
        </div>
      )}
    </Card>
  )
}


