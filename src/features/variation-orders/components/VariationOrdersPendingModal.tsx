import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import Button from "@/shared/ui/Button"
import Modal from "@/shared/ui/Modal"

export type PendingVariationOrders = {
  villaId: string
  villaNumber: string
  // How many are not paid, when the server said.
  count: number | null
}

type Props = {
  pending: PendingVariationOrders | null
  onClose: () => void
}

/**
 * Shown when a villa is added for MEW inspection while some of its variation orders are not paid: the server refuses
 * it. The button opens the Variation Orders of the villa, to mark them paid first.
 */
export default function VariationOrdersPendingModal({
  pending,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  if (!pending) return null
  return (
    <Modal
      open
      onClose={onClose}
      title={t("variationOrders.pendingTitle")}
      footer={
        <>
          <Button type="button" onClick={onClose}>
            {t("common.close")}
          </Button>
          <Button
            type="button"
            variant="primary"
            icon="eye"
            onClick={() => {
              onClose()
              navigate(`/villas/${pending.villaId}?variationOrders=open`)
            }}
          >
            {t("variationOrders.pendingView")}
          </Button>
        </>
      }
    >
      <p role="alert" className="text-sm leading-relaxed">
        {pending.count !== null
          ? t("variationOrders.pendingBodyCount", {
              name: pending.villaNumber,
              count: pending.count,
            })
          : t("variationOrders.pendingBody", { name: pending.villaNumber })}
      </p>
    </Modal>
  )
}
