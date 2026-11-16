import { useTranslation } from "react-i18next"
import {
  Building2,
  CalendarX2,
  CircleCheckBig,
  Gauge,
  type LucideIcon,
} from "lucide-react"
import { usePermissions } from "@/features/auth/api"
import { useDashboardSummaryQuery } from "@/features/dashboard/api/dashboard.queries"
import { cn } from "@/shared/lib/cn"
import { Card } from "@/shared/ui/PageHeader"

type TileProps = {
  icon: LucideIcon
  label: string
  value: string
  tone: "accent" | "success" | "danger" | "neutral"
}

const TONES: Record<TileProps["tone"], string> = {
  accent: "bg-accent/10 text-accent",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-muted text-muted-foreground",
}

function Tile({ icon: TileIcon, label, value, tone }: TileProps) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          TONES[tone],
        )}
      >
        <TileIcon size={18} strokeWidth={1.9} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold tabular-nums">{value}</p>
      </div>
    </Card>
  )
}

/**
 * Four figures over every villa: how many, their average progress, how many are done, and how many are past their target
 * date. Read from the dashboard summary, so shown only to someone who may see the dashboard (and its villas card).
 */
export default function VillasSummaryStrip() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const allowed = can("dashboard:read")
  const { data } = useDashboardSummaryQuery(allowed)
  if (!allowed || !data?.villas || !data.progress) return null
  const format = (n: number) => n.toLocaleString("en-US")
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Tile
        icon={Building2}
        label={t("villas.summary.total")}
        value={format(data.villas.total)}
        tone="accent"
      />
      <Tile
        icon={Gauge}
        label={t("villas.summary.average")}
        value={`${data.progress.average}%`}
        tone="neutral"
      />
      <Tile
        icon={CircleCheckBig}
        label={t("villas.summary.done")}
        value={format(data.progress.done)}
        tone="success"
      />
      <Tile
        icon={CalendarX2}
        label={t("villas.summary.overdue")}
        value={format(data.overdue?.count ?? 0)}
        tone={(data.overdue?.count ?? 0) > 0 ? "danger" : "neutral"}
      />
    </div>
  )
}
