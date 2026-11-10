import { useTranslation } from "react-i18next"
import { Badge } from "@/shared/ui/Badge"
import type { SmallWorkStatusValue } from "../api"

function toneForStatus(status: SmallWorkStatusValue) {
  switch (status) {
    case "DONE":
      return "success" as const
    default:
      return "neutral" as const
  }
}

export default function SmallWorkStatusBadge({
  status,
}: {
  status: SmallWorkStatusValue
}) {
  const { t } = useTranslation()
  return (
    <Badge tone={toneForStatus(status)}>
      {t(`smallWorks.status.${status}`)}
    </Badge>
  )
}
