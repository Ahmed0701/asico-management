import { useTranslation } from "react-i18next"
import type { VillaDetail } from "../api"
import { buildVillaContextLine } from "../lib/villaDetailDisplay"
import { formatDateTime } from "@/shared/lib/format"
import { Card } from "@/shared/ui/PageHeader"
import { IconButton } from "@/shared/ui/Button"
import { formatVillaProgressLabel } from "@/shared/lib/progressDisplay"
import { Progress } from "@/shared/ui/progress"

type VillaDetailHeroCardProps = {
  villa: VillaDetail
  canUpdate: boolean
  canDelete: boolean
  onEdit: () => void
  onDelete: () => void
}

export default function VillaDetailHeroCard({
  villa,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: VillaDetailHeroCardProps) {
  const { t } = useTranslation()
  const blockPlotLine =
    villa.block && villa.plot
      ? t("villas.blockPlotLine", { block: villa.block, plot: villa.plot })
      : null
  const contextLine = buildVillaContextLine(villa, blockPlotLine)

  return (
    <Card className="mb-4 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight tabular-nums">
            {villa.villaNumber}
          </h1>
          {contextLine && (
            <p className="mt-1 text-sm text-muted-foreground" dir="auto">
              {contextLine}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {canUpdate && (
            <IconButton icon="edit" label={t("common.edit")} onClick={onEdit} />
          )}
          {canDelete && (
            <IconButton
              icon="trash"
              label={t("common.delete")}
              variant="danger"
              onClick={onDelete}
            />
          )}
        </div>
      </div>
      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-3">
          <Progress value={villa.progress} className="h-2 min-w-0 flex-1" />
          <span className="shrink-0 text-lg font-semibold tabular-nums text-foreground">
            {formatVillaProgressLabel(villa.progress)}
          </span>
        </div>
        {villa.mewFollowUp && (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("villas.mewBadge")}: {formatDateTime(villa.mewFollowUp.at)}
            {villa.mewFollowUp.by
              ? ` · ${t("villas.readyMarkedBy", { name: villa.mewFollowUp.by.name })}`
              : ""}
          </p>
        )}
      </div>
    </Card>
  )
}
