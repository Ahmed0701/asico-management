import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { toApiError } from "@/shared/api/errors"
import { formatDateTime } from "@/shared/lib/format"
import { toast } from "@/shared/lib/toast"
import Button, { IconButton } from "@/shared/ui/Button"
import Modal from "@/shared/ui/Modal"
import {
  MAX_EXPENSE_FILES,
  useDeleteExpenseFileMutation,
  useUploadExpenseFilesMutation,
  viewOverheadExpenseFile,
  type OverheadExpense,
} from "../api"
import { EXPENSE_FILE_ACCEPT } from "./ExpenseFormModal"

const sizeText = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`

type Props = {
  expense: OverheadExpense
  canEdit: boolean
  onClose: () => void
}

/** The invoice files of an expense (PDF or photos): open one, add more, or remove one. */
export default function ExpenseFilesModal({
  expense,
  canEdit,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const upload = useUploadExpenseFilesMutation()
  const remove = useDeleteExpenseFileMutation()
  const room = MAX_EXPENSE_FILES - expense.files.length

  const onPick = async (list: FileList | null) => {
    const files = Array.from(list ?? [])
    if (input.current) input.current.value = ""
    if (files.length === 0) return
    if (files.length > room) {
      toast.error(t("overhead.expenses.filesTooMany", { count: room }))
      return
    }
    try {
      await upload.mutateAsync({ id: expense.id, files })
      toast.success(
        t("overhead.expenses.filesUploaded", { count: files.length }),
      )
    } catch (err) {
      toast.error(toApiError(err).message)
    }
  }

  const open = async (fileId: string) => {
    try {
      await viewOverheadExpenseFile(expense.id, fileId)
    } catch (err) {
      toast.error(toApiError(err).message)
    }
  }

  const drop = async (fileId: string) => {
    try {
      await remove.mutateAsync({ id: expense.id, fileId })
    } catch (err) {
      toast.error(toApiError(err).message)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={t("overhead.expenses.filesTitle", { name: expense.description })}
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
              {t("overhead.expenses.attachFiles")}
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
        accept={EXPENSE_FILE_ACCEPT}
        className="hidden"
        data-testid="expense-files-upload"
        onChange={(e) => void onPick(e.target.files)}
      />
      {expense.files.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("overhead.expenses.noFiles")}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {expense.files.map((file) => (
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
                  label={t("overhead.expenses.removeFile", { name: file.name })}
                  disabled={remove.isPending}
                  onClick={() => void drop(file.id)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        {t("overhead.expenses.filesHint", { count: MAX_EXPENSE_FILES })}
      </p>
    </Modal>
  )
}
