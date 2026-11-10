import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { useState } from "react"
import Button from "@/shared/ui/Button"
import { Form } from "@/shared/ui/form"
import AuthHeading from "../components/AuthHeading"
import { FormTextField } from "@/shared/ui/form-text-field"
import {
  AuthErrorBanner,
  AuthSuccessBanner,
} from "../components/AuthStatusBanner"
import { forgotSchema } from "../schemas"
import {
  applyApiFieldErrors,
  getApiError,
  useForgotPasswordMutation,
} from "../api"
import type { z } from "zod"

type Values = z.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const forgot = useForgotPasswordMutation()
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<Values>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      await forgot.mutateAsync(values)
      setSent(true)
    } catch (err) {
      const apiError = getApiError(err)
      applyApiFieldErrors(apiError, form.setError)
      setFormError(apiError.message)
    }
  })

  return (
    <>
      <AuthHeading
        title={t("auth.forgotTitle")}
        subtitle={t("auth.forgotSubtitle")}
      />
      {sent && <AuthSuccessBanner>{t("auth.linkSent")}</AuthSuccessBanner>}
      {formError && <AuthErrorBanner>{formError}</AuthErrorBanner>}
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormTextField
            control={form.control}
            name="email"
            dir="ltr"
            label={t("auth.email")}
            type="email"
            autoComplete="email"
          />
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={form.formState.isSubmitting || forgot.isPending}
          >
            {t("auth.sendLink")}
          </Button>
        </form>
      </Form>
      <p className="mt-6 text-center text-sm">
        <Link
          to="/reset-password"
          className="text-muted-foreground hover:underline"
        >
          {t("auth.resetTitle")}
        </Link>
        <span className="mx-2 text-border">·</span>
        <Link to="/login" className="font-medium text-accent hover:underline">
          {t("auth.backToLogin")}
        </Link>
      </p>
    </>
  )
}
