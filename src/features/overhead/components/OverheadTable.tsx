import { useTranslation } from "react-i18next"
import { formatBudgetDisplay } from "@/features/villas/api/budget"
import { PersonCell } from "@/shared/list/cells"
import SortableHead from "@/shared/list/SortableHead"
import { IconButton } from "@/shared/ui/Button"
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
import type { OverheadEmployee } from "../api"

type Props = {
  rows: OverheadEmployee[]
  loading: boolean
  sort: string | undefined
  onSort: (next: string | undefined) => void
  locale: string
  canEdit: boolean
  canDelete: boolean
  onEdit: (row: OverheadEmployee) => void
  onDelete: (row: OverheadEmployee) => void
}

/** The overhead employees: name, role and monthly salary, with edit and delete. */
export default function OverheadTable({
  rows,
  loading,
  sort,
  onSort,
  locale,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: Props) {
  const { t } = useTranslation()
  const withActions = canEdit || canDelete
  const columnCount = 3 + (withActions ? 1 : 0)

  return (
    <div className="list-surface overflow-x-auto">
      <Table className="min-w-160">
        <TableHeader>
          <TableRow className="list-head-row">
            <SortableHead
              label={t("overhead.name")}
              field="name"
              sort={sort}
              onSort={onSort}
            />
            <SortableHead
              label={t("overhead.role")}
              field="role"
              sort={sort}
              onSort={onSort}
            />
            <SortableHead
              label={t("overhead.salary")}
              field="salary"
              sort={sort}
              onSort={onSort}
              className="text-end"
            />
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
                {t("overhead.empty")}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="px-4 py-3">
                  <PersonCell name={row.name} />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                    {t(`overhead.roles.${row.role}`)}
                  </span>
                </TableCell>
                <TableCell
                  className="px-4 py-3 text-end font-semibold tabular-nums"
                  dir="ltr"
                >
                  {formatBudgetDisplay(row.salaryMinor, "KWD", locale)}
                </TableCell>
                {withActions && (
                  <TableCell className="px-4 py-3">
                    <RowActions>
                      {canEdit && (
                        <IconButton
                          icon="edit"
                          label={t("overhead.editOf", { name: row.name })}
                          onClick={() => onEdit(row)}
                        />
                      )}
                      {canDelete && (
                        <IconButton
                          icon="trash"
                          label={t("overhead.deleteOf", { name: row.name })}
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
