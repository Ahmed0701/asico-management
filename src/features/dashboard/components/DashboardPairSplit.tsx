import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/shared/lib/cn"
import { formatDashboardCount } from "../lib/formatDashboardNumber"

export default function DashboardPairSplit({
  leftLabel,
  rightLabel,
  left,
  right,
  leftClass,
  rightClass,
  heading,
  headingExtra,
}: {
  heading: string
  leftLabel: string
  rightLabel: string
  left: number
  right: number
  leftClass: string
  rightClass: string
  headingExtra?: ReactNode
}) {
  const { t } = useTranslation()
  const total = left + right
  const ariaLabel = t("dashboard.pairSplitAria", {
    heading,
    left: formatDashboardCount(left),
    right: formatDashboardCount(right),
    total: formatDashboardCount(total),
  })

  if (total <= 0) {
    return (
      <div>
        <div className="flex items-center gap-1">
          <h3 className="text-sm font-semibold">{heading}</h3>
          {headingExtra}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("dashboard.noData")}
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-1">
        <h3 className="text-sm font-semibold">{heading}</h3>
        {headingExtra}
      </div>
      <div
        role="img"
        aria-label={ariaLabel}
        className="mt-3 flex h-2 overflow-hidden rounded-full bg-border"
      >
        <span
          className={cn("h-full", leftClass)}
          style={{ width: `${(left / total) * 100}%` }}
        />
        <span
          className={cn("h-full", rightClass)}
          style={{ width: `${(right / total) * 100}%` }}
        />
      </div>
      <ul className="mt-2 space-y-1 text-xs">
        <li className="flex justify-between gap-2">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className={cn("size-2 rounded-full", leftClass)}
              aria-hidden
            />
            {leftLabel}
          </span>
          <span className="tabular-nums">{formatDashboardCount(left)}</span>
        </li>
        <li className="flex justify-between gap-2">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className={cn("size-2 rounded-full", rightClass)}
              aria-hidden
            />
            {rightLabel}
          </span>
          <span className="tabular-nums">{formatDashboardCount(right)}</span>
        </li>
      </ul>
    </div>
  )
}
