import { useTranslation } from "react-i18next"
import {
  BadgeCheck,
  CalendarDays,
  CalendarRange,
  FileCheck,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/shared/lib/cn"
import type { MewReport, VillaListItem } from "../api"
import { daysSince } from "./mewFollowUpStage"

type Props = {
  rows: VillaListItem[]
  /** Every villa on the list (all pages). */
  total: number | undefined
  reports: MewReport[]
}

type Tile = { key: string; icon: LucideIcon; tone: string; count: number }

/**
 * The MEW Inspection Passed list at a glance: how many villas passed, how many in the last 7 days and this month, and how
 * many have their inspection report. The last three count the villas shown (the page).
 */
export default function MewPassedSummary({ rows, total, reports }: Props) {
  const { t } = useTranslation()
  const now = new Date()
  const withReport = new Set(reports.map((report) => report.villaId))
  const passedAt = (row: VillaListItem) =>
    row.mewInspectionPassed ? new Date(row.mewInspectionPassed.at) : null
  const tiles: Tile[] = [
    {
      key: "all",
      icon: BadgeCheck,
      tone: "bg-success-soft text-success",
      count: total ?? rows.length,
    },
    {
      key: "lastWeek",
      icon: CalendarDays,
      tone: "bg-open-soft text-open",
      count: rows.filter(
        (row) => row.mewInspectionPassed && daysSince(row.mewInspectionPassed.at, now) < 7,
      ).length,
    },
    {
      key: "thisMonth",
      icon: CalendarRange,
      tone: "bg-accent/10 text-accent",
      count: rows.filter((row) => {
        const at = passedAt(row)
        return at !== null && at.getFullYear() === now.getFullYear() && at.getMonth() === now.getMonth()
      }).length,
    },
    {
      key: "reports",
      icon: FileCheck,
      tone: "bg-progress-soft text-progress",
      count: rows.filter((row) => withReport.has(row.id)).length,
    },
  ]
  const partial = total !== undefined && total > rows.length

  return (
    <section aria-label={t("mewInspectionPassed.summary.label")} className="mb-4 grid gap-2">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li
            key={tile.key}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
          >
            <span
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-xl",
                tile.tone,
              )}
            >
              <tile.icon size={18} strokeWidth={1.9} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-2xl font-semibold leading-tight tabular-nums">
                {tile.count}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {t(`mewInspectionPassed.summary.${tile.key}`)}
              </span>
            </span>
          </li>
        ))}
      </ul>
      {partial && (
        <p className="text-xs text-muted-foreground">
          {t("mewInspectionPassed.summary.pageNote")}
        </p>
      )}
    </section>
  )
}
