import { useEffect, useRef } from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import TruncatedText from "@/features/audit/components/TruncatedText"
import { cn } from "@/shared/lib/cn"
import { IconButton } from "@/shared/ui/Button"
import { RowActions } from "@/shared/ui/DataTable"
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
import type { SmallWork, SmallWorkSortField } from "../api"
import SmallWorkAlertBadge from "./SmallWorkAlertBadge"
import SmallWorkStatusBadge from "./SmallWorkStatusBadge"

function formatCalendarDay(iso: string): string {
  return formatCalendarDateUtc(`${iso}T00:00:00.000Z`)
}

function SortHead({
  label,
  field,
  sort,
  onToggle,
}: {
  label: string
  field: SmallWorkSortField
  sort: string
  onToggle: (field: SmallWorkSortField) => void
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

export default function SmallWorksTable({
  rows,
  isLoading,
  sort,
  onToggleSort,
  showVillaColumn,
  highlightRowId,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  emptyMessage,
}: {
  rows: SmallWork[]
  isLoading: boolean
  sort: string
  onToggleSort: (field: SmallWorkSortField) => void
  showVillaColumn: boolean
  highlightRowId?: string
  canUpdate: boolean
  canDelete: boolean
  onEdit: (row: SmallWork) => void
  onDelete: (row: SmallWork) => void
  emptyMessage: string
}) {
  const { t } = useTranslation()
  const highlightRef = useRef<HTMLTableRowElement>(null)
  const showActions = canUpdate || canDelete
  const colCount = 6 + (showVillaColumn ? 1 : 0) + (showActions ? 1 : 0)

  useEffect(() => {
    if (!highlightRowId) return
    highlightRef.current?.scrollIntoView({ block: "nearest" })
  }, [highlightRowId, rows])

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table className="min-w-200">
        <TableHeader>
          <TableRow className="bg-muted/60 text-xs text-muted-foreground">
            {showVillaColumn && (
              <SortHead
                label={t("smallWorks.colLocation")}
                field="villaNumber"
                sort={sort}
                onToggle={onToggleSort}
              />
            )}
            <SortHead
              label={t("smallWorks.colContractor")}
              field="contractorName"
              sort={sort}
              onToggle={onToggleSort}
            />
            <SortHead
              label={t("smallWorks.colStartDate")}
              field="startDate"
              sort={sort}
              onToggle={onToggleSort}
            />
            <SortHead
              label={t("smallWorks.colEndDate")}
              field="endDate"
              sort={sort}
              onToggle={onToggleSort}
            />
            <TableHead className="px-4 py-2.5">
              {t("smallWorks.colDescription")}
            </TableHead>
            <SortHead
              label={t("smallWorks.colStatus")}
              field="status"
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
              <TableRow
                key={row.id}
                ref={row.id === highlightRowId ? highlightRef : undefined}
                className={cn(
                  "hover:bg-muted/40",
                  row.id === highlightRowId &&
                    "bg-accent/15 ring-1 ring-accent/40",
                )}
              >
                {showVillaColumn && (
                  <TableCell className="px-4 py-3" dir="auto">
                    <Link
                      to={`/villas/${row.villa.id}`}
                      className="font-medium hover:underline"
                    >
                      {row.villa.location}
                    </Link>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {row.villa.villaNumber}
                    </p>
                  </TableCell>
                )}
                <TableCell className="px-4 py-3" dir="auto">
                  {row.contractor.name}
                </TableCell>
                <TableCell className="px-4 py-3 tabular-nums">
                  {formatCalendarDay(row.startDate)}
                </TableCell>
                <TableCell className="px-4 py-3 tabular-nums">
                  {formatCalendarDay(row.endDate)}
                </TableCell>
                <TableCell className="px-4 py-3" dir="auto">
                  <TruncatedText
                    text={row.description}
                    maxWidthClass="max-w-[14rem]"
                    dir="auto"
                  />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <SmallWorkStatusBadge status={row.status} />
                    <SmallWorkAlertBadge row={row} />
                  </div>
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
