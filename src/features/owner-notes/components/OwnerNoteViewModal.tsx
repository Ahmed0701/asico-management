import { useTranslation } from "react-i18next"
import { formatDateTime } from "@/shared/lib/format"
import Button from "@/shared/ui/Button"
import Modal from "@/shared/ui/Modal"
import type { OwnerNote } from "../api"

/** The whole text of an owner note, with its villa and owner, in a dialog. */
export default function OwnerNoteViewModal({
  note,
  onClose,
}: {
  note: OwnerNote | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  if (!note) return null
  return (
    <Modal
      open
      onClose={onClose}
      title={t("ownerNotes.viewTitle", { name: note.villa.villaNumber })}
      footer={
        <Button type="button" onClick={onClose}>
          {t("common.close")}
        </Button>
      }
    >
      <dl className="mb-4 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-muted-foreground">{t("ownerNotes.ownerName")}</dt>
        <dd dir="auto">{note.ownerName ?? "-"}</dd>
        <dt className="text-muted-foreground">{t("ownerNotes.location")}</dt>
        <dd dir="auto">{note.villa.location}</dd>
        <dt className="text-muted-foreground">{t("ownerNotes.addedAt")}</dt>
        <dd className="tabular-nums">{formatDateTime(note.createdAt)}</dd>
      </dl>
      <p
        className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3 text-sm leading-relaxed"
        dir="auto"
      >
        {note.notes}
      </p>
    </Modal>
  )
}
