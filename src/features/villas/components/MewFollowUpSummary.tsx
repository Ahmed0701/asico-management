import { useTranslation } from "react-i18next"
import { cn } from "@/shared/lib/cn"
import { Building2, CircleCheck, ClipboardCheck, Clock, type LucideIcon } from "lucide-react"
import type { VillaListItem } from "../api"
import { mewStageOf, type MewStage } from "./mewFollowUpStage"

type Props = {
  rows: VillaListItem[]
  /** Every villa on the list (all pages). */
  total: number | undefined
}

const TILES: { stage: MewStage | "all"; icon: LucideIcon; tone: string }[] = [
  { stage: "all", icon: Building2, tone: "bg-accent/10 text-accent" },
  { stage: "waiting", icon: Clock, tone: "bg-progress-soft text-progress" },
  { stage: "ready", icon: CircleCheck, tone: "bg-success-soft text-success" },
  { stage: "inspection", icon: ClipboardCheck, tone: "bg-open-soft text-open" },
]

/**
 * Where the villas on MEW follow up stand: how many there are, how many still wait for a MEW approval, how many are
 * approved and ready to be sent for inspection, and how many are on the inspection list. The three stages count the villas
 * shown (the page), the first tile every villa on the list.
 */
export default function MewFollowUpSummary({ rows, total }: Props) {
  const { t } = useTranslation()
  const count = (stage: MewStage | "all") =>
    stage === "all" ? (total ?? rows.length) : rows.filter((row) => mewStageOf(row) === stage).length
  const partial = total !== undefined && total > rows.length

  return (
    <section aria-label={t("mewFollowUp.summary.label")} className="mb-4 grid gap-2">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {TILES.map((tile) => (
          <li
            key={tile.stage}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
          >
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tile.tone)}>
              <tile.icon size={18} strokeWidth={1.9} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-2xl font-semibold leading-tight tabular-nums">
                {count(tile.stage)}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {t(`mewFollowUp.summary.${tile.stage}`)}
              </span>
            </span>
          </li>
        ))}
      </ul>
      {partial && (
        <p className="text-xs text-muted-foreground">{t("mewFollowUp.summary.pageNote")}</p>
      )}
    </section>
  )
}
