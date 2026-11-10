import { useTranslation } from "react-i18next"
import { ConfirmModal } from "@/shared/ui/Modal"

export default function VersionConflictDialog({
  open,
  onClose,
  recordLabel,
  onReload,
  onApplyOnTop,
  applyPending = false,
}: {
  open: boolean
  onClose: () => void
  recordLabel: string
  onReload: () => void | Promise<void>
  onApplyOnTop: () => void | Promise<void>
  applyPending?: boolean
}) {
  const { t } = useTranslation()
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      title={t("writeSafety.conflictTitle")}
      message={t("writeSafety.conflictBody", { name: recordLabel })}
      confirmLabel={t("writeSafety.applyOnTop")}
      confirmVariant="primary"
      closeOnConfirm={false}
      confirmPending={applyPending}
      onConfirm={onApplyOnTop}
    >
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          className="text-sm font-medium text-accent hover:underline"
          disabled={applyPending}
          onClick={() => void Promise.resolve(onReload())}
        >
          {t("writeSafety.reloadFresh")}
        </button>
      </div>
    </ConfirmModal>
  )
}
