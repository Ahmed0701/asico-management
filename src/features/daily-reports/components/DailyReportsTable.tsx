import { useTranslation } from "react-i18next"
import TruncatedText from "@/features/audit/components/TruncatedText"
import { IconButton } from "@/shared/ui/Button"
import { RowActions } from "@/shared/ui/DataTable"
import { Badge } from "@/shared/ui/Badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { TableBodySkeleton } from "@/shared/ui/loading-skeletons"
import { formatCalendarDateUtc } from "@/shared/lib/formatCalendarDateUtc"
import type { DailyReport, DailyReportSortField } from "../api"

function formatReportDate(iso: string): string {
  return formatCalendarDateUtc(`${iso}T00:00:00.000Z`)
}

function SortHead({
  label,
  field,
  sort,
  onToggle,
}: {
  label: string
  field: DailyReportSortField
  sort: string
  onToggle: (field: DailyReportSortField) => void
}) {
  const asc = `${field}:asc`
  const desc = `${field}:desc`
  const active = sort === asc || sort === desc
  return (
    <TableHead className="px-4 py-2.5">
      <button
        type="button"
        className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-foreground"
        onClick={() => onToggle(field)}
      >
        {label}
        {active && (
          <span aria-hidden className="text-[10px]">
            {sort === desc ? "↓" : "↑"}
          </span>
        )}
      </button>
    </TableHead>
  )
}

export default function DailyReportsTable({
  rows,
  isLoading,
  sort,
  onToggleSort,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  emptyMessage,
}: {
  rows: DailyReport[]
  isLoading: boolean
  sort: string
  onToggleSort: (field: DailyReportSortField) => void
  canUpdate: boolean
  canDelete: boolean
  onEdit: (row: DailyReport) => void
  onDelete: (row: DailyReport) => void
  emptyMessage: string
}) {
  const { t } = useTranslation()
  const showActions = canUpdate || canDelete
  const colCount = 7 + (showActions ? 1 : 0)

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table className="min-w-200">
        <TableHeader>
          <TableRow className="bg-muted/60 text-xs text-muted-foreground">
            <SortHead
              label={t("dailyReports.colDate")}
              field="reportDate"
              sort={sort}
              onToggle={onToggleSort}
            />
            <TableHead className="px-4 py-2.5">
              {t("dailyReports.colWeather")}
            </TableHead>
            <TableHead className="px-4 py-2.5">
              {t("dailyReports.colWorkers")}
            </TableHead>
            <SortHead
              label={t("dailyReports.colContractor")}
              field="contractorName"
              sort={sort}
              onToggle={onToggleSort}
            />
            <SortHead
              label={t("dailyReports.colPreparedBy")}
              field="preparedByName"
              sort={sort}
              onToggle={onToggleSort}
            />
            <TableHead className="px-4 py-2.5">
              {t("dailyReports.colNotes")}
            </TableHead>
            {showActions && (
              <TableHead className="px-4 py-2.5 text-end">
                <span className="sr-only">{t("common.actions")}</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && !rows.length ? (
            <TableBodySkeleton columns={colCount} rows={8} />
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={colCount}
                className="px-4 py-10 text-center text-sm text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/40">
                <TableCell className="px-4 py-3 tabular-nums">
                  {formatReportDate(row.reportDate)}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge tone="info">
                    {t(`dailyReports.weather.${row.weather}`)}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 tabular-nums">
                  {row.workersCount}
                </TableCell>
                <TableCell className="px-4 py-3" dir="auto">
                  {row.contractor.name}
                </TableCell>
                <TableCell className="px-4 py-3" dir="auto">
                  {row.preparedBy.name}
                </TableCell>
                <TableCell className="px-4 py-3" dir="auto">
                  {row.notes ? (
                    <TruncatedText
                      text={row.notes}
                      maxWidthClass="max-w-[16rem]"
                      dir="auto"
                    />
                  ) : (
                    "-"
                  )}
                </TableCell>
                {showActions && (
                  <TableCell className="px-4 py-3">
                    <RowActions>
                      {canUpdate && (
                        <IconButton
                          icon="edit"
                          label={t("common.edit")}
                          onClick={() => onEdit(row)}
                        />
                      )}
                      {canDelete && (
                        <IconButton
                          icon="trash"
                          label={t("common.delete")}
                          variant="danger"
                          onClick={() => onDelete(row)}
                        />
                      )}
                    </RowActions>
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
