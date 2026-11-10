import { useTranslation } from "react-i18next"
import { Badge } from "@/shared/ui/Badge"
import type { SmallWork } from "../api"

export default function SmallWorkAlertBadge({ row }: { row: SmallWork }) {
  const { t } = useTranslation()
  if (row.status === "DONE") return null
  if (row.overdue) {
    return <Badge tone="danger">{t("smallWorks.badge.overdue")}</Badge>
  }
  if (row.dueSoon) {
    return <Badge tone="warn">{t("smallWorks.badge.dueSoon")}</Badge>
  }
  return null
}
