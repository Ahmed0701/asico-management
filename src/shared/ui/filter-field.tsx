import type { ReactNode } from "react"
import { Label } from "./label"
import { cn } from "./utils"

export function FilterField({
  label,
  htmlFor,
  children,
  className,
  error,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
  className?: string
  error?: string
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label
        htmlFor={htmlFor}
        className="text-xs font-normal text-muted-foreground"
      >
        {label}
      </Label>
      {children}
      {error ? (
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      ) : null}
    </div>
  )
}
