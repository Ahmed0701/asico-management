import { useTranslation } from "react-i18next"
import { ClipboardCheck } from "lucide-react"
import { VillaCell } from "@/shared/list/cells"
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
import type { MewReport, VillaListItem } from "../api"
import MewApprovalPill from "./MewApprovalPill"
import MewReportCell from "./MewReportCell"
import { daysSince, daysUntil } from "./mewFollowUpStage"

const COLUMN_COUNT = 7

type Props = {
  rows: VillaListItem[]
  loading: boolean
  sort: string | undefined
  onSort: (next: string | undefined) => void
  canEdit: boolean
  busyId: string | null
  reportOf: (villaId: string) => MewReport | undefined
  onSaveDate: (row: VillaListItem, day: string) => void
  onPassed: (row: VillaListItem) => void
  onRemove: (row: VillaListItem) => void
}

// How far the inspection day is: in some days, today, or some days ago (late).
function DayHint({ day }: { day: string }) {
  const { t } = useTranslation()
  const days = daysUntil(day)
  const tone =
    days < 0
      ? "text-danger"
      : days === 0
        ? "text-progress"
        : "text-muted-foreground"
  const text =
    days < 0
      ? t("mewInspection.daysLate", { count: -days })
      : days === 0
        ? t("mewInspection.inspectionToday")
        : t("mewInspection.inDays", { count: days })
  return <span className={cn("text-[11px] font-medium", tone)}>{text}</span>
}

/**
 * The villas waiting for their MEW inspection: the villa with its owner and location, its two MEW approvals, the
 * inspection day with how far it is, the inspection report, how long it has been on the list, and the actions (passed,
 * remove). A villa past its inspection day stands out.
 */
export default function MewInspectionTable({
  rows,
  loading,
  sort,
  onSort,
  canEdit,
  busyId,
  reportOf,
  onSaveDate,
  onPassed,
  onRemove,
}: Props) {
  const { t } = useTranslation()
  const head = "px-4 py-2.5"

  return (
    <div className="list-surface overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-260">
          <TableHeader>
            <TableRow className="list-head-row">
              <SortableHead
                label={t("villas.villaNumber")}
                field="villaNumber"
                sort={sort}
                onSort={onSort}
              />
              <TableHead className={head}>
                {t("mewFollowUp.approvals")}
              </TableHead>
              <TableHead className={head}>
                {t("mewFollowUp.inspectionDate")}
              </TableHead>
              <TableHead className={head}>
                {t("mewInspection.report.title")}
              </TableHead>
              <TableHead className={head}>{t("mewInspection.since")}</TableHead>
              <TableHead className={head}>
                {t("mewInspection.result")}
              </TableHead>
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
                      <ClipboardCheck size={22} strokeWidth={1.8} aria-hidden />
                    </span>
                    <p className="text-sm font-medium">
                      {t("mewInspection.empty")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("mewInspection.emptyHint")}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const busy = busyId === row.id
                const late =
                  row.mewInspectionDate !== null &&
                  daysUntil(row.mewInspectionDate) < 0
                const onListDays = row.mewInspection
                  ? daysSince(row.mewInspection.at)
                  : null
                return (
                  <TableRow key={row.id} tone={late ? "danger" : undefined}>
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
                      <div className="flex flex-col items-start gap-1">
                        <MewApprovalPill
                          label={t("mewFollowUp.ac")}
                          state={row.mewAcState}
                        />
                        <MewApprovalPill
                          label={t("mewFollowUp.elec")}
                          state={row.mewElecState}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="grid gap-1">
                        {canEdit ? (
                          <Input
                            type="date"
                            className="h-8 w-40 text-xs"
                            aria-label={t("mewFollowUp.inspectionDate")}
                            value={row.mewInspectionDate ?? ""}
                            disabled={busy}
                            onChange={(e) => onSaveDate(row, e.target.value)}
                          />
                        ) : (
                          <span className="text-sm tabular-nums">
                            {row.mewInspectionDate
                              ? formatDate(row.mewInspectionDate)
                              : t("mewFollowUp.notScheduled")}
                          </span>
                        )}
                        {row.mewInspectionDate ? (
                          <DayHint day={row.mewInspectionDate} />
                        ) : (
                          canEdit && (
                            <span className="text-[11px] text-muted-foreground">
                              {t("mewFollowUp.notScheduled")}
                            </span>
                          )
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <MewReportCell
                        villaId={row.id}
                        villaNumber={row.villaNumber}
                        report={reportOf(row.id)}
                        canEdit={canEdit}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      {row.mewInspection && onListDays !== null ? (
                        <span
                          className="grid"
                          title={formatDateTime(row.mewInspection.at)}
                        >
                          <span className="text-sm font-medium tabular-nums">
                            {onListDays === 0
                              ? t("mewFollowUp.today")
                              : t("mewFollowUp.daysAgo", { count: onListDays })}
                          </span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {formatDate(row.mewInspection.at)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                          <span aria-hidden className="size-1.5 rounded-full bg-current" />
                          {t("mewInspection.notPassedYet")}
                        </span>
                        {canEdit && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            icon="check"
                            disabled={busy}
                            aria-label={t("mewInspection.markPassed", {
                              name: row.villaNumber,
                            })}
                            onClick={() => onPassed(row)}
                          >
                            {t("mewInspection.markAsPassed")}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-end">
                      {canEdit && (
                        <IconButton
                          icon="x"
                          label={t("mewFollowUp.removeFromInspection")}
                          disabled={busy}
                          onClick={() => onRemove(row)}
                        />
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
