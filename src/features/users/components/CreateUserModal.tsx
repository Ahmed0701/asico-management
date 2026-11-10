import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { useState } from "react"
import { usePermissions } from "@/features/auth/api"
import { applyApiFieldErrors } from "@/features/auth/api/formErrors"
import { toApiError } from "@/shared/api/errors"
import Modal from "@/shared/ui/Modal"
import Button from "@/shared/ui/Button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/shared/ui/form"
import { FormTextField } from "@/shared/ui/form-text-field"
import { Switch } from "@/shared/ui/switch"
import { idempotencyWrite, useIdempotencyKey } from "@/shared/api/write-safety"
import { useCreateUserMutation } from "../api"
import { usePermissionCatalogQuery } from "@/features/permissions/api"
import { PermissionAssignGroups } from "@/features/permissions/components/PermissionAssignGroups"
import ApiErrorBanner from "./ApiErrorBanner"

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "validation.required")
    .max(100, "validation.max100"),
  email: z
    .string()
    .trim()
    .min(1, "validation.required")
    .email("validation.email"),
  password: z
    .string()
    .min(8, "validation.min8")
    .max(72, "validation.passwordMaxBytes"),
  isActive: z.boolean(),
  permissions: z.array(z.string()),
})

type Values = z.infer<typeof schema>

export default function CreateUserModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const createUser = useCreateUserMutation()
  const idempotency = useIdempotencyKey(open)
  const { data: catalog } = usePermissionCatalogQuery()
  const [apiError, setApiError] =
    useState<ReturnType<typeof toApiError> | null>(null)
  const showPermissions = can("permissions:assign")

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      isActive: true,
      permissions: [],
    },
  })

  const selected = form.watch("permissions")

  const togglePerm = (code: string) => {
    const next = selected.includes(code)
      ? selected.filter((c) => c !== code)
      : [...selected, code]
    form.setValue("permissions", next, { shouldDirty: true })
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setApiError(null)
    try {
      await createUser.mutateAsync({
        input: {
          name: values.name,
          email: values.email,
          password: values.password,
          isActive: values.isActive,
          permissions: showPermissions ? values.permissions : [],
        },
        write: idempotencyWrite(idempotency.getKey()),
      })
      idempotency.resetKey()
      form.reset()
      onClose()
    } catch (err) {
      const parsed = toApiError(err)
      applyApiFieldErrors(parsed, form.setError)
      setApiError(parsed)
    }
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={t("users.createTitle")}
      footer={
        <>
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button
            type="submit"
            form="create-user-form"
            variant="primary"
            disabled={form.formState.isSubmitting || createUser.isPending}
          >
            {t("users.createAction")}
          </Button>
        </>
      }
    >
      <ApiErrorBanner error={apiError} />
      <Form {...form}>
        <form
          id="create-user-form"
          noValidate
          className="space-y-4"
          onSubmit={onSubmit}
        >
          <FormTextField
            control={form.control}
            name="name"
            label={t("users.name")}
          />
          <FormTextField
            control={form.control}
            name="email"
            type="email"
            label={t("users.email")}
            dir="ltr"
            autoComplete="off"
          />
          <FormTextField
            control={form.control}
            name="password"
            type="password"
            label={t("users.password")}
            autoComplete="new-password"
          />
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/50 p-3">
                <FormLabel className="text-sm font-normal">
                  {t("users.active")}
                </FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          {showPermissions && catalog && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <p className="text-sm font-medium">
                {t("users.optionalPermissions")}
              </p>
              <PermissionAssignGroups
                catalog={catalog}
                selected={selected}
                onToggle={togglePerm}
                variant="compact"
              />
            </div>
          )}
        </form>
      </Form>
    </Modal>
  )
}
