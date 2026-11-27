import { useTranslation } from "react-i18next"
import { formatDateTime } from "@/shared/lib/format"
import { IconButton } from "@/shared/ui/Button"
import { TableBodySkeleton } from "@/shared/ui/loading-skeletons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import type { StoreItemName } from "../api"
import { unitLabel } from "../lib/storeFormat"
import { StoreCategoryBadge } from "./StoreBadges"
import ColoredItemName from "./ColoredItemName"

type Props = {
  rows: StoreItemName[]
  loading: boolean
  canEdit: boolean
  canDelete: boolean
  onEdit: (entry: StoreItemName) => void
  onDelete: (entry: StoreItemName) => void
}

/** The names of the items reference list, with their category. */
export default function ItemReferenceTable({
  rows,
  loading,
  canEdit,
  onEdit,
  canDelete,
  onDelete,
}: Props) {
  const { t } = useTranslation()
  const columnCount = 5 + (canEdit || canDelete ? 1 : 0)

  return (
    <div className="list-surface overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="list-head-row">
            <TableHead className="px-4 py-2.5">{t("store.itemName")}</TableHead>
            <TableHead className="px-4 py-2.5">{t("store.category")}</TableHead>
            <TableHead className="px-4 py-2.5">{t("store.factory")}</TableHead>
            <TableHead className="px-4 py-2.5">{t("store.unit")}</TableHead>
            <TableHead className="px-4 py-2.5">{t("store.addedAt")}</TableHead>
            {(canEdit || canDelete) && (
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
                className="px-4 py-10 text-center text-sm text-muted-foreground"
              >
                {t("store.noNames")}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="px-4 py-3 text-sm font-medium" dir="auto">
                  <ColoredItemName name={entry.name} />
                </TableCell>
                <TableCell className="px-4 py-3">
                  <StoreCategoryBadge category={entry.category} />
                </TableCell>
                <TableCell className="px-4 py-3 text-sm" dir="auto">
                  {entry.factory?.name ?? "-"}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  {unitLabel(entry.unit)}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
                  {formatDateTime(entry.createdAt)}
                </TableCell>
                {(canEdit || canDelete) && (
                  <TableCell className="px-4 py-3">
                    <div className="row-actions flex justify-end gap-1">
                      {canEdit && (
                        <IconButton
                          icon="edit"
                          label={t("store.editOf", { name: entry.name })}
                          onClick={() => onEdit(entry)}
                        />
                      )}
                      {canDelete && (
                        <IconButton
                          icon="trash"
                          variant="danger"
                          label={t("store.deleteItemNameOf", {
                            name: entry.name,
                          })}
                          onClick={() => onDelete(entry)}
                        />
                      )}
                    </div>
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
