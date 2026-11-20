import { useTranslation } from "react-i18next"
import { ClipboardList } from "lucide-react"
import { VillaCell } from "@/shared/list/cells"
import ProgressCell from "@/shared/list/ProgressCell"
import SortableHead from "@/shared/list/SortableHead"
import { cn } from "@/shared/lib/cn"
import { formatDate, formatDateTime } from "@/shared/lib/format"
import Button, { IconButton } from "@/shared/ui/Button"
import { Input } from "@/shared/ui/input"
import { TableBodySkeleton } from "@/shared/ui/loading-skeletons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import type { MewStatesInput, VillaListItem } from "../api"
import MewStateSelect from "./MewStateSelect"
import { daysSince, mewStageOf, type MewStage } from "./mewFollowUpStage"

const COLUMN_COUNT = 7

const STAGE_STYLE: Record<MewStage, string> = {
  waiting: "bg-progress-soft text-progress",
  ready: "bg-success-soft text-success",
  inspection: "bg-open-soft text-open",
}

type Props = {
  rows: VillaListItem[]
  loading: boolean
  sort: string | undefined
  onSort: (next: string | undefined) => void
  canEdit: boolean
  busyId: string | null
  onSaveMew: (row: VillaListItem, input: MewStatesInput) => void
  onToggleInspection: (row: VillaListItem) => void
  onRemove: (row: VillaListItem) => void
}

// Where the villa stands, as a coloured pill with a dot.
function StagePill({ stage }: { stage: MewStage }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        STAGE_STYLE[stage],
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {t(`mewFollowUp.stages.${stage}`)}
    </span>
  )
}

/**
 * The villas on MEW follow up: the villa with its owner and location, its progress, its two MEW approvals side by side,
 * the MEW inspection day, where it stands, how long it has been on the list, and the actions. Approved rows are green.
 */
export default function MewFollowUpTable({
  rows,
  loading,
  sort,
  onSort,
  canEdit,
  busyId,
  onSaveMew,
  onToggleInspection,
  onRemove,
}: Props) {
  const { t } = useTranslation()
  const head = "px-4 py-2.5"

  return (
    <div className="list-surface overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-240">
          <TableHeader>
            <TableRow className="list-head-row">
              <SortableHead
                label={t("villas.villaNumber")}
                field="villaNumber"
                sort={sort}
                onSort={onSort}
              />
              <TableHead className={head}>{t("villas.progress")}</TableHead>
              <TableHead className={head}>
                {t("mewFollowUp.approvals")}
              </TableHead>
              <TableHead className={head}>
                {t("mewFollowUp.inspectionDate")}
              </TableHead>
              <TableHead className={head}>{t("mewFollowUp.stage")}</TableHead>
              <TableHead className={head}>{t("mewFollowUp.since")}</TableHead>
              <TableHead className={cn(head, "text-end")}>
                <span className="sr-only">{t("common.actions")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && rows.length === 0 ? (
              <TableBodySkeleton columns={COLUMN_COUNT} rows={8} />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="px-4 py-14">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-center">
                    <span className="grid size-12 place-items-center rounded-2xl bg-accent/10 text-accent">
                      <ClipboardList size={22} strokeWidth={1.8} aria-hidden />
                    </span>
                    <p className="text-sm font-medium">
                      {t("mewFollowUp.empty")}
                    </p>
                    {canEdit && (
                      <p className="text-xs text-muted-foreground">
                        {t("mewFollowUp.emptyHint")}
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const stage = mewStageOf(row)
                const busy = busyId === row.id
                const days = row.mewFollowUp
                  ? daysSince(row.mewFollowUp.at)
                  : null
                return (
                  <TableRow
                    key={row.id}
                    tone={stage === "ready" ? "success" : undefined}
                  >
                    <TableCell className="px-4 py-3">
                      <div className="grid gap-0.5">
                        <span className="font-semibold">
                          <VillaCell
                            id={row.id}
                            villaNumber={row.villaNumber}
                          />
                        </span>
                        <span
                          className="truncate text-xs text-muted-foreground"
                          dir="auto"
                        >
                          {row.ownerName ?? t("mewFollowUp.noOwner")}
                        </span>
                        <span
                          className="truncate text-xs text-muted-foreground"
                          dir="auto"
                        >
                          {row.location}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <ProgressCell value={row.progress} />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="grid gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-10 shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            {t("mewFollowUp.ac")}
                          </span>
                          <MewStateSelect
                            value={row.mewAcState}
                            label={t("mewFollowUp.acState")}
                            canEdit={canEdit}
                            disabled={busy}
                            onChange={(next) =>
                              onSaveMew(row, { mewAcState: next })
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-10 shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            {t("mewFollowUp.elec")}
                          </span>
                          <MewStateSelect
                            value={row.mewElecState}
                            label={t("mewFollowUp.elecState")}
                            canEdit={canEdit}
                            disabled={busy}
                            onChange={(next) =>
                              onSaveMew(row, { mewElecState: next })
                            }
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {canEdit ? (
                        <Input
                          type="date"
                          className="h-8 w-40 text-xs"
                          aria-label={t("mewFollowUp.inspectionDate")}
                          value={row.mewInspectionDate ?? ""}
                          disabled={busy}
                          onChange={(e) =>
                            onSaveMew(row, {
                              mewInspectionDate: e.target.value || null,
                            })
                          }
                        />
                      ) : (
                        <span className="text-sm tabular-nums">
                          {row.mewInspectionDate
                            ? formatDate(row.mewInspectionDate)
                            : t("mewFollowUp.notScheduled")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <StagePill stage={stage} />
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      {row.mewFollowUp && days !== null ? (
                        <span
                          className="grid"
                          title={formatDateTime(row.mewFollowUp.at)}
                        >
                          <span className="text-sm font-medium tabular-nums">
                            {days === 0
                              ? t("mewFollowUp.today")
                              : t("mewFollowUp.daysAgo", { count: days })}
                          </span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {formatDate(row.mewFollowUp.at)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {canEdit && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            size="sm"
                            icon={row.mewInspection ? "x" : "check"}
                            variant={
                              row.mewInspection ? "secondary" : "primary"
                            }
                            disabled={busy || stage === "waiting"}
                            title={
                              stage === "waiting"
                                ? t("mewFollowUp.approveFirst")
                                : undefined
                            }
                            onClick={() => onToggleInspection(row)}
                          >
                            {row.mewInspection
                              ? t("mewFollowUp.removeFromInspection")
                              : t("mewFollowUp.addToInspection")}
                          </Button>
                          <IconButton
                            icon="trash"
                            variant="danger"
                            label={t("mewFollowUp.remove")}
                            disabled={busy}
                            onClick={() => onRemove(row)}
                          />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
