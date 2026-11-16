import { useState } from "react"
import { useTranslation } from "react-i18next"
import { formatDashboardCount } from "../../lib/formatDashboardNumber"
import type { PhaseStatusRow } from "../../api/dashboard-charts.types"

export const PHASE_STATUSES = [
  {
    key: "notStarted",
    status: "NOT_STARTED",
    color: "var(--chart-not-started)",
  },
  {
    key: "inProgress",
    status: "IN_PROGRESS",
    color: "var(--chart-in-progress)",
  },
  { key: "delayed", status: "DELAYED", color: "var(--chart-delayed)" },
  { key: "done", status: "DONE", color: "var(--chart-done)" },
] as const

type StatusKey = typeof PHASE_STATUSES[number]["key"]

type ActiveSegment = {
  phase: string
  key: StatusKey
}

const totalOf = (row: PhaseStatusRow) =>
  row.notStarted + row.inProgress + row.delayed + row.done

/** The legend: each status with its colour and its count over every phase (identity never by colour alone). */
export function PhaseStatusLegend({ rows }: { rows: PhaseStatusRow[] }) {
  const { t } = useTranslation()
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
      {PHASE_STATUSES.map(({ key, status, color }) => (
        <li key={key} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2.5 rounded-[3px]"
            style={{ backgroundColor: color }}
          />
          <span className="text-muted-foreground">
            {t(`openWorks.status.${status}`)}
          </span>
          <span className="font-semibold tabular-nums">
            {formatDashboardCount(rows.reduce((sum, row) => sum + row[key], 0))}
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * The open works of each active phase by status: one stacked bar a phase, on one scale (the busiest phase is the full
 * width), a 2px gap between the segments, the phase name before and its total after. Hover or focus a segment for its
 * count.
 */
export default function PhaseStatusChart({ rows }: { rows: PhaseStatusRow[] }) {
  const { t } = useTranslation()
  const [active, setActive] = useState<ActiveSegment | null>(null)
  const max = Math.max(...rows.map(totalOf), 1)

  return (
    <ul className="grid gap-2.5" onMouseLeave={() => setActive(null)}>
      {rows.map((row) => {
        const total = totalOf(row)
        return (
          <li
            key={row.elecPhaseId}
            className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3"
          >
            <span
              className="truncate text-xs font-medium"
              dir="auto"
              title={row.name}
            >
              {row.name}
            </span>
            <div className="relative h-5">
              {total === 0 ? (
                <div className="h-full rounded-[4px] border border-dashed border-border" />
              ) : (
                <div
                  className="flex h-full gap-[2px]"
                  style={{ width: `${(total / max) * 100}%` }}
                >
                  {PHASE_STATUSES.map(({ key, status, color }) => {
                    const count = row[key]
                    if (count === 0) return null
                    const isActive =
                      active?.phase === row.elecPhaseId && active.key === key
                    const label = `${row.name}, ${t(`openWorks.status.${status}`)}: ${formatDashboardCount(count)}`
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-label={label}
                        title={label}
                        className="relative h-full min-w-[3px] rounded-[4px] outline-none transition-opacity duration-150 focus-visible:ring-2 focus-visible:ring-accent/60"
                        style={{
                          flexGrow: count,
                          flexBasis: 0,
                          backgroundColor: color,
                          opacity: active === null || isActive ? 1 : 0.45,
                        }}
                        onMouseEnter={() =>
                          setActive({ phase: row.elecPhaseId, key })
                        }
                        onFocus={() =>
                          setActive({ phase: row.elecPhaseId, key })
                        }
                        onBlur={() => setActive(null)}
                      >
                        {isActive && (
                          <span className="pointer-events-none absolute bottom-full start-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-2 py-1 text-xs shadow-lg rtl:translate-x-1/2">
                            <span className="font-semibold">
                              {t(`openWorks.status.${status}`)}
                            </span>
                            <span className="ms-1.5 tabular-nums text-muted-foreground">
                              {formatDashboardCount(count)}
                            </span>
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <span className="w-14 text-end text-xs tabular-nums">
              <span className="font-semibold">
                {formatDashboardCount(total)}
              </span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
