import { useTranslation } from "react-i18next"
import i18n from "@/shared/i18n"
import Button from "@/shared/ui/Button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { TableBodySkeleton } from "@/shared/ui/loading-skeletons"
import { formatDateTime } from "@/shared/lib/format"
import type { VillaDocument } from "../api"
import { formatDocumentSizeBytes } from "../lib/formatDocumentSize"

export default function VillaDocumentsTable({
  rows,
  isLoading,
  canDownload,
  canDelete,
  downloadPendingId,
  onDownload,
  onView,
  onDelete,
}: {
  rows: VillaDocument[]
  isLoading: boolean
  canDownload: boolean
  canDelete: boolean
  downloadPendingId: string | null
  onDownload: (doc: VillaDocument) => void
  onView: (doc: VillaDocument) => void
  onDelete: (doc: VillaDocument) => void
}) {
  const { t } = useTranslation()
  const locale = i18n.language === "ar" ? "ar" : "en"

  if (isLoading && rows.length === 0) {
    return <TableBodySkeleton columns={6} rows={4} cellClassName="px-4 py-3" />
  }

  if (!isLoading && rows.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        {t("villaDocuments.empty")}
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground hover:bg-muted/60">
            <TableHead className="px-4 py-2.5">
              {t("villaDocuments.colName")}
            </TableHead>
            <TableHead className="px-4 py-2.5">
              {t("villaDocuments.colSize")}
            </TableHead>
            <TableHead className="px-4 py-2.5">
              {t("villaDocuments.colType")}
            </TableHead>
            <TableHead className="px-4 py-2.5">
              {t("villaDocuments.colUploadedBy")}
            </TableHead>
            <TableHead className="px-4 py-2.5">
              {t("villaDocuments.colUploadedAt")}
            </TableHead>
            {(canDownload || canDelete) && (
              <TableHead className="px-4 py-2.5 text-end">
                {t("common.actions")}
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className="hover:bg-muted/40">
              <TableCell className="max-w-56 px-4 py-3" dir="auto">
                <span className="break-all font-medium">
                  {row.originalName}
                </span>
              </TableCell>
              <TableCell className="px-4 py-3 tabular-nums whitespace-nowrap">
                {formatDocumentSizeBytes(row.sizeBytes, locale)}
              </TableCell>
              <TableCell className="px-4 py-3 text-xs" dir="ltr">
                {row.mimeType}
              </TableCell>
              <TableCell className="px-4 py-3" dir="auto">
                {row.uploadedBy.name}
              </TableCell>
              <TableCell className="px-4 py-3 whitespace-nowrap tabular-nums">
                <time dateTime={row.createdAt}>
                  {formatDateTime(row.createdAt)}
                </time>
              </TableCell>
              {(canDownload || canDelete) && (
                <TableCell className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {canDownload && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={downloadPendingId === row.id}
                        onClick={() => onView(row)}
                        aria-label={t("villaDocuments.viewLabel", {
                          name: row.originalName,
                        })}
                      >
                        {t("villaDocuments.view")}
                      </Button>
                    )}
                    {canDownload && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={downloadPendingId === row.id}
                        onClick={() => onDownload(row)}
                      >
                        {t("villaDocuments.download")}
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => onDelete(row)}
                      >
                        {t("common.delete")}
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
