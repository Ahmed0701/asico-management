import type { ReactNode } from "react"
import { Link } from "react-router"
import { cn } from "@/shared/lib/cn"
import Icon from "@/shared/ui/Icon"
import { Card, type CardTone } from "@/shared/ui/PageHeader"

type IconName = Parameters<typeof Icon>[0]["name"]

export default function DashboardLinkCard({
  to,
  label,
  value,
  help,
  valueClassName,
  labelExtra,
  ariaLabel,
  tone,
  icon,
}: {
  to: string
  label: string
  value: ReactNode
  help?: string
  valueClassName?: string
  labelExtra?: ReactNode
  ariaLabel?: string
  tone?: CardTone
  icon?: IconName
}) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel ?? label}
      className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Card tone={tone} className="h-full p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="tone-label flex items-center text-xs font-medium text-muted-foreground">
            <span>{label}</span>
            {labelExtra}
          </p>
          {icon && (
            <span aria-hidden className="tone-chip">
              <Icon name={icon} />
            </span>
          )}
        </div>
        <p
          className={cn(
            "mt-2 text-3xl font-semibold tabular-nums tracking-tight",
            valueClassName,
          )}
        >
          {value}
        </p>
        {help && <p className="mt-2 text-xs text-muted-foreground">{help}</p>}
      </Card>
    </Link>
  )
}
