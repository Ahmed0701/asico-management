import type { ReactNode } from "react"

export default function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  )
}

/** A colour for a card: a bar on top, a soft wash of the colour and a tinted border (see index.css, [data-tone]). */
export type CardTone = "blue" | "teal" | "green" | "orange" | "red" | "purple" | "amber" | "indigo"

export function Card({
  children,
  className = "",
  tone,
}: {
  children: ReactNode
  className?: string
  tone?: CardTone
}) {
  return (
    <div
      data-slot="card"
      data-tone={tone}
      className={`rounded-lg border border-border bg-card ${className}`}
    >
      {children}
    </div>
  )
}
