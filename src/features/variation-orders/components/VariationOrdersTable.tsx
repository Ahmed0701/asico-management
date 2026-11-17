import { useTranslation } from "react-i18next"
import { formatCalendarDateUtc } from "@/shared/lib/formatCalendarDateUtc"
import Button, { IconButton } from "@/shared/ui/Button"
import { TableBodySkeleton } from "@/shared/ui/loading-skeletons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import type { VariationOrder, VariationOrderStatus } from "../api"
import VariationOrderStatusSelect from "./VariationOrderStatusSelect"

type Props = {
  rows: VariationOrder[]
  loading: boolean
  canEdit: boolean
  busyId: string | null
  kwd: (minor: number) => string
  onStatus: (row: VariationOrder, next: VariationOrderStatus) => void
  onNotes: (row: VariationOrder) => void
  onFiles: (row: VariationOrder) => void
  onEdit: (row: VariationOrder) => void
  onDelete: (row: VariationOrder) => void
}

/** The variation orders of a villa: VO number, amount, date added, files, status and notes. */
export default function VariationOrdersTable({
  rows,
  loading,
  canEdit,
  busyId,
  kwd,
  onStatus,
  onNotes,
  onFiles,
  onEdit,
  onDelete,
}: Props) {
  const { t } = useTranslation()
  const columnCount = canEdit ? 7 : 6

  return (
    <div className="list-surface overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="list-head-row">
            <TableHead className="px-4 py-2.5">
              {t("variationOrders.voNumber")}
            </TableHead>
            <TableHead className="px-4 py-2.5">
              {t("variationOrders.amount")}
            </TableHead>
            <TableHead className="px-4 py-2.5">
              {t("variationOrders.dateAdded")}
            </TableHead>
            <TableHead className="px-4 py-2.5">
              {t("variationOrders.files")}
            </TableHead>
            <TableHead className="px-4 py-2.5">
              {t("variationOrders.status")}
            </TableHead>
            <TableHead className="px-4 py-2.5">
              {t("variationOrders.notes")}
            </TableHead>
            {canEdit && (
              <TableHead className="px-4 py-2.5">
                <span className="sr-only">{t("common.actions")}</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && rows.length === 0 ? (
            <TableBodySkeleton columns={columnCount} rows={3} />
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columnCount}
                className="px-4 py-8 text-center text-sm text-muted-foreground"
              >
                {t("variationOrders.empty")}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                tone={row.status === "PAID" ? "success" : "warn"}
              >
                <TableCell className="px-4 py-3 text-sm font-medium" dir="auto">
                  {row.voNumber}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm tabular-nums">
                  {kwd(row.amountMinor)}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm tabular-nums">
                  {formatCalendarDateUtc(`${row.dateAdded}T00:00:00.000Z`)}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Button
                    type="button"
                    size="sm"
                    icon="file"
                    aria-label={t("variationOrders.filesOf", {
                      name: row.voNumber,
                    })}
                    onClick={() => onFiles(row)}
                  >
                    {row.files.length}
                  </Button>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <VariationOrderStatusSelect
                    value={row.status}
                    label={t("variationOrders.statusOf", {
                      name: row.voNumber,
                    })}
                    canEdit={canEdit}
                    disabled={busyId === row.id}
                    onChange={(next) => onStatus(row, next)}
                  />
                </TableCell>
                <TableCell className="max-w-[16rem] px-4 py-3">
                  {row.notes ? (
                    <Button
                      type="button"
                      size="sm"
                      icon="eye"
                      className="max-w-full"
                      title={t("variationOrders.viewNotes")}
                      aria-label={t("variationOrders.viewNotesOf", {
                        name: row.voNumber,
                      })}
                      onClick={() => onNotes(row)}
                    >
                      <span className="min-w-0 truncate" dir="auto">
                        {row.notes}
                      </span>
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                {canEdit && (
                  <TableCell className="px-4 py-3">
                    <div className="row-actions flex justify-end gap-1">
                      <IconButton
                        icon="edit"
                        label={t("common.edit")}
                        onClick={() => onEdit(row)}
                      />
                      <IconButton
                        icon="trash"
                        label={t("common.delete")}
                        variant="danger"
                        onClick={() => onDelete(row)}
                      />
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
