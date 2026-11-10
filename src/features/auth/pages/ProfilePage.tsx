import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import Button from "@/shared/ui/Button"
import { Form } from "@/shared/ui/form"
import PageHeader, { Card } from "@/shared/ui/PageHeader"
import { Badge } from "@/shared/ui/Badge"
import { FormFieldsSkeleton } from "@/shared/ui/loading-skeletons"
import { Skeleton } from "@/shared/ui/skeleton"
import { DetailField, DetailFieldGrid } from "@/shared/ui/detail-fields"
import { formatDateTime } from "@/shared/lib/format"
import { FormTextField } from "@/shared/ui/form-text-field"
import { ReadOnlyField } from "@/shared/ui/read-only-field"
import ProfilePermissionsList from "../components/ProfilePermissionsList"
import { AuthErrorBanner } from "../components/AuthStatusBanner"
import { toast } from "@/shared/lib/toast"
import {
  applyApiFieldErrors,
  getApiError,
  useMeQuery,
  useUpdateMeMutation,
} from "../api"
import { profileSchema } from "../schemas"
import type { z } from "zod"

type Values = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { t } = useTranslation()
  const { data: user, isLoading } = useMeQuery()
  const updateMe = useUpdateMeMutation()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<Values>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: { name: user?.name ?? "" },
  })

  useEffect(() => {
    if (user?.name != null) {
      form.reset({ name: user.name })
    }
  }, [user?.name, form])

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      const updated = await updateMe.mutateAsync(values)
      form.reset({ name: updated.name })
      toast.success(t("auth.nameUpdated"))
    } catch (err) {
      const apiError = getApiError(err)
      applyApiFieldErrors(apiError, form.setError)
      setFormError(apiError.message)
    }
  })

  form.watch("name")
  const { isDirty, isSubmitting } = form.formState
  const nameValid = profileSchema.safeParse(form.getValues()).success
  const canSaveName =
    isDirty && nameValid && !isSubmitting && !updateMe.isPending

  const roleKey =
    user?.role && t(`roles.${user.role}`, { defaultValue: user.role })

  return (
    <>
      <PageHeader
        title={t("auth.profileTitle")}
        subtitle={t("auth.profileSubtitle")}
      />
      {isLoading && !user ? (
        <div className="grid w-full gap-4 lg:grid-cols-2" aria-busy="true">
          <Card className="p-6">
            <FormFieldsSkeleton fields={2} />
          </Card>
          <Card className="space-y-3 p-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </Card>
        </div>
      ) : (
        <div className="grid w-full gap-4 lg:grid-cols-2">
          <Card className="p-6">
            {formError && <AuthErrorBanner>{formError}</AuthErrorBanner>}
            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <FormTextField
                  control={form.control}
                  name="name"
                  label={t("auth.fullName")}
                />
                <ReadOnlyField
                  label={t("auth.email")}
                  dir="ltr"
                  value={user?.email ?? ""}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!canSaveName}
                  >
                    {t("common.save")}
                  </Button>
                </div>
              </form>
            </Form>

            <div className="mt-6 border-t border-border pt-5">
              <h2 className="mb-3 text-sm font-medium">
                {t("auth.profileAccountSection")}
              </h2>
              <DetailFieldGrid columns="two">
                <DetailField label={t("users.role")} boxed>
                  <Badge tone={user?.role === "ADMIN" ? "info" : "neutral"}>
                    {roleKey}
                  </Badge>
                </DetailField>
                <DetailField label={t("users.status")} boxed>
                  <Badge tone={user?.isActive ? "success" : "danger"}>
                    {user?.isActive ? t("users.active") : t("users.disabled")}
                  </Badge>
                </DetailField>
                {user?.createdAt && (
                  <DetailField
                    label={t("users.createdAt")}
                    boxed
                    className="sm:col-span-2"
                  >
                    <span className="tabular-nums">
                      {formatDateTime(user.createdAt)}
                    </span>
                  </DetailField>
                )}
              </DetailFieldGrid>
            </div>
          </Card>

          <Card className="flex max-h-[min(70vh,720px)] flex-col p-6">
            <div className="mb-4 shrink-0">
              <h2 className="text-sm font-medium">
                {t("auth.profilePermissionsSection")}
              </h2>
              {user?.role === "ADMIN" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("users.adminPermissionsImplied")}
                </p>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pe-1">
              <ProfilePermissionsList permissions={user?.permissions ?? []} />
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
