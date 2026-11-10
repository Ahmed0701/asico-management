import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate, useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"
import { useState } from "react"
import Button from "@/shared/ui/Button"
import { Form } from "@/shared/ui/form"
import AuthHeading from "../components/AuthHeading"
import { FormTextField } from "@/shared/ui/form-text-field"
import { AuthErrorBanner } from "../components/AuthStatusBanner"
import { resetSchema } from "../schemas"
import {
  applyApiFieldErrors,
  getApiError,
  resolveAuthErrorMessage,
  useResetPasswordMutation,
} from "../api"
import type { z } from "zod"

type Values = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const reset = useResetPasswordMutation()
  const [invalidToken, setInvalidToken] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<Values>({
    resolver: zodResolver(resetSchema),
  })

  const onSubmit = form.handleSubmit(async ({ password }) => {
    setFormError(null)
    setInvalidToken(false)
    if (!token) {
      setInvalidToken(true)
      return
    }
    try {
      await reset.mutateAsync({ token, password })
      navigate("/login", { replace: true, state: { passwordUpdated: true } })
    } catch (err) {
      const apiError = getApiError(err)
      applyApiFieldErrors(apiError, form.setError)
      if (apiError.code === "INVALID_RESET_TOKEN") {
        setInvalidToken(true)
      } else {
        setFormError(resolveAuthErrorMessage(t, apiError))
      }
    }
  })

  if (invalidToken) {
    return (
      <>
        <AuthHeading
          title={t("auth.resetTitle")}
          subtitle={t("auth.resetSubtitle")}
        />
        <AuthErrorBanner>{t("auth.invalidResetToken")}</AuthErrorBanner>
        <p className="text-center text-sm">
          <Link
            to="/forgot-password"
            className="font-medium text-accent hover:underline"
          >
            {t("auth.forgot")}
          </Link>
        </p>
      </>
    )
  }

  return (
    <>
      <AuthHeading
        title={t("auth.resetTitle")}
        subtitle={t("auth.resetSubtitle")}
      />
      {formError && <AuthErrorBanner>{formError}</AuthErrorBanner>}
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormTextField
            control={form.control}
            name="password"
            dir="ltr"
            label={t("auth.newPassword")}
            type="password"
            autoComplete="new-password"
          />
          <FormTextField
            control={form.control}
            name="confirm"
            dir="ltr"
            label={t("auth.confirmPassword")}
            type="password"
            autoComplete="new-password"
          />
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={form.formState.isSubmitting || reset.isPending}
          >
            {t("auth.resetPassword")}
          </Button>
        </form>
      </Form>
      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="font-medium text-accent hover:underline">
          {t("auth.backToLogin")}
        </Link>
      </p>
    </>
  )
}
