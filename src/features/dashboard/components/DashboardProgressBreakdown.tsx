import { useTranslation } from "react-i18next"
import { cn } from "@/shared/lib/cn"
import type { DashboardProgress } from "../api/dashboard.types"
import {
  formatDashboardCount,
  formatDashboardPercent,
} from "../lib/formatDashboardNumber"

const SEGMENTS = [
  { key: "notStarted" as const, tone: "bg-progress-track" },
  { key: "inProgress" as const, tone: "bg-accent" },
  { key: "done" as const, tone: "bg-success" },
] as const

export default function DashboardProgressBreakdown({
  progress,
}: {
  progress: DashboardProgress
}) {
  const { t } = useTranslation()
  const total = progress.notStarted + progress.inProgress + progress.done

  if (total <= 0) {
    return (
      <p className="text-xs text-muted-foreground">{t("dashboard.noVillas")}</p>
    )
  }

  const values = {
    notStarted: progress.notStarted,
    inProgress: progress.inProgress,
    done: progress.done,
  }

  const ariaLabel = t("dashboard.progressBreakdownAria", {
    notStarted: formatDashboardCount(progress.notStarted),
    inProgress: formatDashboardCount(progress.inProgress),
    done: formatDashboardCount(progress.done),
    total: formatDashboardCount(total),
  })

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">
        {t("dashboard.averageProgress")}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {formatDashboardPercent(progress.average)}
      </p>
      <div
        role="img"
        aria-label={ariaLabel}
        className="mt-3 flex h-2 overflow-hidden rounded-full bg-border"
      >
        {SEGMENTS.map((seg) => (
          <span
            key={seg.key}
            className={cn("h-full min-w-0", seg.tone)}
            style={{ width: `${(values[seg.key] / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
        <li className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <span
              className="size-2 shrink-0 rounded-full bg-progress-track"
              aria-hidden
            />
            {t("dashboard.notStarted")}
          </span>
          <span className="tabular-nums">
            {formatDashboardCount(progress.notStarted)}
          </span>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <span
              className="size-2 shrink-0 rounded-full bg-accent"
              aria-hidden
            />
            {t("dashboard.progressInProgress")}
          </span>
          <span className="tabular-nums">
            {formatDashboardCount(progress.inProgress)}
          </span>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <span
              className="size-2 shrink-0 rounded-full bg-success"
              aria-hidden
            />
            {t("dashboard.progressDone")}
          </span>
          <span className="tabular-nums">
            {formatDashboardCount(progress.done)}
          </span>
        </li>
      </ul>
    </div>
  )
}
