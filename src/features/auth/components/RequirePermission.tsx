import { useTranslation } from "react-i18next"
import { Card } from "@/shared/ui/PageHeader"
import Icon from "@/shared/ui/Icon"
import { usePermissions } from "../api/auth.queries"
import type { PermissionCode } from "../api/permissions"

export default function RequirePermission({
  permission,
  children,
  forbiddenTitleKey = "audit.forbiddenTitle",
  forbiddenBodyKey = "audit.forbiddenBody",
}: {
  permission: PermissionCode
  children: React.ReactNode
  forbiddenTitleKey?: string
  forbiddenBodyKey?: string
}) {
  const { t } = useTranslation()
  const { can } = usePermissions()

  if (!can(permission)) {
    return (
      <Card className="mx-auto mt-16 flex max-w-md flex-col items-center gap-3 p-10 text-center">
        <span className="grid size-10 place-items-center rounded-full bg-muted">
          <Icon name="shield" />
        </span>
        <h1 className="text-lg font-semibold">{t(forbiddenTitleKey)}</h1>
        <p className="text-sm text-muted-foreground">{t(forbiddenBodyKey)}</p>
      </Card>
    )
  }

  return children
}
