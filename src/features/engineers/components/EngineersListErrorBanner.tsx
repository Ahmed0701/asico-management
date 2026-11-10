import { useTranslation } from "react-i18next"
import Button from "@/shared/ui/Button"
import type { ApiError } from "@/shared/api/types"

export default function EngineersListErrorBanner({
  error,
  onRetry,
}: {
  error: ApiError | null
  onRetry: () => void
}) {
  const { t } = useTranslation()
  if (!error) return null
  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-danger/30 bg-danger-soft p-4 text-sm"
    >
      <p className="text-danger">{error.message}</p>
      {error.requestId && (
        <p dir="ltr" className="mt-1 font-mono text-xs text-muted-foreground">
          {t("common.requestId", { id: error.requestId })}
        </p>
      )}
      {(error.status >= 500 || error.code === "NETWORK_ERROR") && (
        <Button type="button" size="sm" className="mt-2" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      )}
    </div>
  )
}
