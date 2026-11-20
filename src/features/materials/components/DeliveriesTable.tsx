import { VillaCell } from "@/shared/list/cells"
import SortableHead from "@/shared/list/SortableHead"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toApiError } from "@/shared/api/errors"
import { formatCalendarDateUtc } from "@/shared/lib/formatCalendarDateUtc"
import { toast } from "@/shared/lib/toast"
import { Badge } from "@/shared/ui/Badge"
import Button, { IconButton } from "@/shared/ui/Button"
import Icon from "@/shared/ui/Icon"
import { TableBodySkeleton } from "@/shared/ui/loading-skeletons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import {
  useDeleteDeliveryNoteMutation,
  useUploadDeliveryNoteMutation,
  viewDeliveryNote,
  type MaterialDelivery,
} from "../api"

const day = (value: string) => formatCalendarDateUtc(`${value}T00:00:00.000Z`)

export function formatQuantity(quantity: number, unit: string): string {
  return `${quantity.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${unit}`
}

/** The deliveries, each with buttons to upload (or replace) and view its delivery note. */
export default function DeliveriesTable({
  rows,
  isLoading,
  showVilla,
  sort,
  onSort,
  canUpdate,
  canDelete,
  emptyText,
  onEdit,
  onDelete,
}: {
  rows: MaterialDelivery[]
  isLoading: boolean
  showVilla: boolean
  sort?: string
  onSort?: (next: string) => void
  canUpdate: boolean
  canDelete: boolean
  emptyText: string
  onEdit: (row: MaterialDelivery) => void
  onDelete: (row: MaterialDelivery) => void
}) {
  const { t } = useTranslation()
  const upload = useUploadDeliveryNoteMutation()
  const removeNote = useDeleteDeliveryNoteMutation()
  const fileInput = useRef<HTMLInputElement>(null)
  const [target, setTarget] = useState<MaterialDelivery | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const showActions = canUpdate || canDelete
  const columnCount = (showVilla ? 9 : 8) + (showActions ? 1 : 0)

  const pickFile = (row: MaterialDelivery) => {
    setTarget(row)
    fileInput.current?.click()
  }

  const onFiles = async (list: FileList | null) => {
    const files = list ? Array.from(list) : []
    if (fileInput.current) fileInput.current.value = ""
    if (files.length === 0 || !target) return
    setBusyId(target.id)
    try {
      await upload.mutateAsync({ id: target.id, files })
      toast.success(
        t("materials.notesUploaded", {
          count: files.length,
          name: target.villa.villaNumber,
        }),
      )
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setBusyId(null)
      setTarget(null)
    }
  }

  const view = async (row: MaterialDelivery, noteId: string) => {
    try {
      await viewDeliveryNote(row.id, noteId)
    } catch (err) {
      toast.error(toApiError(err).message)
    }
  }

  const dropNote = async (row: MaterialDelivery, noteId: string) => {
    setBusyId(row.id)
    try {
      await removeNote.mutateAsync({ id: row.id, noteId })
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="list-surface overflow-hidden">
      <input
        ref={fileInput}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        multiple
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => void onFiles(e.target.files)}
      />
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="list-head-row">
              <TableHead className="px-4 py-2.5">
                {t("materials.deliveryDate")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("materials.mrDate")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("materials.poDate")}
              </TableHead>
              {showVilla &&
                (onSort ? (
                  <SortableHead
                    label={t("materials.villa")}
                    field="villaNumber"
                    sort={sort}
                    onSort={onSort}
                  />
                ) : (
                  <TableHead className="px-4 py-2.5">
                    {t("materials.villa")}
                  </TableHead>
                ))}
              <TableHead className="px-4 py-2.5">
                {t("materials.type")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("materials.factory")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("materials.materials")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("materials.noteNumber")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("materials.deliveryNote")}
              </TableHead>
              {showActions && (
                <TableHead className="px-4 py-2.5">
                  <span className="sr-only">{t("common.actions")}</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              <TableBodySkeleton columns={columnCount} rows={6} />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-4 py-3 text-sm tabular-nums whitespace-nowrap">
                    {day(row.deliveryDate)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm tabular-nums whitespace-nowrap">
                    {row.mrDate ? (
                      day(row.mrDate)
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm tabular-nums whitespace-nowrap">
                    {row.poDate ? (
                      day(row.poDate)
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  {showVilla && (
                    <TableCell className="px-4 py-3 font-medium tabular-nums">
                      <VillaCell
                        id={row.villa.id}
                        villaNumber={row.villa.villaNumber}
                        to={`/villas/${row.villa.id}?tab=materials`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="px-4 py-3">
                    <Badge
                      tone={row.factory.type === "SWITCHGEAR" ? "info" : "warn"}
                    >
                      {t(`materials.types.${row.factory.type}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm" dir="auto">
                    {row.factory.name}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <ul className="flex max-w-md flex-wrap gap-1.5">
                      {row.lines.map((line) => (
                        <li
                          key={line.item.id}
                          className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs"
                          dir="auto"
                        >
                          {line.item.name}{" "}
                          <span className="font-medium tabular-nums">
                            × {formatQuantity(line.quantity, line.item.unit)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm tabular-nums">
                    {row.noteNumber ?? "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1.5">
                      {row.deliveryNotes.length === 0 ? (
                        <Badge tone="danger">
                          {t("materials.noteMissing")}
                        </Badge>
                      ) : (
                        <ul className="flex flex-col gap-1">
                          {row.deliveryNotes.map((note) => (
                            <li
                              key={note.id}
                              className="flex items-center gap-1"
                            >
                              <button
                                type="button"
                                className="inline-flex max-w-[14rem] items-center gap-1 text-sm text-accent hover:underline"
                                title={t("materials.viewNote")}
                                onClick={() => void view(row, note.id)}
                              >
                                <Icon name="eye" size={14} />
                                <span className="truncate" dir="auto">
                                  {note.name}
                                </span>
                              </button>
                              {canUpdate && (
                                <IconButton
                                  icon="x"
                                  label={t("materials.removeNote", {
                                    name: note.name,
                                  })}
                                  disabled={busyId === row.id}
                                  onClick={() => void dropNote(row, note.id)}
                                />
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                      {canUpdate && row.deliveryNotes.length < 10 && (
                        <Button
                          type="button"
                          size="sm"
                          icon="upload"
                          disabled={busyId === row.id}
                          onClick={() => pickFile(row)}
                        >
                          {row.deliveryNotes.length === 0
                            ? t("materials.uploadNote")
                            : t("materials.addNoteFiles")}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  {showActions && (
                    <TableCell className="px-4 py-3">
                      <div className="row-actions flex justify-end gap-1">
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
                      </div>
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
