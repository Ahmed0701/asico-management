import { useTranslation } from "react-i18next"
import { Card } from "@/shared/ui/PageHeader"
import Icon from "@/shared/ui/Icon"
import { usePermissions } from "../api/auth.queries"

export default function RequireAdmin({
  children,
}: {
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  const { isAdmin } = usePermissions()

  if (!isAdmin) {
    return (
      <Card className="mx-auto mt-16 flex max-w-md flex-col items-center gap-3 p-10 text-center">
        <span className="grid size-10 place-items-center rounded-full bg-muted">
          <Icon name="shield" />
        </span>
        <h1 className="text-lg font-semibold">{t("audit.forbiddenTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("audit.forbiddenBody")}
        </p>
      </Card>
    )
  }

  return children
}
