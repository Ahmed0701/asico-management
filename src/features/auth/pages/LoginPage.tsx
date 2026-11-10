import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useLocation, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import Button from "@/shared/ui/Button"
import { Form } from "@/shared/ui/form"
import AuthHeading from "../components/AuthHeading"
import { FormTextField } from "@/shared/ui/form-text-field"
import {
  AuthErrorBanner,
  AuthSuccessBanner,
} from "../components/AuthStatusBanner"
import { loginSchema } from "../schemas"
import {
  applyApiFieldErrors,
  getApiError,
  resolveAuthErrorMessage,
  useLoginMutation,
} from "../api"
import type { z } from "zod"

type Values = z.infer<typeof loginSchema>

type LoginLocationState = { passwordUpdated?: boolean }

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const login = useLoginMutation()
  const [formError, setFormError] = useState<string | null>(null)
  const [passwordUpdated] = useState(
    () =>
      (location.state as LoginLocationState | null)?.passwordUpdated === true,
  )

  useEffect(() => {
    if (passwordUpdated) {
      navigate({ pathname: location.pathname, search: location.search }, {
        replace: true,
        state: null,
      })
    }
  }, [passwordUpdated, navigate, location.pathname, location.search])
  const form = useForm<Values>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      await login.mutateAsync(values)
      navigate("/", { replace: true })
    } catch (err) {
      const apiError = getApiError(err)
      applyApiFieldErrors(apiError, form.setError)
      setFormError(resolveAuthErrorMessage(t, apiError))
    }
  })

  return (
    <>
      <AuthHeading
        title={t("auth.welcomeBack")}
        subtitle={t("auth.loginSubtitle")}
      />
      {passwordUpdated && (
        <AuthSuccessBanner>{t("auth.passwordUpdated")}</AuthSuccessBanner>
      )}
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
          <FormTextField
            control={form.control}
            name="password"
            dir="ltr"
            label={t("auth.password")}
            type="password"
            autoComplete="current-password"
          />
          <div className="text-end">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-accent hover:underline"
            >
              {t("auth.forgot")}
            </Link>
          </div>
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={form.formState.isSubmitting || login.isPending}
          >
            {t("auth.signIn")}
          </Button>
        </form>
      </Form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.noAccount")}{" "}
        <Link to="/signup" className="font-medium text-accent hover:underline">
          {t("auth.createAccount")}
        </Link>
      </p>
    </>
  )
}
