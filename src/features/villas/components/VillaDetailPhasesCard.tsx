import { useTranslation } from "react-i18next"
import type { VillaPhaseProgress } from "../api"
import { Card } from "@/shared/ui/PageHeader"
import { clampProgressPercent } from "@/shared/lib/progressDisplay"
import { Progress } from "@/shared/ui/progress"
import Icon from "@/shared/ui/Icon"
import { cn } from "@/shared/lib/cn"

// Colors for each state: done is green, under way uses the progress color, not started is grey.
const STATE_STYLES: Record<VillaPhaseProgress["state"], {
  badge: string
  dot: string
}> = {
  DONE: { badge: "bg-success-soft text-success", dot: "bg-success" },
  IN_PROGRESS: { badge: "bg-progress-soft text-progress", dot: "bg-progress" },
  NOT_STARTED: {
    badge: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/40",
  },
}

// Each phase's progress comes from the villa's open works (worked out by the server):
// the average of the open works filed under the phase, or 0 when it has none.
// It is shown only; it is changed through the open works.
export default function VillaDetailPhasesCard({
  phases,
}: {
  phases: VillaPhaseProgress[]
}) {
  const { t } = useTranslation()
  const sorted = [...phases].sort((a, b) => a.order - b.order)
  const doneCount = sorted.filter((phase) => phase.state === "DONE").length

  return (
    <Card className="mb-4 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Icon name="pipe" size={18} className="text-progress" />
            {t("villas.phasesTitle")}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("villas.phasesFromOpenWorks")}
          </p>
        </div>
        {sorted.length > 0 && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
            {t("villas.phasesDone", { done: doneCount, total: sorted.length })}
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("villas.noPhases")}</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((phase) => {
            const style = STATE_STYLES[phase.state]
            return (
              <li
                key={phase.elecPhaseId}
                className="min-w-0 rounded-lg border border-border bg-muted/20 px-3 py-2.5"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 text-xs font-medium">
                    {phase.state === "DONE" ? (
                      <Icon
                        name="check"
                        size={14}
                        className="shrink-0 text-success"
                      />
                    ) : (
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          style.dot,
                        )}
                        aria-hidden
                      />
                    )}
                    <span className="truncate" dir="auto" title={phase.name}>
                      {phase.name}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                      style.badge,
                    )}
                  >
                    {clampProgressPercent(phase.progress)}%
                  </span>
                </div>
                <Progress value={phase.progress} className="h-1.5" />
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
