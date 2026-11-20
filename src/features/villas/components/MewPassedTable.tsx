import { useTranslation } from "react-i18next"
import { BadgeCheck } from "lucide-react"
import { VillaCell } from "@/shared/list/cells"
import SortableHead from "@/shared/list/SortableHead"
import { cn } from "@/shared/lib/cn"
import { formatDate, formatDateTime } from "@/shared/lib/format"
import Button from "@/shared/ui/Button"
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
import { daysSince } from "./mewFollowUpStage"

const COLUMN_COUNT = 6

type Props = {
  rows: VillaListItem[]
  loading: boolean
  sort: string | undefined
  onSort: (next: string | undefined) => void
  canEdit: boolean
  busyId: string | null
  reportOf: (villaId: string) => MewReport | undefined
  onTakeBack: (row: VillaListItem) => void
}

/**
 * The villas that passed the MEW inspection: the villa with its owner and location, its two MEW approvals and inspection
 * day, when it passed (and who said so), its inspection report, and the button that sends it back to the inspection list.
 */
export default function MewPassedTable({
  rows,
  loading,
  sort,
  onSort,
  canEdit,
  busyId,
  reportOf,
  onTakeBack,
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
              <TableHead className={head}>
                {t("mewFollowUp.approvals")}
              </TableHead>
              <TableHead className={head}>
                {t("mewFollowUp.inspectionDate")}
              </TableHead>
              <TableHead className={head}>
                {t("mewInspectionPassed.passedOn")}
              </TableHead>
              <TableHead className={head}>
                {t("mewInspection.report.title")}
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
                    <span className="grid size-12 place-items-center rounded-2xl bg-success-soft text-success">
                      <BadgeCheck size={22} strokeWidth={1.8} aria-hidden />
                    </span>
                    <p className="text-sm font-medium">
                      {t("mewInspectionPassed.empty")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("mewInspectionPassed.emptyHint")}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const passed = row.mewInspectionPassed
                const days = passed ? daysSince(passed.at) : null
                return (
                  <TableRow key={row.id} tone="success">
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
                    <TableCell className="px-4 py-3 text-sm tabular-nums whitespace-nowrap">
                      {row.mewInspectionDate ? (
                        formatDate(row.mewInspectionDate)
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {t("mewFollowUp.notScheduled")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      {passed && days !== null ? (
                        <span
                          className="grid"
                          title={formatDateTime(passed.at)}
                        >
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
                            <BadgeCheck size={14} aria-hidden />
                            <span className="tabular-nums">
                              {formatDate(passed.at)}
                            </span>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {days === 0
                              ? t("mewFollowUp.today")
                              : t("mewInspectionPassed.ago", { count: days })}
                            {passed.by ? ` · ${passed.by.name}` : ""}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <MewReportCell
                        villaId={row.id}
                        villaNumber={row.villaNumber}
                        report={reportOf(row.id)}
                        canEdit={canEdit}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-end">
                      {canEdit && (
                        <Button
                          type="button"
                          size="sm"
                          icon="chevronLeft"
                          disabled={busyId === row.id}
                          aria-label={t("mewInspectionPassed.takeBack", {
                            name: row.villaNumber,
                          })}
                          onClick={() => onTakeBack(row)}
                        >
                          {t("mewInspectionPassed.moveBack")}
                        </Button>
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
