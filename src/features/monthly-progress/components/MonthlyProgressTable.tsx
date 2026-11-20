import { PersonCell, VillaCell } from "@/shared/list/cells"
import { useTranslation } from "react-i18next"
import { formatBudgetDisplay } from "@/features/villas/api/budget"
import { cn } from "@/shared/lib/cn"
import { formatDateTime } from "@/shared/lib/format"
import Button from "@/shared/ui/Button"
import Icon from "@/shared/ui/Icon"
import { TableBodySkeleton } from "@/shared/ui/loading-skeletons"
import { Progress } from "@/shared/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import type { MonthlyProgressItem, MonthlyProgressSortField } from "../api"

type SortMode = "asc" | "desc" | "none"

type SortHeadProps = {
  field: MonthlyProgressSortField
  label: string
  sortOf: (field: MonthlyProgressSortField) => SortMode
  onSort: (field: MonthlyProgressSortField) => void
  end?: boolean
}

function SortHead({ field, label, sortOf, onSort, end }: SortHeadProps) {
  const mode = sortOf(field)
  return (
    <TableHead
      className={cn("px-4 py-2.5", end && "text-end")}
      aria-sort={
        mode === "desc" ? "descending" : mode === "asc" ? "ascending" : "none"
      }
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-auto px-0 py-0 text-xs uppercase tracking-wide hover:bg-transparent"
        onClick={() => onSort(field)}
      >
        {label}
        <Icon
          name={
            mode === "desc" ? "sortDesc" : mode === "asc" ? "sortAsc" : "sort"
          }
          size={14}
        />
      </Button>
    </TableHead>
  )
}

type Props = {
  rows: MonthlyProgressItem[]
  loading: boolean
  sortOf: (field: MonthlyProgressSortField) => SortMode
  onSort: (field: MonthlyProgressSortField) => void
  canPay: boolean
  canUndo: boolean
  busyId: string | null
  onPay: (row: MonthlyProgressItem) => void
  onUndo: (row: MonthlyProgressItem) => void
}

/**
 * Each villa: when its open works last changed, its last payment, its progress now and the part not paid yet, its Work
 * Order Value and what its contractor is owed now, with the button to pay it.
 */
export default function MonthlyProgressTable({
  rows,
  loading,
  sortOf,
  onSort,
  canPay,
  canUndo,
  busyId,
  onPay,
  onUndo,
}: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB"
  const kwd = (minor: number) => formatBudgetDisplay(minor, "KWD", locale)
  const columnCount = 8 + (canPay ? 1 : 0)
  const sort = { sortOf, onSort }

  return (
    <div className="list-surface overflow-x-auto">
      <Table className="min-w-260">
        <TableHeader>
          <TableRow className="list-head-row">
            <SortHead
              field="villaNumber"
              label={t("monthlyProgress.villaNumber")}
              {...sort}
            />
            <TableHead className="px-4 py-2.5">
              {t("monthlyProgress.contractor")}
            </TableHead>
            <TableHead className="px-4 py-2.5">
              {t("monthlyProgress.lastUpdate")}
            </TableHead>
            <TableHead className="px-4 py-2.5">
              {t("monthlyProgress.lastPayment")}
            </TableHead>
            <SortHead
              field="current"
              label={t("monthlyProgress.current")}
              {...sort}
            />
            <SortHead
              field="unpaid"
              label={t("monthlyProgress.unpaid")}
              {...sort}
            />
            <TableHead className="px-4 py-2.5 text-end">
              {t("monthlyProgress.workOrder")}
            </TableHead>
            <SortHead
              field="due"
              label={t("monthlyProgress.due")}
              end
              {...sort}
            />
            {canPay && (
              <TableHead className="px-4 py-2.5">
                <span className="sr-only">{t("common.actions")}</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && rows.length === 0 ? (
            <TableBodySkeleton columns={columnCount} rows={8} />
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columnCount}
                className="list-empty px-4 py-10 text-center text-sm text-muted-foreground"
              >
                {t("monthlyProgress.empty")}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.villa.id}
                tone={row.dueMinor > 0 ? "success" : undefined}
              >
                <TableCell className="px-4 py-3 text-sm font-medium">
                  <VillaCell
                    id={row.villa.id}
                    villaNumber={row.villa.villaNumber}
                    sub={row.villa.location}
                  />
                </TableCell>
                <TableCell className="px-4 py-3 text-sm" dir="auto">
                  <PersonCell name={row.contractor?.name} />
                </TableCell>
                <TableCell className="px-4 py-3 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                  {row.lastUpdatedAt
                    ? formatDateTime(row.lastUpdatedAt)
                    : t("monthlyProgress.noWorks")}
                </TableCell>
                <TableCell className="px-4 py-3 text-xs whitespace-nowrap">
                  {row.lastPayment ? (
                    <div className="grid gap-0.5">
                      <span className="font-semibold tabular-nums" dir="ltr">
                        {kwd(row.lastPayment.amountMinor)}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {t("monthlyProgress.paidUpTo", {
                          ratio: row.lastPayment.ratio,
                        })}
                        {" · "}
                        {formatDateTime(row.lastPayment.paidAt)}
                      </span>
                      {canUndo && (
                        <button
                          type="button"
                          className="justify-self-start text-accent hover:underline disabled:opacity-50"
                          disabled={busyId === row.villa.id}
                          onClick={() => onUndo(row)}
                        >
                          {t("monthlyProgress.undo")}
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      {t("monthlyProgress.neverPaid")}
                    </span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex min-w-28 items-center gap-2">
                    <Progress
                      value={row.currentProgress}
                      className="h-1.5 flex-1"
                    />
                    <span className="w-12 shrink-0 text-end text-sm tabular-nums">
                      {row.currentProgress}%
                    </span>
                  </div>
                </TableCell>
                <TableCell
                  className={cn(
                    "px-4 py-3 text-sm font-semibold tabular-nums",
                    row.unpaidProgress > 0
                      ? "text-success"
                      : "text-muted-foreground",
                  )}
                >
                  {row.unpaidProgress > 0 ? `+${row.unpaidProgress}%` : "0%"}
                </TableCell>
                <TableCell
                  className="px-4 py-3 text-end text-sm tabular-nums whitespace-nowrap"
                  dir="ltr"
                >
                  {row.workOrderMinor === null ? (
                    <span className="text-xs text-muted-foreground">
                      {t("monthlyProgress.noWorkOrder")}
                    </span>
                  ) : (
                    kwd(row.workOrderMinor)
                  )}
                </TableCell>
                <TableCell
                  className={cn(
                    "px-4 py-3 text-end text-sm font-semibold tabular-nums whitespace-nowrap",
                    row.dueMinor > 0 ? "text-success" : "text-muted-foreground",
                  )}
                  dir="ltr"
                >
                  {row.dueMinor > 0 ? kwd(row.dueMinor) : "-"}
                </TableCell>
                {canPay && (
                  <TableCell className="px-4 py-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      disabled={row.dueMinor <= 0 || busyId === row.villa.id}
                      onClick={() => onPay(row)}
                      aria-label={t("monthlyProgress.payOf", {
                        name: row.villa.villaNumber,
                      })}
                    >
                      {t("monthlyProgress.pay")}
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
