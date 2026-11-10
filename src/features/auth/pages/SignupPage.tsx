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
import { signupSchema } from "../schemas"
import {
  applyApiFieldErrors,
  getApiError,
  resolveAuthErrorMessage,
  useSignupMutation,
} from "../api"
import type { z } from "zod"

type Values = z.infer<typeof signupSchema>

export default function SignupPage() {
  const { t } = useTranslation()
  const signup = useSignupMutation()
  const [waiting, setWaiting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<Values>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = form.handleSubmit(async ({ name, email, password }) => {
    setFormError(null)
    try {
      await signup.mutateAsync({ name, email, password })
      setWaiting(true)
    } catch (err) {
      const apiError = getApiError(err)
      applyApiFieldErrors(apiError, form.setError)
      setFormError(resolveAuthErrorMessage(t, apiError))
    }
  })

  if (waiting) {
    return (
      <>
        <AuthHeading
          style={{ textAlign: "center" }}
          title={t("auth.signupTitle")}
          subtitle={t("auth.signupSubtitle")}
        />
        <AuthSuccessBanner className="p-4 text-center">
          {t("auth.waitingActivation")}
        </AuthSuccessBanner>
        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="font-medium text-accent hover:underline">
            {t("auth.backToLogin")}
          </Link>
        </p>
      </>
    )
  }

  return (
    <>
      <AuthHeading
        title={t("auth.signupTitle")}
        subtitle={t("auth.signupSubtitle")}
      />
      {formError && <AuthErrorBanner>{formError}</AuthErrorBanner>}
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormTextField
            control={form.control}
            name="name"
            label={t("auth.fullName")}
            autoComplete="name"
          />
          <FormTextField
            control={form.control}
            name="email"
            dir="ltr"
            label={t("auth.email")}
            type="email"
            autoComplete="email"
          />
          <FormTextField
            control={form.control}
            name="password"
            dir="ltr"
            label={t("auth.password")}
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
            disabled={form.formState.isSubmitting || signup.isPending}
          >
            {t("auth.signUp")}
          </Button>
        </form>
      </Form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.haveAccount")}{" "}
        <Link to="/login" className="font-medium text-accent hover:underline">
          {t("auth.signIn")}
        </Link>
      </p>
    </>
  )
}
