import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { toApiError } from "@/shared/api/errors"
import { formatDateTime } from "@/shared/lib/format"
import { toast } from "@/shared/lib/toast"
import Button, { IconButton } from "@/shared/ui/Button"
import Modal from "@/shared/ui/Modal"
import {
  useDeletePaymentFileMutation,
  useUploadPaymentFilesMutation,
  viewPaymentFile,
  type Payment,
} from "../api"

const MAX_FILES = 10

const sizeText = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`

/** The receipts and invoices of a payment: open one, add more (PDF, JPG or PNG), or remove one. */
export default function PaymentFilesModal({
  payment,
  canEdit,
  onClose,
}: {
  payment: Payment | null
  canEdit: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const upload = useUploadPaymentFilesMutation()
  const remove = useDeletePaymentFileMutation()
  if (!payment) return null
  const room = MAX_FILES - payment.files.length

  const onPick = async (list: FileList | null) => {
    const files = Array.from(list ?? [])
    if (input.current) input.current.value = ""
    if (files.length === 0) return
    if (files.length > room) {
      toast.error(t("payments.filesTooMany", { count: room }))
      return
    }
    try {
      await upload.mutateAsync({ id: payment.id, files })
      toast.success(t("payments.filesUploaded", { count: files.length }))
    } catch (err) {
      toast.error(toApiError(err).message)
    }
  }

  const open = async (fileId: string) => {
    try {
      await viewPaymentFile(payment.id, fileId)
    } catch (err) {
      toast.error(toApiError(err).message)
    }
  }

  const drop = async (fileId: string) => {
    try {
      await remove.mutateAsync({ id: payment.id, fileId })
    } catch (err) {
      toast.error(toApiError(err).message)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={t("payments.filesTitle", { name: payment.contractor.name })}
      footer={
        <>
          {canEdit && (
            <Button
              type="button"
              variant="primary"
              icon="upload"
              disabled={upload.isPending || room <= 0}
              onClick={() => input.current?.click()}
            >
              {t("payments.addFiles")}
            </Button>
          )}
          <Button type="button" onClick={onClose}>
            {t("common.close")}
          </Button>
        </>
      }
    >
      <input
        ref={input}
        type="file"
        multiple
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => void onPick(e.target.files)}
      />
      {payment.files.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("payments.noFiles")}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {payment.files.map((file) => (
            <li key={file.id} className="flex items-center gap-3 px-3 py-2">
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-start text-sm text-accent hover:underline"
                onClick={() => void open(file.id)}
                dir="auto"
              >
                {file.name}
              </button>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {sizeText(file.size)} · {formatDateTime(file.uploadedAt)}
              </span>
              {canEdit && (
                <IconButton
                  icon="trash"
                  variant="danger"
                  label={t("payments.removeFile", { name: file.name })}
                  disabled={remove.isPending}
                  onClick={() => void drop(file.id)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        {t("payments.filesHint", { count: MAX_FILES })}
      </p>
    </Modal>
  )
}
