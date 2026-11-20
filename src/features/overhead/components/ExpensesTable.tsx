import { useTranslation } from "react-i18next"
import { formatBudgetDisplay } from "@/features/villas/api/budget"
import { formatCalendarDateUtc } from "@/shared/lib/formatCalendarDateUtc"
import { VillaCell } from "@/shared/list/cells"
import SortableHead from "@/shared/list/SortableHead"
import Button, { IconButton } from "@/shared/ui/Button"
import { RowActions } from "@/shared/ui/DataTable"
import { TableBodySkeleton } from "@/shared/ui/loading-skeletons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import type { OverheadExpense } from "../api"

type Props = {
  rows: OverheadExpense[]
  loading: boolean
  sort: string | undefined
  onSort: (next: string | undefined) => void
  locale: string
  canEdit: boolean
  canDelete: boolean
  onEdit: (row: OverheadExpense) => void
  onDelete: (row: OverheadExpense) => void
  onFiles: (row: OverheadExpense) => void
}

/** The additional expenses: date, villa, type, description and invoice number, amount, and the invoice files. */
export default function ExpensesTable({
  rows,
  loading,
  sort,
  onSort,
  locale,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onFiles,
}: Props) {
  const { t } = useTranslation()
  const withActions = canEdit || canDelete
  const columnCount = 6 + (withActions ? 1 : 0)

  return (
    <div className="list-surface overflow-x-auto">
      <Table className="min-w-220">
        <TableHeader>
          <TableRow className="list-head-row">
            <SortableHead
              label={t("overhead.expenses.date")}
              field="expenseDate"
              sort={sort}
              onSort={onSort}
            />
            <SortableHead
              label={t("overhead.expenses.villa")}
              field="villaNumber"
              sort={sort}
              onSort={onSort}
            />
            <TableHead className="px-4 py-2.5">
              {t("overhead.expenses.type")}
            </TableHead>
            <TableHead className="px-4 py-2.5">
              {t("overhead.expenses.description")}
            </TableHead>
            <SortableHead
              label={t("overhead.expenses.amount")}
              field="amount"
              sort={sort}
              onSort={onSort}
              className="text-end"
            />
            <TableHead className="px-4 py-2.5">
              {t("overhead.expenses.files")}
            </TableHead>
            {withActions && (
              <TableHead className="px-4 py-2.5">
                <span className="sr-only">{t("common.actions")}</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && rows.length === 0 ? (
            <TableBodySkeleton columns={columnCount} rows={6} />
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columnCount}
                className="list-empty px-4 py-10 text-center text-sm text-muted-foreground"
              >
                {t("overhead.expenses.empty")}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="px-4 py-3 text-sm tabular-nums whitespace-nowrap">
                  {formatCalendarDateUtc(`${row.expenseDate}T00:00:00.000Z`)}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <VillaCell
                    id={row.villa.id}
                    villaNumber={row.villa.villaNumber}
                  />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium whitespace-nowrap">
                    {t(`overhead.expenses.types.${row.type}`)}
                  </span>
                </TableCell>
                <TableCell className="max-w-80 px-4 py-3 text-sm">
                  <span className="line-clamp-2" dir="auto">
                    {row.description}
                  </span>
                  {row.invoiceNumber && (
                    <span
                      className="block text-xs text-muted-foreground"
                      dir="auto"
                    >
                      {t("overhead.expenses.invoiceNo", {
                        number: row.invoiceNumber,
                      })}
                    </span>
                  )}
                </TableCell>
                <TableCell
                  className="px-4 py-3 text-end font-semibold tabular-nums whitespace-nowrap"
                  dir="ltr"
                >
                  {formatBudgetDisplay(row.amountMinor, "KWD", locale)}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Button
                    type="button"
                    size="sm"
                    icon="file"
                    aria-label={t("overhead.expenses.filesOf", {
                      name: row.description,
                    })}
                    onClick={() => onFiles(row)}
                  >
                    {row.files.length}
                  </Button>
                </TableCell>
                {withActions && (
                  <TableCell className="px-4 py-3">
                    <RowActions>
                      {canEdit && (
                        <IconButton
                          icon="edit"
                          label={t("overhead.expenses.editOf", {
                            name: row.description,
                          })}
                          onClick={() => onEdit(row)}
                        />
                      )}
                      {canDelete && (
                        <IconButton
                          icon="trash"
                          label={t("overhead.expenses.deleteOf", {
                            name: row.description,
                          })}
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
