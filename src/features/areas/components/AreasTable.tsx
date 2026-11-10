import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import Button from "@/shared/ui/Button"
import { IconButton } from "@/shared/ui/Button"
import Icon from "@/shared/ui/Icon"
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
import type { Area } from "../api"

export default function AreasTable({
  rows,
  isLoading,
  nameSort,
  citySort,
  villaCountSort,
  createdSort,
  onToggleNameSort,
  onToggleCitySort,
  onToggleVillaCountSort,
  onToggleCreatedSort,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  deleteDisabled,
  deleteDisabledTitle,
}: {
  rows: Area[]
  isLoading: boolean
  nameSort: "asc" | "desc" | "default" | "none"
  citySort: "asc" | "desc" | "none"
  villaCountSort: "asc" | "desc" | "none"
  createdSort: "asc" | "desc" | "none"
  onToggleNameSort: () => void
  onToggleCitySort: () => void
  onToggleVillaCountSort: () => void
  onToggleCreatedSort: () => void
  canUpdate: boolean
  canDelete: boolean
  onEdit: (row: Area) => void
  onDelete: (row: Area) => void
  deleteDisabled: (row: Area) => boolean
  deleteDisabledTitle: (row: Area) => string | undefined
}) {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const skeletonRows = 8
  const showActions = canUpdate || canDelete
  const colCount = showActions ? 4 : 3

  const sortIcon = (mode: "asc" | "desc" | "default" | "none") =>
    mode === "desc"
      ? "sortDesc"
      : mode === "asc" || mode === "default"
        ? "sortAsc"
        : "sort"

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground hover:bg-muted/60">
            <TableHead className="px-4 py-2.5 font-medium">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-0 py-0 text-xs uppercase tracking-wide hover:bg-transparent"
                onClick={onToggleNameSort}
                aria-sort={
                  nameSort === "desc"
                    ? "descending"
                    : nameSort === "asc" || nameSort === "default"
                      ? "ascending"
                      : "none"
                }
              >
                {t("areas.name")}
                <Icon name={sortIcon(nameSort)} size={14} />
              </Button>
            </TableHead>
            <TableHead className="px-4 py-2.5 font-medium">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-0 py-0 text-xs uppercase tracking-wide hover:bg-transparent"
                onClick={onToggleCitySort}
                aria-sort={
                  citySort === "desc"
                    ? "descending"
                    : citySort === "asc"
                      ? "ascending"
                      : "none"
                }
              >
                {t("areas.city")}
                <Icon name={sortIcon(citySort)} size={14} />
              </Button>
            </TableHead>
            <TableHead className="px-4 py-2.5 font-medium">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-0 py-0 text-xs uppercase tracking-wide hover:bg-transparent"
                onClick={onToggleVillaCountSort}
                aria-sort={
                  villaCountSort === "desc"
                    ? "descending"
                    : villaCountSort === "asc"
                      ? "ascending"
                      : "none"
                }
              >
                {t("areas.villaCount")}
                <Icon name={sortIcon(villaCountSort)} size={14} />
              </Button>
            </TableHead>
            {showActions && (
              <TableHead className="px-4 py-2.5 text-end font-medium">
                <span className="sr-only">{t("common.actions")}</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && rows.length === 0 ? (
            <TableBodySkeleton
              columns={colCount}
              rows={skeletonRows}
              cellClassName="px-4 py-3"
            />
          ) : (
            rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/40">
                <TableCell className="px-4 py-3 font-medium" dir="auto">
                  {row.name}
                </TableCell>
                <TableCell className="px-4 py-3" dir="auto">
                  {row.city}
                </TableCell>
                <TableCell className="px-4 py-3 tabular-nums">
                  {can("villas:read") ? (
                    <Badge tone="warn">{row.villaCount}</Badge>
                  ) : (
                    row.villaCount
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
                          disabled={deleteDisabled(row)}
                          title={deleteDisabledTitle(row)}
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
