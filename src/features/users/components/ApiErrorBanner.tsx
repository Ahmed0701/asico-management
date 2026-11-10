import { useTranslation } from "react-i18next"
import type { ApiError } from "@/shared/api/types"

export default function ApiErrorBanner({ error }: { error: ApiError | null }) {
  const { t } = useTranslation()
  if (!error) return null
  return (
    <div
      role="alert"
      className="mb-4 rounded-lg bg-danger-soft p-3 text-sm text-danger"
    >
      <p>{error.message}</p>
      {error.requestId && (
        <p className="mt-1 font-mono text-xs opacity-90">
          {t("common.requestId", { id: error.requestId })}
        </p>
      )}
    </div>
  )
}
