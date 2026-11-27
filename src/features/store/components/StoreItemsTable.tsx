import { useTranslation } from "react-i18next"
import SortableHead from "@/shared/list/SortableHead"
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
import type { StoreItem, StoreMovementKind } from "../api"
import { formatQuantity, unitLabel } from "../lib/storeFormat"
import { StoreCategoryBadge, StoreStockBadge } from "./StoreBadges"
import ColoredItemName from "./ColoredItemName"

type Props = {
  rows: StoreItem[]
  loading: boolean
  /** The store on screen: the other stores' stock is shown under its own. */
  storeId?: string
  sort?: string
  onSort: (next: string | undefined) => void
  canMove: boolean
  canEdit: boolean
  canDelete: boolean
  onMove: (item: StoreItem, kind: StoreMovementKind) => void
  onHistory: (item: StoreItem) => void
  onEdit: (item: StoreItem) => void
  onDelete: (item: StoreItem) => void
}

/** The items and their stock; a low item's row is amber, an empty one red. */
export default function StoreItemsTable({
  rows,
  loading,
  storeId,
  sort,
  onSort,
  canMove,
  canEdit,
  canDelete,
  onMove,
  onHistory,
  onEdit,
  onDelete,
}: Props) {
  const { t } = useTranslation()
  const columnCount = 7

  return (
    <div className="list-surface overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="list-head-row">
            <SortableHead
              label={t("store.name")}
              field="name"
              sort={sort}
              onSort={onSort}
            />
            <SortableHead
              label={t("store.category")}
              field="category"
              sort={sort}
              onSort={onSort}
            />
            <SortableHead
              label={t("store.stock")}
              field="quantity"
              sort={sort}
              onSort={onSort}
            />
            <TableHead className="px-4 py-2.5">
              {t("store.minQuantity")}
            </TableHead>
            <TableHead className="px-4 py-2.5">{t("store.status")}</TableHead>
            <TableHead className="px-4 py-2.5">
              {t("store.lastMovement")}
            </TableHead>
            <TableHead className="px-4 py-2.5">
              <span className="sr-only">{t("common.actions")}</span>
            </TableHead>
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
                {t("store.empty")}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((item) => {
              const tone = !item.active
                ? undefined
                : item.quantity === 0
                  ? "danger"
                  : item.low
                    ? "warn"
                    : undefined
              return (
                <TableRow
                  key={item.id}
                  tone={tone}
                  className={item.active ? undefined : "opacity-60"}
                >
                  <TableCell className="px-4 py-3">
                    <p className="text-sm font-medium" dir="auto">
                      <ColoredItemName name={item.name} />
                    </p>
                    {item.factory && (
                      <p className="text-xs text-muted-foreground" dir="auto">
                        {item.factory.name}
                      </p>
                    )}
                    {item.notes && (
                      <p
                        className="max-w-xs truncate text-xs text-muted-foreground"
                        dir="auto"
                        title={item.notes}
                      >
                        {item.notes}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <StoreCategoryBadge category={item.category} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm tabular-nums">
                    <span className="font-semibold">
                      {formatQuantity(item.quantity)}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {unitLabel(item.unit)}
                    </span>
                    {item.stocks
                      .filter((stock) => stock.warehouse.id !== storeId)
                      .map((stock) => (
                        <span
                          key={stock.warehouse.id}
                          className="block text-xs text-muted-foreground"
                        >
                          {t("store.inOtherStore", {
                            store: stock.warehouse.name,
                            quantity: formatQuantity(stock.quantity),
                          })}
                        </span>
                      ))}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
                    {item.minQuantity == null
                      ? "-"
                      : `${formatQuantity(item.minQuantity)} ${unitLabel(item.unit)}`}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <StoreStockBadge item={item} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
                    {item.lastMovementAt
                      ? formatDateTime(item.lastMovementAt)
                      : "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="row-actions flex justify-end gap-1">
                      {canMove && item.active && (
                        <>
                          <IconButton
                            icon="download"
                            label={t("store.receiveOf", { name: item.name })}
                            onClick={() => onMove(item, "RECEIVE")}
                          />
                          <IconButton
                            icon="upload"
                            label={t("store.issueOf", { name: item.name })}
                            disabled={item.quantity === 0}
                            onClick={() => onMove(item, "ISSUE")}
                          />
                        </>
                      )}
                      <IconButton
                        icon="log"
                        label={t("store.historyOf", { name: item.name })}
                        onClick={() => onHistory(item)}
                      />
                      {canEdit && (
                        <IconButton
                          icon="edit"
                          label={t("common.edit")}
                          onClick={() => onEdit(item)}
                        />
                      )}
                      {canDelete && (
                        <IconButton
                          icon="trash"
                          label={t("common.delete")}
                          variant="danger"
                          onClick={() => onDelete(item)}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
