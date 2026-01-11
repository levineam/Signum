'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createPrediction } from '@/lib/supabase/predictions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Loader2, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CreatePredictionFormProps {
  onCreated: () => void
}

export function CreatePredictionForm({ onCreated }: CreatePredictionFormProps) {
  const { user } = useAuth()
  const [statement, setStatement] = useState('')
  const [settlementDate, setSettlementDate] = useState<Date | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('You must be signed in to create a prediction')
      return
    }

    if (!statement.trim()) {
      toast.error('Please enter a prediction statement')
      return
    }

    if (!settlementDate) {
      toast.error('Please select a settlement date')
      return
    }

    // Settlement date must be in the future
    if (settlementDate <= new Date()) {
      toast.error('Settlement date must be in the future')
      return
    }

    setIsSubmitting(true)

    try {
      await createPrediction(
        {
          statement: statement.trim(),
          settlementDate: settlementDate.toISOString(),
        },
        user.id
      )

      toast.success('Prediction created!')
      setStatement('')
      setSettlementDate(undefined)
      setIsExpanded(false)
      onCreated()
    } catch (error) {
      console.error('Error creating prediction:', error)
      toast.error('Failed to create prediction. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isExpanded) {
    return (
      <Button
        variant="outline"
        className="w-full justify-start text-muted-foreground"
        onClick={() => setIsExpanded(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Create a prediction...
      </Button>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Enter your prediction... (e.g., 'Tesla will hit $1,000/share by the end of 2026')"
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !settlementDate && 'text-muted-foreground'
                    )}
                    disabled={isSubmitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {settlementDate ? format(settlementDate, 'PPP') : 'Select settlement date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={settlementDate}
                    onSelect={setSettlementDate}
                    disabled={(date) => date <= new Date()}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground mt-1">
                When should this prediction be resolved?
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsExpanded(false)
                  setStatement('')
                  setSettlementDate(undefined)
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !statement.trim() || !settlementDate}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Prediction'
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
