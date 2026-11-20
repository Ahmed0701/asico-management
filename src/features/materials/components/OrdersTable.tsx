import { useTranslation } from "react-i18next"
import { VillaCell } from "@/shared/list/cells"
import { formatDate } from "@/shared/lib/format"
import Button from "@/shared/ui/Button"
import { TableBodySkeleton } from "@/shared/ui/loading-skeletons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import type { MaterialOrder } from "../api"
import OrderStatusBadge from "./OrderStatusBadge"

type Props = {
  rows: MaterialOrder[]
  loading: boolean
  canEdit: boolean
  dueSort: "asc" | "desc" | "none"
  onSortDue: () => void
  onEdit: (order: MaterialOrder) => void
}

// A date as entered; else the one on the delivery notes, marked as such; else a dash.
function DateCell({
  entered,
  fromNotes,
}: {
  entered: string | null
  fromNotes?: string | null
}) {
  const { t } = useTranslation()
  if (entered) return <span>{formatDate(entered)}</span>
  if (fromNotes) {
    return (
      <span className="grid">
        <span>{formatDate(fromNotes)}</span>
        <span className="text-[11px] text-muted-foreground">
          {t("materials.orders.fromNotes")}
        </span>
      </span>
    )
  }
  return <span className="text-muted-foreground">-</span>
}

/** Each villa's switchgear and cables: the factory, the MR, PO and due dates, what came, and the latest delivery. */
export default function OrdersTable({
  rows,
  loading,
  canEdit,
  dueSort,
  onSortDue,
  onEdit,
}: Props) {
  const { t } = useTranslation()
  const columns = 8 + (canEdit ? 1 : 0)
  const head = "px-4 py-2.5"

  return (
    <div className="list-surface overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-240">
          <TableHeader>
            <TableRow className="list-head-row">
              <TableHead className={head}>{t("materials.villa")}</TableHead>
              <TableHead className={head}>{t("materials.type")}</TableHead>
              <TableHead className={head}>
                {t("materials.orders.factory")}
              </TableHead>
              <TableHead className={head}>
                {t("materials.orders.mrDate")}
              </TableHead>
              <TableHead className={head}>
                {t("materials.orders.poDate")}
              </TableHead>
              <TableHead
                className={head}
                aria-sort={
                  dueSort === "asc"
                    ? "ascending"
                    : dueSort === "desc"
                      ? "descending"
                      : "none"
                }
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-0 py-0 text-xs uppercase tracking-wide hover:bg-transparent"
                  onClick={onSortDue}
                  icon={
                    dueSort === "desc"
                      ? "sortDesc"
                      : dueSort === "asc"
                        ? "sortAsc"
                        : "sort"
                  }
                >
                  {t("materials.orders.dueDate")}
                </Button>
              </TableHead>
              <TableHead className={head}>{t("materials.status")}</TableHead>
              <TableHead className={head}>
                {t("materials.orders.lastDelivery")}
              </TableHead>
              {canEdit && (
                <TableHead className={head}>
                  <span className="sr-only">{t("common.actions")}</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && rows.length === 0 ? (
              <TableBodySkeleton columns={columns} rows={8} />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  {t("materials.orders.empty")}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={`${row.villa.id}-${row.type}`}
                  tone={
                    row.overdue
                      ? "danger"
                      : row.status === "DELIVERED"
                        ? "success"
                        : undefined
                  }
                >
                  <TableCell className="px-4 py-3 text-sm font-medium">
                    <VillaCell
                      id={row.villa.id}
                      villaNumber={row.villa.villaNumber}
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm">
                    {t(`materials.types.${row.type}`)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm" dir="auto">
                    {row.factory?.name ?? (
                      <span className="text-muted-foreground">
                        {t("materials.orders.noFactory")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs tabular-nums whitespace-nowrap">
                    <DateCell
                      entered={row.mrDate}
                      fromNotes={row.deliveryMrDate}
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs tabular-nums whitespace-nowrap">
                    <DateCell
                      entered={row.poDate}
                      fromNotes={row.deliveryPoDate}
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs tabular-nums whitespace-nowrap">
                    <DateCell entered={row.dueDate} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm">
                    <div className="grid gap-1">
                      <OrderStatusBadge
                        status={row.status}
                        overdue={row.overdue}
                      />
                      {row.requiredItems > 0 && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {t("materials.orders.itemsComplete", {
                            done: row.completeItems,
                            total: row.requiredItems,
                          })}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs tabular-nums whitespace-nowrap">
                    <DateCell entered={row.lastDeliveryDate} />
                  </TableCell>
                  {canEdit && (
                    <TableCell className="px-4 py-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(row)}
                        aria-label={t("materials.orders.editOf", {
                          name: row.villa.villaNumber,
                          type: t(`materials.types.${row.type}`),
                        })}
                      >
                        {t("materials.orders.editDates")}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
