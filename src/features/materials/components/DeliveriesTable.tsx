import { useRef, useState } from "react"
import { Link } from "react-router"
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
  canUpdate,
  canDelete,
  emptyText,
  onEdit,
  onDelete,
}: {
  rows: MaterialDelivery[]
  isLoading: boolean
  showVilla: boolean
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
  const columnCount = (showVilla ? 7 : 6) + (showActions ? 1 : 0)

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
    <div className="overflow-hidden rounded-lg border border-border bg-card">
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
            <TableRow className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <TableHead className="px-4 py-2.5">
                {t("materials.deliveryDate")}
              </TableHead>
              {showVilla && (
                <TableHead className="px-4 py-2.5">
                  {t("materials.villa")}
                </TableHead>
              )}
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
                <TableRow key={row.id} className="hover:bg-muted/40">
                  <TableCell className="px-4 py-3 text-sm tabular-nums">
                    {day(row.deliveryDate)}
                  </TableCell>
                  {showVilla && (
                    <TableCell className="px-4 py-3 font-medium tabular-nums">
                      <Link
                        to={`/villas/${row.villa.id}?tab=materials`}
                        className="hover:underline"
                      >
                        {row.villa.villaNumber}
                      </Link>
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
                      <div className="flex justify-end gap-1">
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
