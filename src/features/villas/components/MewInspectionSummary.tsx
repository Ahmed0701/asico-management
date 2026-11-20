import { useTranslation } from "react-i18next"
import {
  CalendarCheck,
  CalendarX,
  ClipboardCheck,
  FileCheck,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/shared/lib/cn"
import type { MewReport, VillaListItem } from "../api"
import { daysUntil } from "./mewFollowUpStage"

type Props = {
  rows: VillaListItem[]
  /** Every villa on the list (all pages). */
  total: number | undefined
  reports: MewReport[]
}

type Tile = { key: string; icon: LucideIcon; tone: string; count: number }

/**
 * The MEW Inspection list at a glance: how many villas wait for the inspection, how many have its day set, how many are past
 * that day without passing, and how many have their inspection report. The last three count the villas shown (the page).
 */
export default function MewInspectionSummary({ rows, total, reports }: Props) {
  const { t } = useTranslation()
  const withReport = new Set(reports.map((report) => report.villaId))
  const tiles: Tile[] = [
    {
      key: "all",
      icon: ClipboardCheck,
      tone: "bg-accent/10 text-accent",
      count: total ?? rows.length,
    },
    {
      key: "scheduled",
      icon: CalendarCheck,
      tone: "bg-open-soft text-open",
      count: rows.filter((row) => row.mewInspectionDate !== null).length,
    },
    {
      key: "overdue",
      icon: CalendarX,
      tone: "bg-danger-soft text-danger",
      count: rows.filter(
        (row) => row.mewInspectionDate !== null && daysUntil(row.mewInspectionDate) < 0,
      ).length,
    },
    {
      key: "reports",
      icon: FileCheck,
      tone: "bg-success-soft text-success",
      count: rows.filter((row) => withReport.has(row.id)).length,
    },
  ]
  const partial = total !== undefined && total > rows.length

  return (
    <section aria-label={t("mewInspection.summary.label")} className="mb-4 grid gap-2">
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
                {t(`mewInspection.summary.${tile.key}`)}
              </span>
            </span>
          </li>
        ))}
      </ul>
      {partial && (
        <p className="text-xs text-muted-foreground">
          {t("mewInspection.summary.pageNote")}
        </p>
      )}
    </section>
  )
}
