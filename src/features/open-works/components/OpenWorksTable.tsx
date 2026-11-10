import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { IconButton } from "@/shared/ui/Button"
import { RowActions } from "@/shared/ui/DataTable"
import ProgressCell from "@/shared/list/ProgressCell"
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
import type { OpenWork, OpenWorkSortField } from "../api"
import OpenWorkStatusBadge from "./OpenWorkStatusBadge"

function formatWorkDate(iso: string | null): string {
  if (!iso) return "-"
  return formatCalendarDateUtc(`${iso}T00:00:00.000Z`)
}

function SortHead({
  label,
  field,
  sort,
  onToggle,
}: {
  label: string
  field: OpenWorkSortField
  sort: string
  onToggle: (field: OpenWorkSortField) => void
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

export default function OpenWorksTable({
  rows,
  isLoading,
  sort,
  onToggleSort,
  showVillaColumn,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  emptyMessage,
}: {
  rows: OpenWork[]
  isLoading: boolean
  sort: string
  onToggleSort: (field: OpenWorkSortField) => void
  showVillaColumn: boolean
  canUpdate: boolean
  canDelete: boolean
  onEdit: (row: OpenWork) => void
  onDelete: (row: OpenWork) => void
  emptyMessage: string
}) {
  const { t } = useTranslation()
  const showActions = canUpdate || canDelete
  const colCount = 8 + (showVillaColumn ? 1 : 0) + (showActions ? 1 : 0)

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table className="min-w-240">
        <TableHeader>
          <TableRow className="bg-muted/60 text-xs text-muted-foreground">
            {showVillaColumn && (
              <SortHead
                label={t("openWorks.colLocation")}
                field="location"
                sort={sort}
                onToggle={onToggleSort}
              />
            )}
            <SortHead
              label={t("openWorks.colElecPhase")}
              field="elecPhaseName"
              sort={sort}
              onToggle={onToggleSort}
            />
            <SortHead
              label={t("openWorks.colStatus")}
              field="status"
              sort={sort}
              onToggle={onToggleSort}
            />
            <SortHead
              label={t("openWorks.colPriority")}
              field="priority"
              sort={sort}
              onToggle={onToggleSort}
            />
            <SortHead
              label={t("openWorks.colProgress")}
              field="progress"
              sort={sort}
              onToggle={onToggleSort}
            />
            <TableHead className="px-4 py-2.5">
              {t("openWorks.colContractor")}
            </TableHead>
            <SortHead
              label={t("openWorks.colStartDate")}
              field="startDate"
              sort={sort}
              onToggle={onToggleSort}
            />
            <SortHead
              label={t("openWorks.colEndDate")}
              field="endDate"
              sort={sort}
              onToggle={onToggleSort}
            />
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
                {showVillaColumn && (
                  <TableCell className="px-4 py-3" dir="auto">
                    <Link
                      to={`/villas/${row.villa.id}`}
                      className="font-medium tabular-nums hover:underline"
                    >
                      {row.villa.villaNumber}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {row.villa.location}
                    </p>
                  </TableCell>
                )}
                <TableCell className="px-4 py-3 font-medium" dir="auto">
                  {row.elecPhase.name}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex flex-col items-start gap-1">
                    <OpenWorkStatusBadge status={row.status} />
                    {row.overdue && (
                      <Badge tone="danger">
                        {t("openWorks.overdueBadge")}
                        {row.overdueDays > 0 &&
                          ` - ${t("openWorks.daysLate", { count: row.overdueDays })}`}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3">
                  {t(`openWorks.priority.${row.priority}`)}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <ProgressCell value={row.progress} />
                </TableCell>
                <TableCell className="px-4 py-3" dir="auto">
                  {row.contractor?.name ?? "-"}
                </TableCell>
                <TableCell className="px-4 py-3 tabular-nums">
                  {formatWorkDate(row.startDate)}
                </TableCell>
                <TableCell
                  className={
                    row.overdue
                      ? "px-4 py-3 tabular-nums font-medium text-danger"
                      : "px-4 py-3 tabular-nums"
                  }
                >
                  {formatWorkDate(row.endDate)}
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
