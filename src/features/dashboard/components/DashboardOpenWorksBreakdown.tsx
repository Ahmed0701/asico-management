import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { AlertTriangle, CircleDashed, Hammer, TimerOff } from "lucide-react"
import { cn } from "@/shared/lib/cn"
import type { DashboardOpenWorks } from "../api/dashboard.types"
import { dashboardLinks } from "../lib/dashboardLinks"
import { formatDashboardCount } from "../lib/formatDashboardNumber"
import DashboardSegments, { type DashboardSegment } from "./DashboardSegments"

// The colours are those of the open works chart by phase, so a status looks the same in both.
const STATUSES = [
  {
    status: "NOT_STARTED",
    icon: CircleDashed,
    bar: "bg-(--chart-not-started)",
    chip: "bg-muted text-muted-foreground",
  },
  {
    status: "IN_PROGRESS",
    icon: Hammer,
    bar: "bg-(--chart-in-progress)",
    chip: "bg-open-soft text-open",
  },
  {
    status: "DELAYED",
    icon: TimerOff,
    bar: "bg-(--chart-delayed)",
    chip: "bg-accent/10 text-accent",
  },
] as const

/**
 * The open works still to finish, by status: their total, how many are overdue, one bar split in three, and a tile for
 * each status that opens its list. Done works are not here: they are on the Done Works page.
 */
export default function DashboardOpenWorksBreakdown({
  openWorks,
}: {
  openWorks: DashboardOpenWorks
}) {
  const { t } = useTranslation()
  const segments: DashboardSegment[] = STATUSES.map(
    ({ status, icon, bar, chip }) => ({
      key: status,
      label: t(`openWorks.status.${status}`),
      count: openWorks.byStatus[status],
      icon,
      bar,
      chip,
      href: dashboardLinks.openWorksStatus(status),
    }),
  )
  const total = segments.reduce((sum, seg) => sum + seg.count, 0)
  const heading = t("dashboard.openWorksTitle")

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h2 className="text-sm font-semibold">{heading}</h2>
          {total > 0 && (
            <p className="text-xs text-muted-foreground">
              {t("dashboard.openWorksCount", {
                total: formatDashboardCount(total),
              })}
            </p>
          )}
        </div>
        <Link
          to={dashboardLinks.openWorksOverdue()}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            openWorks.overdue > 0
              ? "bg-danger-soft text-danger"
              : "bg-muted text-muted-foreground",
          )}
        >
          {openWorks.overdue > 0 && <AlertTriangle size={13} aria-hidden />}
          {t("dashboard.openWorksOverdueLink", {
            count: formatDashboardCount(openWorks.overdue),
          })}
        </Link>
      </div>
      {total > 0 ? (
        <DashboardSegments
          ariaLabel={t("dashboard.statusSegmentsAria", {
            heading,
            total: formatDashboardCount(total),
          })}
          segments={segments}
        />
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          {t("dashboard.noOpenWorks")}
        </p>
      )}
    </div>
  )
}
