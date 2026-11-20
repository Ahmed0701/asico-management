import { useTranslation } from "react-i18next"
import { Banknote, CircleAlert } from "lucide-react"
import { formatBudgetDisplay } from "@/features/villas/api/budget"
import { cn } from "@/shared/lib/cn"
import { Avatar } from "@/shared/list/cells"
import { Card } from "@/shared/ui/PageHeader"
import type { MonthlyProgressSummary } from "../api"

type Props = {
  summary: MonthlyProgressSummary
  /** The contractor whose villas the list shows, if one. */
  selectedId: string | undefined
  onSelect: (contractorId: string | undefined) => void
}

/**
 * What each contractor is owed now (its villas' progress since their last payments times their Work Order Values), the most first,
 * and the total. A click shows only that contractor's villas.
 */
export default function ContractorDuesCard({
  summary,
  selectedId,
  onSelect,
}: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB"
  const kwd = (minor: number) => formatBudgetDisplay(minor, "KWD", locale)

  return (
    <Card className="mb-4 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-success-soft text-success">
            <Banknote size={17} strokeWidth={1.9} aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold">
              {t("monthlyProgress.duesTitle")}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("monthlyProgress.duesSubtitle")}
            </p>
          </div>
        </div>
        <div className="text-end">
          <p className="text-xs text-muted-foreground">
            {t("monthlyProgress.duesTotal")}
          </p>
          <p
            className="text-xl font-semibold tabular-nums text-success"
            dir="ltr"
            data-testid="total-due"
          >
            {kwd(summary.totalDueMinor)}
          </p>
        </div>
      </div>

      {summary.missingWorkOrderCount > 0 && (
        <p className="mb-3 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <CircleAlert size={14} className="mt-0.5 shrink-0" aria-hidden />
          {t("monthlyProgress.missingWorkOrder", {
            count: summary.missingWorkOrderCount,
          })}
        </p>
      )}

      {summary.contractors.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
          {t("monthlyProgress.duesEmpty")}
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {summary.contractors.map((entry) => {
            const name =
              entry.contractor?.name ?? t("monthlyProgress.duesNoContractor")
            const selected =
              !!entry.contractor && entry.contractor.id === selectedId
            return (
              <li key={entry.contractor?.id ?? "none"}>
                <button
                  type="button"
                  disabled={!entry.contractor}
                  onClick={() =>
                    onSelect(selected ? undefined : entry.contractor?.id)
                  }
                  aria-pressed={selected}
                  title={
                    entry.contractor
                      ? t("monthlyProgress.duesShowOne", { name })
                      : undefined
                  }
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-start transition-colors",
                    selected
                      ? "border-success/50 bg-success-soft"
                      : "border-border bg-muted/20 hover:bg-muted/50",
                    !entry.contractor && "cursor-default opacity-80",
                  )}
                >
                  <Avatar name={entry.contractor?.name ?? "?"} />
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-sm font-medium"
                      dir="auto"
                    >
                      {name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("monthlyProgress.duesVillas", {
                        count: entry.villaCount,
                      })}
                    </span>
                  </span>
                  <span
                    className="shrink-0 text-sm font-semibold tabular-nums text-success"
                    dir="ltr"
                  >
                    {kwd(entry.dueMinor)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {selectedId && (
        <button
          type="button"
          className="mt-3 text-xs font-medium text-accent hover:underline"
          onClick={() => onSelect(undefined)}
        >
          {t("monthlyProgress.duesShowAll")}
        </button>
      )}
    </Card>
  )
}
