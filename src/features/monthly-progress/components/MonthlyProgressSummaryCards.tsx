import { useTranslation } from "react-i18next"
import { cn } from "@/shared/lib/cn"
import { Card } from "@/shared/ui/PageHeader"
import type { MonthlyProgressSummary } from "../api"
import { changeText, monthLabel } from "./monthlyProgressFormat"

type Props = {
  summary: MonthlyProgressSummary
}

/** The averages of last month and this month, the average change, and how many villas moved forward. */
export default function MonthlyProgressSummaryCards({ summary }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="p-4">
        <p className="text-xs text-muted-foreground">
          {t("monthlyProgress.averageOf", {
            month: monthLabel(summary.previousMonth, lang),
          })}
        </p>
        <p className="mt-1 text-xl font-semibold tabular-nums">
          {summary.averagePrevious}%
        </p>
      </Card>
      <Card className="p-4">
        <p className="text-xs text-muted-foreground">
          {t(
            summary.isCurrentMonth
              ? "monthlyProgress.averageNow"
              : "monthlyProgress.averageOf",
            { month: monthLabel(summary.month, lang) },
          )}
        </p>
        <p className="mt-1 text-xl font-semibold tabular-nums">
          {summary.averageCurrent}%
        </p>
      </Card>
      <Card className="p-4">
        <p className="text-xs text-muted-foreground">
          {t("monthlyProgress.averageChange")}
        </p>
        <p
          className={cn(
            "mt-1 text-xl font-semibold tabular-nums",
            summary.averageChange > 0
              ? "text-success"
              : "text-muted-foreground",
          )}
        >
          {changeText(summary.averageChange)}
        </p>
      </Card>
      <Card className="p-4">
        <p className="text-xs text-muted-foreground">
          {t("monthlyProgress.improved")}
        </p>
        <p className="mt-1 text-xl font-semibold tabular-nums">
          {summary.improvedCount}
          <span className="text-sm font-normal text-muted-foreground">
            {" "}
            / {summary.villaCount}
          </span>
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("monthlyProgress.unchanged", { count: summary.unchangedCount })}
        </p>
      </Card>
    </div>
  )
}
