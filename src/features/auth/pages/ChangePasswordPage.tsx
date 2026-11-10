import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { useState } from "react"
import Button from "@/shared/ui/Button"
import { Form } from "@/shared/ui/form"
import PageHeader, { Card } from "@/shared/ui/PageHeader"
import { FormTextField } from "@/shared/ui/form-text-field"
import {
  AuthErrorBanner,
  AuthSuccessBanner,
} from "../components/AuthStatusBanner"
import { changeSchema } from "../schemas"
import {
  applyApiFieldErrors,
  getApiError,
  resolveAuthErrorMessage,
  useChangePasswordMutation,
} from "../api"
import type { z } from "zod"

type Values = z.infer<typeof changeSchema>

export default function ChangePasswordPage() {
  const { t } = useTranslation()
  const changePassword = useChangePasswordMutation()
  const [done, setDone] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<Values>({
    resolver: zodResolver(changeSchema),
  })

  const onSubmit = form.handleSubmit(async ({ current, password }) => {
    setFormError(null)
    setDone(false)
    try {
      await changePassword.mutateAsync({
        currentPassword: current,
        newPassword: password,
      })
      setDone(true)
      form.reset()
    } catch (err) {
      const apiError = getApiError(err)
      applyApiFieldErrors(apiError, form.setError)
      setFormError(resolveAuthErrorMessage(t, apiError))
    }
  })

  return (
    <>
      <PageHeader
        title={t("auth.changeTitle")}
        subtitle={t("auth.changeSubtitle")}
      />
      <Card className="max-w-md p-6">
        {done && (
          <AuthSuccessBanner>{t("auth.passwordUpdated")}</AuthSuccessBanner>
        )}
        {formError && <AuthErrorBanner>{formError}</AuthErrorBanner>}
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <FormTextField
              control={form.control}
              name="current"
              dir="ltr"
              label={t("auth.currentPassword")}
              type="password"
              autoComplete="current-password"
            />
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
              disabled={form.formState.isSubmitting || changePassword.isPending}
            >
              {t("auth.resetPassword")}
            </Button>
          </form>
        </Form>
      </Card>
    </>
  )
}
