'use client'

import { useMemo, useState } from 'react'
import { CheckSquare, ChevronDown, Square, Trash2, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useItems, useCompleteItem, useDeleteItem, useUncompleteItem } from '@/hooks/useItems'
import { CreateItemModal } from '@/components/home/CreateItemModal'
import type { Item } from '@/types/temporal'

export function TodosPrimer() {
  const [isOpen, setIsOpen] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: todos = [], isLoading } = useItems({
    itemType: 'task',
  })

  const { mutate: completeItem, isPending: isCompleting } = useCompleteItem()
  const { mutate: uncompleteItem, isPending: isUncompleting } = useUncompleteItem()
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteItem()

  const remaining = useMemo(() => todos.filter((t) => t.status === 'pending').length, [todos])

  const handleToggleComplete = (todo: Item, e: React.MouseEvent) => {
    e.stopPropagation()
    if (todo.status === 'completed') {
      uncompleteItem(todo.id)
    } else {
      completeItem(todo.id)
    }
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteItem(id)
  }

  return (
    <>
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
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : todos.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2 py-2">No todos</p>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className={cn(
                    'w-full flex items-start gap-2 px-3 py-2 rounded-md text-base border group',
                    todo.status === 'completed'
                      ? 'bg-muted/20 text-muted-foreground line-through opacity-70'
                      : 'bg-muted/10'
                  )}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0 p-0"
                    onClick={(e) => handleToggleComplete(todo, e)}
                    disabled={isCompleting || isUncompleting}
                    title={todo.status === 'completed' ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {todo.status === 'completed' ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </Button>
                  <span className="flex-1 whitespace-normal break-words">{todo.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(todo.id, e)}
                    disabled={isDeleting}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowCreateModal(true)}
            >
              + Add Todo
            </Button>
          </div>
        )}
      </Card>

      <CreateItemModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        itemType="task"
      />
    </>
  )
}
