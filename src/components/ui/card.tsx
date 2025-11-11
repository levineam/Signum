import * as React from "react"

import { cn } from "@/lib/utils"

interface CardProps extends React.ComponentProps<"div"> {
  spacing?: "default" | "compact"
}

function Card({ className, spacing = "default", ...props }: CardProps) {
  const spacingClass = spacing === "compact" ? "py-0 gap-0" : "py-6 gap-6"

  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col rounded-xl border shadow-sm",
        spacingClass,
        className
      )}
      {...props}
    />
  )
}

interface CardHeaderProps extends React.ComponentProps<"div"> {
  spacing?: "default" | "compact"
}

function CardHeader({ className, spacing = "default", ...props }: CardHeaderProps) {
  const headerSpacingClass = spacing === "compact" ? "[.border-b]:pb-0" : "[.border-b]:pb-6"

  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        headerSpacingClass,
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
