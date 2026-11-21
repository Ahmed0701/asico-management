import { useTranslation } from "react-i18next"
import {
  Building2,
  CircleCheck,
  HardHat,
  UserCheck,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/shared/lib/cn"
import type { ElectricalEngineer } from "../api"

type Props = {
  rows: ElectricalEngineer[]
  /** Every engineer the search matches (all pages). */
  total: number | undefined
}

type Tile = { key: string; icon: LucideIcon; tone: string; count: number }

/**
 * The electrical engineers at a glance: how many, how many are active, how many have a user account (and so see only
 * their own villas), and how many villas they hold. The last three count the engineers shown (the page).
 */
export default function ElectricalEngineersSummary({ rows, total }: Props) {
  const { t } = useTranslation()
  const tiles: Tile[] = [
    {
      key: "all",
      icon: HardHat,
      tone: "bg-accent/10 text-accent",
      count: total ?? rows.length,
    },
    {
      key: "active",
      icon: CircleCheck,
      tone: "bg-success-soft text-success",
      count: rows.filter((row) => row.status === "ACTIVE").length,
    },
    {
      key: "linked",
      icon: UserCheck,
      tone: "bg-open-soft text-open",
      count: rows.filter((row) => row.user).length,
    },
    {
      key: "villas",
      icon: Building2,
      tone: "bg-progress-soft text-progress",
      count: rows.reduce((sum, row) => sum + row.villaCount, 0),
    },
  ]
  const partial = total !== undefined && total > rows.length

  return (
    <section
      aria-label={t("electricalEngineers.summary.label")}
      className="mb-4 grid gap-2"
    >
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
                {t(`electricalEngineers.summary.${tile.key}`)}
              </span>
            </span>
          </li>
        ))}
      </ul>
      {partial && (
        <p className="text-xs text-muted-foreground">
          {t("electricalEngineers.summary.pageNote")}
        </p>
      )}
    </section>
  )
}
