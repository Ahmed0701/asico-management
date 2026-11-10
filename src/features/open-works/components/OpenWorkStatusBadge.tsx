import { useTranslation } from "react-i18next"
import { Badge } from "@/shared/ui/Badge"
import type { WorkStatusValue } from "../api"

function toneForStatus(status: WorkStatusValue) {
  switch (status) {
    case "DONE":
      return "success" as const
    case "IN_PROGRESS":
      return "info" as const
    case "DELAYED":
      return "warn" as const
    default:
      return "neutral" as const
  }
}

export default function OpenWorkStatusBadge({
  status,
}: {
  status: WorkStatusValue
}) {
  const { t } = useTranslation()
  return (
    <Badge tone={toneForStatus(status)}>
      {t(`openWorks.status.${status}`)}
    </Badge>
  )
}
