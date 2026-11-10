import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { cn } from "@/shared/lib/cn"
import { formatDashboardCount } from "../lib/formatDashboardNumber"

export type DashboardStatusSegment = {
  key: string
  label: string
  count: number
  tone: string
  href?: string
}

export default function DashboardStatusBreakdown({
  heading,
  segments,
  emptyKey = "dashboard.noData",
}: {
  heading: string
  segments: DashboardStatusSegment[]
  emptyKey?: string
}) {
  const { t } = useTranslation()
  const total = segments.reduce((sum, s) => sum + s.count, 0)

  if (total <= 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold">{heading}</h3>
        <p className="mt-2 text-xs text-muted-foreground">{t(emptyKey)}</p>
      </div>
    )
  }

  const ariaLabel = t("dashboard.statusSegmentsAria", {
    heading,
    total: formatDashboardCount(total),
  })

  return (
    <div>
      <h3 className="text-sm font-semibold">{heading}</h3>
      <div
        role="img"
        aria-label={ariaLabel}
        className="mt-3 flex h-2 overflow-hidden rounded-full bg-border"
      >
        {segments.map((seg) => (
          <span
            key={seg.key}
            className={cn("h-full min-w-0", seg.tone)}
            style={{ width: `${(seg.count / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
        {segments.map((seg) => (
          <li key={seg.key} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5">
              <span
                className={cn("size-2 shrink-0 rounded-full", seg.tone)}
                aria-hidden
              />
              {seg.href ? (
                <Link to={seg.href} className="truncate hover:underline">
                  {seg.label}
                </Link>
              ) : (
                <span className="truncate">{seg.label}</span>
              )}
            </span>
            <span className="tabular-nums">
              {formatDashboardCount(seg.count)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
