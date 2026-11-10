import { useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { useTranslation } from "react-i18next"
import { cn } from "../lib/cn"
import Button from "./Button"
import Icon from "./Icon"
import { Skeleton } from "./skeleton"

export type DataTablePagination = {
  pageIndex: number
  pageSize: number
  pageCount: number
  total: number
  onPageChange: (pageIndex: number) => void
  onPageSizeChange: (pageSize: number) => void
}

interface Props<T> {
  data: T[]
  columns: ColumnDef<T, any>[]
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  pageSize?: number
  pageSizeOptions?: number[]
  pagination?: DataTablePagination
  emptyTitle?: string
  emptyBody?: string
  errorTitle?: string
  errorBody?: string
}

export default function DataTable<T>({
  data,
  columns,
  isLoading,
  error,
  onRetry,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50],
  pagination,
  emptyTitle,
  emptyBody,
  errorTitle,
  errorBody,
}: Props<T>) {
  const { t } = useTranslation()
  const [sorting, setSorting] = useState<SortingState>([])
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      ...(pagination
        ? {
            pagination: {
              pageIndex: pagination.pageIndex,
              pageSize: pagination.pageSize,
            },
          }
        : {}),
    },
    onSortingChange: setSorting,
    onPaginationChange: pagination
      ? (updater) => {
          const current = {
            pageIndex: pagination.pageIndex,
            pageSize: pagination.pageSize,
          }
          const next =
            typeof updater === "function" ? updater(current) : updater
          if (next.pageSize !== current.pageSize)
            pagination.onPageSizeChange(next.pageSize)
          if (next.pageIndex !== current.pageIndex)
            pagination.onPageChange(next.pageIndex)
        }
      : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(pagination
      ? { manualPagination: true, pageCount: Math.max(pagination.pageCount, 1) }
      : {
          getPaginationRowModel: getPaginationRowModel(),
          initialState: { pagination: { pageSize } },
        }),
    autoResetPageIndex: !pagination,
  })

  const { pageIndex, pageSize: size } = pagination
    ? { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }
    : table.getState().pagination
  const pageCount = pagination
    ? Math.max(pagination.pageCount, 1)
    : Math.max(table.getPageCount(), 1)
  const resultTotal = pagination?.total ?? data.length

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-180 border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border bg-muted/60">
                {hg.headers.map((h) => {
                  const sorted = h.column.getIsSorted()
                  const canSort = h.column.getCanSort()
                  return (
                    <th
                      key={h.id}
                      scope="col"
                      aria-sort={
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : undefined
                      }
                      className="px-4 py-2.5 text-start text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      {h.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={h.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 uppercase transition hover:text-foreground"
                        >
                          {flexRender(
                            h.column.columnDef.header,
                            h.getContext(),
                          )}
                          <Icon
                            name={
                              sorted === "asc"
                                ? "sortAsc"
                                : sorted === "desc"
                                  ? "sortDesc"
                                  : "sort"
                            }
                            size={12}
                            className={cn(!sorted && "opacity-40")}
                          />
                        </button>
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 8 }, (_, i) => (
                <tr
                  key={i}
                  className="border-b border-table-border last:border-0"
                >
                  {columns.map((_, c) => (
                    <td key={c} className="px-4 py-3">
                      <Skeleton
                        className="h-4"
                        style={{ width: `${55 + ((i * 7 + c * 13) % 40)}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            {!isLoading && !error && table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-table-border transition last:border-0 hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2.5 align-middle">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {error && !isLoading && (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="grid size-10 place-items-center rounded-full bg-danger-soft text-danger">
            <Icon name="alert" />
          </span>
          <div>
            <p className="font-medium">
              {errorTitle ?? t("common.listErrorTitle")}
            </p>
            <p className="text-sm text-muted-foreground">
              {errorBody ?? error}
            </p>
          </div>
          {onRetry && <Button onClick={onRetry}>{t("common.retry")}</Button>}
        </div>
      )}

      {!isLoading && !error && data.length === 0 && (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
            <Icon name="inbox" />
          </span>
          <div>
            <p className="font-medium">
              {emptyTitle ?? t("common.listEmptyTitle")}
            </p>
            <p className="text-sm text-muted-foreground">
              {emptyBody ?? t("common.listEmptyBody")}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>{t("common.rowsPerPage")}</span>
          <select
            aria-label={t("common.rowsPerPage")}
            value={size}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="h-7 rounded-md border border-border bg-card px-1.5 text-foreground"
          >
            {pageSizeOptions.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
          <span className="ms-2 tabular-nums">
            {t("common.results", { count: resultTotal })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="tabular-nums">
            {t("common.pageOf", { page: pageIndex + 1, total: pageCount })}
          </span>
          <Button
            size="sm"
            icon="chevronLeft"
            aria-label={t("common.previous")}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rtl:[&_svg]:-scale-x-100"
          />
          <Button
            size="sm"
            icon="chevronRight"
            aria-label={t("common.next")}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rtl:[&_svg]:-scale-x-100"
          />
        </div>
      </div>
    </div>
  )
}

export function RowActions({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-end gap-0.5">{children}</div>
}

/** Icon-only table row action with tooltip. Prefer inside {@link RowActions}. */
export { IconButton as TableActionButton } from "./Button"
