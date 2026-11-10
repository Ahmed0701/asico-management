import type { ReactNode } from "react"
import { cn } from "@/shared/lib/cn"

export function DetailField({
  label,
  children,
  className,
  boxed,
  /** Groups label and value in a bordered cell for scanability. */
}: {
  label: string
  children: ReactNode
  className?: string
  boxed?: boolean
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 text-start",
        boxed && "rounded-lg border border-border bg-muted/30 px-3 py-2.5",
        className,
      )}
    >
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="m-0 text-sm leading-snug text-foreground">{children}</dd>
    </div>
  )
}

export function DetailFieldGrid({
  children,
  className,
  columns = "default",
  /** `two` keeps pairs closer on wide screens (e.g. audit detail). */
}: {
  children: ReactNode
  className?: string
  columns?: "default" | "two"
}) {
  return (
    <dl
      className={cn(
        "grid grid-cols-1 gap-3",
        columns === "two" ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {children}
    </dl>
  )
}
