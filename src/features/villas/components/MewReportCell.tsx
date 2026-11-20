import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { FileText } from "lucide-react"
import { toApiError } from "@/shared/api/errors"
import { formatDate } from "@/shared/lib/format"
import { toast } from "@/shared/lib/toast"
import Button, { IconButton } from "@/shared/ui/Button"
import { ConfirmModal } from "@/shared/ui/Modal"
import {
  MEW_REPORT_ACCEPT,
  useDeleteMewReportMutation,
  useUploadMewReportMutation,
  viewMewReport,
  type MewReport,
} from "../api"

type Props = {
  villaId: string
  villaNumber: string
  report: MewReport | undefined
  /** May upload, replace and remove it (villas:inspection). */
  canEdit: boolean
}

/**
 * The MEW inspection report of one villa on the MEW Inspection list: the PDF's name and day, opened in a new tab; an
 * upload button when there is none, a replace and a remove button when there is one.
 */
export default function MewReportCell({
  villaId,
  villaNumber,
  report,
  canEdit,
}: Props) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const upload = useUploadMewReportMutation()
  const remove = useDeleteMewReportMutation()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const busy = upload.isPending || remove.isPending

  const onFile = async (list: FileList | null) => {
    const file = list?.[0]
    if (input.current) input.current.value = ""
    if (!file) return
    if (file.type && file.type !== MEW_REPORT_ACCEPT) {
      toast.error(t("mewInspection.report.onlyPdf"))
      return
    }
    try {
      await upload.mutateAsync({ villaId, file })
      toast.success(t("mewInspection.report.uploaded", { name: villaNumber }))
    } catch (err) {
      toast.error(toApiError(err).message)
    }
  }

  const open = async () => {
    try {
      await viewMewReport(villaId)
    } catch (err) {
      toast.error(toApiError(err).message)
    }
  }

  const confirmRemove = async () => {
    try {
      await remove.mutateAsync(villaId)
      toast.success(t("mewInspection.report.removed", { name: villaNumber }))
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setConfirmOpen(false)
    }
  }

  return (
    <div className="flex min-w-48 items-center gap-2">
      <input
        ref={input}
        type="file"
        accept={MEW_REPORT_ACCEPT}
        className="hidden"
        data-testid={`mew-report-input-${villaId}`}
        onChange={(e) => void onFile(e.target.files)}
      />
      {report ? (
        <>
          <button
            type="button"
            onClick={() => void open()}
            className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-start hover:bg-muted/60"
            title={t("mewInspection.report.open")}
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-danger-soft text-danger">
              <FileText size={15} aria-hidden />
            </span>
            <span className="min-w-0">
              <span
                className="block max-w-36 truncate text-xs font-medium"
                dir="auto"
              >
                {report.name}
              </span>
              <span className="block text-[11px] text-muted-foreground tabular-nums">
                {formatDate(report.uploadedAt)}
              </span>
            </span>
          </button>
          {canEdit && (
            <>
              <IconButton
                icon="upload"
                label={t("mewInspection.report.replace", { name: villaNumber })}
                disabled={busy}
                onClick={() => input.current?.click()}
              />
              <IconButton
                icon="trash"
                variant="danger"
                label={t("mewInspection.report.remove", { name: villaNumber })}
                disabled={busy}
                onClick={() => setConfirmOpen(true)}
              />
            </>
          )}
        </>
      ) : canEdit ? (
        <Button
          type="button"
          size="sm"
          icon="upload"
          disabled={busy}
          onClick={() => input.current?.click()}
          aria-label={t("mewInspection.report.uploadOf", { name: villaNumber })}
        >
          {upload.isPending
            ? t("mewInspection.report.uploading")
            : t("mewInspection.report.upload")}
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">
          {t("mewInspection.report.none")}
        </span>
      )}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmRemove}
        closeOnConfirm={false}
        title={t("mewInspection.report.removeTitle")}
        message={t("mewInspection.report.removeBody", { name: villaNumber })}
        confirmPending={remove.isPending}
      />
    </div>
  )
}
