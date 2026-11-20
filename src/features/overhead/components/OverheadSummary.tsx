import { useTranslation } from "react-i18next"
import { CalendarRange, Users, Wallet, type LucideIcon } from "lucide-react"
import { formatBudgetDisplay } from "@/features/villas/api/budget"
import { cn } from "@/shared/lib/cn"
import { Card } from "@/shared/ui/PageHeader"
import type { OverheadTotals } from "../api"

type TileProps = {
  icon: LucideIcon
  label: string
  value: string
  accent?: boolean
}

function Tile({ icon: TileIcon, label, value, accent }: TileProps) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          accent
            ? "bg-accent/10 text-accent"
            : "bg-muted text-muted-foreground",
        )}
      >
        <TileIcon size={18} strokeWidth={1.9} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-lg font-semibold tabular-nums" dir="ltr">
          {value}
        </p>
      </div>
    </Card>
  )
}

type Props = {
  totals: OverheadTotals
  locale: string
}

/** How many employees, and what they cost a month and a year. */
export default function OverheadSummary({ totals, locale }: Props) {
  const { t } = useTranslation()
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-3">
      <Tile
        icon={Users}
        label={t("overhead.summaryEmployees")}
        value={String(totals.count)}
      />
      <Tile
        icon={Wallet}
        label={t("overhead.summaryMonthly")}
        value={formatBudgetDisplay(totals.monthlySalaryMinor, "KWD", locale)}
        accent
      />
      <Tile
        icon={CalendarRange}
        label={t("overhead.summaryYearly")}
        value={formatBudgetDisplay(
          totals.monthlySalaryMinor * 12,
          "KWD",
          locale,
        )}
      />
    </div>
  )
}
