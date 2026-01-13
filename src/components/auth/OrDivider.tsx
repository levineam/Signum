import { Separator } from '@/components/ui/separator'

interface OrDividerProps {
  text?: string
  className?: string
}

export function OrDivider({ text = 'or continue with email', className }: OrDividerProps) {
  return (
    <div className={`relative my-6 ${className ?? ''}`}>
      <div className="absolute inset-0 flex items-center">
        <Separator className="w-full" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">
          {text}
        </span>
      </div>
    </div>
  )
}
