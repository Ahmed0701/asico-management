import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import type { MeDto } from "@/features/auth/api/auth.types"
import { toApiError } from "@/shared/api/errors"
import type { ApiError } from "@/shared/api/types"
import { toast } from "@/shared/lib/toast"
import Button from "@/shared/ui/Button"
import { ConfirmModal } from "@/shared/ui/Modal"
import { idempotencyWrite, useIdempotencyKey } from "@/shared/api/write-safety"
import { useResetUserPasswordMutation } from "../api"
import type { UserListItem } from "../api/users.types"
import ApiErrorBanner from "./ApiErrorBanner"

function displayError(error: ApiError, t: (key: string) => string): ApiError {
  if (error.code === "TOO_MANY_REQUESTS") {
    return { ...error, message: t("users.resetPasswordTooManyRequests") }
  }
  return error
}

export default function ResetUserPasswordDialog({
  open,
  onClose,
  target,
  me,
}: {
  open: boolean
  onClose: () => void
  target: Pick<UserListItem, "id" | "name" | "email" | "role"> | null
  me: MeDto | undefined
}) {
  const { t } = useTranslation()
  const resetPassword = useResetUserPasswordMutation()
  const { mutateAsync, isPending, reset } = resetPassword
  const idempotency = useIdempotencyKey(open)
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    if (!open) {
      setError(null)
      reset()
    }
  }, [open, reset])

  if (!target) return null

  const isSelf = me?.id === target.id
  const emailFailed = error?.code === "EMAIL_DELIVERY_FAILED"

  const runReset = async () => {
    setError(null)
    try {
      const { message } = await mutateAsync({
        id: target.id,
        write: idempotencyWrite(idempotency.getKey()),
      })
      idempotency.resetKey()
      toast.success(message)
      onClose()
    } catch (err) {
      setError(displayError(toApiError(err), t))
    }
  }

  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      title={t("users.resetPasswordTitle")}
      message={t("users.resetPasswordBody", { email: target.email })}
      confirmLabel={t("users.resetPasswordAction")}
      confirmVariant="primary"
      closeOnConfirm={false}
      confirmPending={isPending}
      onConfirm={runReset}
    >
      {isSelf && (
        <p
          role="note"
          className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground"
        >
          {t("users.resetPasswordSelfWarning")}
        </p>
      )}
      {error && (
        <div className="mt-3 space-y-3">
          {emailFailed && (
            <p className="text-sm text-foreground">
              {t("users.resetPasswordEmailFailed")}
            </p>
          )}
          <ApiErrorBanner error={error} />
          {emailFailed && (
            <Button
              type="button"
              variant="primary"
              disabled={isPending}
              onClick={() => void runReset()}
            >
              {t("common.retry")}
            </Button>
          )}
        </div>
      )}
    </ConfirmModal>
  )
}
