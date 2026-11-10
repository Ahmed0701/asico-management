import { useTranslation } from "react-i18next"
import type { ApiError } from "@/shared/api/types"
import Button from "@/shared/ui/Button"

export default function SiteReportsListErrorBanner({
  error,
  onRetry,
}: {
  error: ApiError
  onRetry: () => void
}) {
  const { t } = useTranslation()
  return (
    <div
      role="alert"
      className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3"
    >
      <p className="text-sm font-medium">{t("siteReports.errorTitle")}</p>
      <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
      <Button
        type="button"
        variant="secondary"
        className="mt-3"
        onClick={onRetry}
      >
        {t("common.retry")}
      </Button>
    </div>
  )
}
