import { useTranslation } from "react-i18next"
import { Badge } from "@/shared/ui/Badge"
import type { BalanceStatus } from "../api"

const TONES = {
  PENDING: "danger",
  COMPLETE: "success",
  OVER: "warn",
} as const

/** Still to come (red), all here (green), or more came than needed (amber). */
export default function BalanceStatusBadge({
  status,
}: {
  status: BalanceStatus
}) {
  const { t } = useTranslation()
  return <Badge tone={TONES[status]}>{t(`materials.statuses.${status}`)}</Badge>
}
