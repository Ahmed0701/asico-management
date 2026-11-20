import { useTranslation } from "react-i18next"
import { Users } from "lucide-react"
import { formatBudgetDisplay } from "@/features/villas/api/budget"
import {
  FULL_SHARE_BP,
  formatSharePercent,
} from "@/features/villas/api/villa-finance"
import { cn } from "@/shared/lib/cn"
import { Card } from "@/shared/ui/PageHeader"

type Props = {
  overheadSalariesMinor: number
  allocatedShareBp: number
  locale: string
}

/**
 * The Department Overhead monthly salaries, and how much of them is shared out over the villas: allocated, and what is
 * left to give.
 */
export default function SalaryAllocationCard({
  overheadSalariesMinor,
  allocatedShareBp,
  locale,
}: Props) {
  const { t } = useTranslation()
  const kwd = (minor: number) => formatBudgetDisplay(minor, "KWD", locale)
  const allocated = Math.min(allocatedShareBp, FULL_SHARE_BP)
  const left = FULL_SHARE_BP - allocated
  const allocatedMinor = Math.round(
    (overheadSalariesMinor * allocated) / FULL_SHARE_BP,
  )
  const width = `${allocated / 100}%`

  return (
    <Card className="mb-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
            <Users size={18} strokeWidth={1.9} aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold">
              {t("projectBudgets.allocation.title")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("projectBudgets.allocation.subtitle")}
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-4 text-end">
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("projectBudgets.allocation.total")}
            </dt>
            <dd className="font-semibold tabular-nums" dir="ltr">
              {kwd(overheadSalariesMinor)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("projectBudgets.allocation.allocated")}
            </dt>
            <dd className="font-semibold tabular-nums" dir="ltr">
              {formatSharePercent(allocated)}% · {kwd(allocatedMinor)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("projectBudgets.allocation.unallocated")}
            </dt>
            <dd
              className={cn(
                "font-semibold tabular-nums",
                left === 0 ? "text-success" : "text-accent",
              )}
              dir="ltr"
            >
              {formatSharePercent(left)}% ·{" "}
              {kwd(overheadSalariesMinor - allocatedMinor)}
            </dd>
          </div>
        </dl>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-progress-track"
        role="progressbar"
        aria-label={t("projectBudgets.allocation.allocated")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={allocated / 100}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width }}
        />
      </div>
    </Card>
  )
}
