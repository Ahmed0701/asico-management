import { useTranslation } from "react-i18next"
import { CircleCheckBig, CircleDashed, Hammer } from "lucide-react"
import type { DashboardProgress } from "../api/dashboard.types"
import { formatDashboardCount } from "../lib/formatDashboardNumber"
import DashboardProgressRing from "./DashboardProgressRing"
import DashboardSegments, { type DashboardSegment } from "./DashboardSegments"

/**
 * The average progress of the villas as a ring, and how many are not started, in progress and done: one bar split in
 * three, and a tile for each with its count and its share.
 */
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

  // The order of a villa's life, so the bar reads from untouched to finished.
  const segments: DashboardSegment[] = [
    {
      key: "notStarted",
      label: t("dashboard.notStarted"),
      count: progress.notStarted,
      icon: CircleDashed,
      bar: "bg-(--chart-not-started)",
      chip: "bg-muted text-muted-foreground",
    },
    {
      key: "inProgress",
      label: t("dashboard.progressInProgress"),
      count: progress.inProgress,
      icon: Hammer,
      bar: "bg-accent",
      chip: "bg-accent/10 text-accent",
    },
    {
      key: "done",
      label: t("dashboard.progressDone"),
      count: progress.done,
      icon: CircleCheckBig,
      bar: "bg-(--chart-done)",
      chip: "bg-success-soft text-success",
    },
  ]

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
      <DashboardProgressRing value={progress.average} />
      <div className="w-full min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-sm font-semibold">
            {t("dashboard.averageProgress")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("dashboard.progressVillas", {
              total: formatDashboardCount(total),
            })}
          </p>
        </div>
        <DashboardSegments
          ariaLabel={t("dashboard.progressBreakdownAria", {
            notStarted: formatDashboardCount(progress.notStarted),
            inProgress: formatDashboardCount(progress.inProgress),
            done: formatDashboardCount(progress.done),
            total: formatDashboardCount(total),
          })}
          segments={segments}
        />
      </div>
    </div>
  )
}
