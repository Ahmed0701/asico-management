import { useTranslation } from "react-i18next"
import { formatCalendarDateUtc } from "@/shared/lib/formatCalendarDateUtc"
import Button from "@/shared/ui/Button"
import Modal from "@/shared/ui/Modal"
import type { VariationOrder } from "../api"

type Props = {
  item: VariationOrder | null
  amount: string
  onClose: () => void
}

/** The whole notes of a variation order, with its amount and date, in a dialog. */
export default function VariationOrderNotesModal({
  item,
  amount,
  onClose,
}: Props) {
  const { t } = useTranslation()
  if (!item) return null
  return (
    <Modal
      open
      onClose={onClose}
      title={t("variationOrders.notesTitle", { name: item.voNumber })}
      footer={
        <Button type="button" onClick={onClose}>
          {t("common.close")}
        </Button>
      }
    >
      <dl className="mb-4 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-muted-foreground">{t("variationOrders.amount")}</dt>
        <dd className="tabular-nums">{amount}</dd>
        <dt className="text-muted-foreground">
          {t("variationOrders.dateAdded")}
        </dt>
        <dd className="tabular-nums">
          {formatCalendarDateUtc(`${item.dateAdded}T00:00:00.000Z`)}
        </dd>
        <dt className="text-muted-foreground">{t("variationOrders.status")}</dt>
        <dd>{t(`variationOrders.statuses.${item.status}`)}</dd>
      </dl>
      <p
        className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3 text-sm leading-relaxed"
        dir="auto"
      >
        {item.notes}
      </p>
    </Modal>
  )
}
