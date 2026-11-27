import { useTranslation } from "react-i18next"
import { AlertTriangle, Boxes, PackageX, type LucideIcon } from "lucide-react"
import { cn } from "@/shared/lib/cn"
import { Skeleton } from "@/shared/ui/skeleton"
import type { StoreSummary } from "../api"

const TILES: {
  key: keyof StoreSummary
  icon: LucideIcon
  tone: string
  alert: string
}[] = [
  {
    key: "itemCount",
    icon: Boxes,
    tone: "bg-accent/10 text-accent",
    alert: "",
  },
  {
    key: "lowCount",
    icon: AlertTriangle,
    tone: "bg-progress-soft text-progress",
    alert: "ring-1 ring-progress/50",
  },
  {
    key: "outCount",
    icon: PackageX,
    tone: "bg-danger-soft text-danger",
    alert: "ring-1 ring-danger/50",
  },
]

/** Over every active item: how many there are, how many are at or below their minimum, how many are out of stock. */
export default function StoreSummaryTiles({
  summary,
}: {
  summary?: StoreSummary
}) {
  const { t } = useTranslation()
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-3" data-testid="store-summary">
      {TILES.map(({ key, icon: Icon, tone, alert }) => {
        const value = summary?.[key]
        return (
          <div
            key={key}
            className={cn(
              "list-surface flex items-center gap-3 p-4",
              value ? alert : "",
            )}
          >
            <span
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-lg",
                tone,
              )}
            >
              <Icon size={18} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                {t(`store.summary.${key}`)}
              </p>
              {value === undefined ? (
                <Skeleton className="mt-1 h-6 w-10" />
              ) : (
                <p className="text-xl font-semibold tabular-nums">{value}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
