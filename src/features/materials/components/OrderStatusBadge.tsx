import { useTranslation } from "react-i18next"
import { Badge } from "@/shared/ui/Badge"
import type { MaterialOrderStatus } from "../api"

const TONES = {
  DELIVERED: "success",
  PARTIAL: "warn",
  NOT_DELIVERED: "danger",
  NOT_REQUIRED: "neutral",
} as const

/** All delivered (green), partly delivered (amber), nothing yet (red), or nothing needed (grey); and late when overdue. */
export default function OrderStatusBadge({
  status,
  overdue,
}: {
  status: MaterialOrderStatus
  overdue: boolean
}) {
  const { t } = useTranslation()
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Badge tone={TONES[status]}>
        {t(`materials.orders.statuses.${status}`)}
      </Badge>
      {overdue && <Badge tone="danger">{t("materials.orders.overdue")}</Badge>}
    </span>
  )
}
