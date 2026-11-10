import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { applyApiFieldErrors } from "@/features/auth/api/formErrors"
import { toApiError } from "@/shared/api/errors"
import {
  fullWrite,
  resolveWriteSafetyClientMessage,
  useIdempotencyKey,
} from "@/shared/api/write-safety"
import VersionConflictDialog from "@/shared/ui/VersionConflictDialog"
import Modal from "@/shared/ui/Modal"
import Button from "@/shared/ui/Button"
import { Form } from "@/shared/ui/form"
import { FormTextField } from "@/shared/ui/form-text-field"
import type { UserDetail } from "../api"
import { getUser, useUpdateUserMutation } from "../api"
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
})

type Values = z.infer<typeof schema>

export default function EditUserModal({
  user,
  onClose,
}: {
  user: UserDetail | null
  onClose: () => void
}) {
  if (!user) return null
  return <Inner key={user.id} user={user} onClose={onClose} />
}

type EditUserModalInnerProps = {
  user: UserDetail
  onClose: () => void
}

function Inner({ user, onClose }: EditUserModalInnerProps) {
  const { t } = useTranslation()
  const updateUser = useUpdateUserMutation()
  const idempotency = useIdempotencyKey(true)
  const ifMatchRef = useRef(user.version)
  const [conflictOpen, setConflictOpen] = useState(false)
  const pendingResubmitRef = useRef<(() => Promise<void>) | null>(null)
  const [apiError, setApiError] =
    useState<ReturnType<typeof toApiError> | null>(null)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: user.name, email: user.email },
  })

  useEffect(() => {
    ifMatchRef.current = user.version
    form.reset({ name: user.name, email: user.email })
  }, [user.id, user.version, user.name, user.email, form])

  return (
    <Modal
      open
      onClose={onClose}
      title={t("users.editTitle")}
      footer={
        <>
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button
            type="submit"
            form="user-form"
            variant="primary"
            disabled={form.formState.isSubmitting || updateUser.isPending}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      <ApiErrorBanner error={apiError} />
      <Form {...form}>
        <form
          id="user-form"
          noValidate
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            setApiError(null)
            const run = async () => {
              await updateUser.mutateAsync({
                id: user.id,
                input: values,
                write: fullWrite(idempotency.getKey(), ifMatchRef.current),
              })
              idempotency.resetKey()
              onClose()
            }
            pendingResubmitRef.current = run
            try {
              await run()
            } catch (err) {
              const parsed = toApiError(err)
              if (parsed.code === "VERSION_CONFLICT") {
                const fresh = await getUser(user.id)
                ifMatchRef.current = fresh.version
                setConflictOpen(true)
                return
              }
              applyApiFieldErrors(parsed, form.setError)
              setApiError({
                ...parsed,
                message: resolveWriteSafetyClientMessage(t, parsed),
              })
              idempotency.markRejected()
            }
          })}
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
          />
        </form>
      </Form>
      <VersionConflictDialog
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
        recordLabel={user.name}
        onReload={async () => {
          const fresh = await getUser(user.id)
          form.reset({ name: fresh.name, email: fresh.email })
          ifMatchRef.current = fresh.version
          idempotency.resetKey()
          setConflictOpen(false)
        }}
        onApplyOnTop={() => pendingResubmitRef.current?.()}
      />
    </Modal>
  )
}
