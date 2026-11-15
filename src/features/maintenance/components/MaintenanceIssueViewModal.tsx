import { useTranslation } from "react-i18next"
import { formatCalendarDateUtc } from "@/shared/lib/formatCalendarDateUtc"
import { formatDateTime } from "@/shared/lib/format"
import Button from "@/shared/ui/Button"
import Modal from "@/shared/ui/Modal"
import type { MaintenanceVilla } from "../api"

/** The whole issue of a maintenance villa, with its location and dates, in a dialog. */
export default function MaintenanceIssueViewModal({
  item,
  onClose,
}: {
  item: MaintenanceVilla | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  if (!item) return null
  return (
    <Modal
      open
      onClose={onClose}
      title={t("maintenance.viewTitle", { name: item.villaNumber })}
      footer={
        <Button type="button" onClick={onClose}>
          {t("common.close")}
        </Button>
      }
    >
      <dl className="mb-4 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-muted-foreground">{t("maintenance.location")}</dt>
        <dd dir="auto">{item.location}</dd>
        <dt className="text-muted-foreground">
          {t("maintenance.handoverDate")}
        </dt>
        <dd className="tabular-nums">
          {formatCalendarDateUtc(`${item.handoverDate}T00:00:00.000Z`)}
        </dd>
        <dt className="text-muted-foreground">{t("maintenance.addedAt")}</dt>
        <dd className="tabular-nums">{formatDateTime(item.createdAt)}</dd>
      </dl>
      <p
        className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3 text-sm leading-relaxed"
        dir="auto"
      >
        {item.issue}
      </p>
    </Modal>
  )
}
