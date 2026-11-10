import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { applyApiFieldErrors } from "@/features/auth/api/formErrors"
import { toApiError } from "@/shared/api/errors"
import { normalizePhoneInput } from "@/shared/lib/phone/phoneNormalize"
import Modal from "@/shared/ui/Modal"
import Button from "@/shared/ui/Button"
import { Form } from "@/shared/ui/form"
import { FormTextField } from "@/shared/ui/form-text-field"
import { formatDateTime } from "@/shared/lib/format"
import {
  useContractorQuery,
  useCreateContractorMutation,
  useUpdateContractorMutation,
} from "../api"
import { contractorFormSchema, type ContractorFormValues } from "../schema"
import { FormFieldsSkeleton } from "@/shared/ui/loading-skeletons"
import {
  fullWrite,
  idempotencyWrite,
  resolveWriteSafetyClientMessage,
  useIdempotencyKey,
} from "@/shared/api/write-safety"
import VersionConflictDialog from "@/shared/ui/VersionConflictDialog"
import { getContractor } from "../api/contractors.api"
import DirectoryEmailFormField from "@/shared/directory/DirectoryEmailFormField"
import {
  directoryEmailForApi,
  directoryEmailFromApi,
  stripDirectoryEmailFromPayload,
} from "@/shared/directory/directoryEmailPayload"
import { DIRECTORY_EMAIL_API_ENABLED } from "@/shared/config/directoryEmail"

export default function ContractorFormModal({
  open,
  contractorId,
  onClose,
  onSaved,
  onDeletedWhileEditing,
}: {
  open: boolean
  contractorId?: string
  onClose: () => void
  onSaved: () => void
  onDeletedWhileEditing: () => void
}) {
  if (!open) return null
  return (
    <Inner
      key={contractorId ?? "new"}
      contractorId={contractorId}
      onClose={onClose}
      onSaved={onSaved}
      onDeletedWhileEditing={onDeletedWhileEditing}
    />
  )
}

function Inner({
  contractorId,
  onClose,
  onSaved,
  onDeletedWhileEditing,
}: {
  contractorId?: string
  onClose: () => void
  onSaved: () => void
  onDeletedWhileEditing: () => void
}) {
  const { t } = useTranslation()
  const isEdit = !!contractorId
  const {
    data: loaded,
    isError,
    error,
  } = useContractorQuery(isEdit ? contractorId : undefined)
  const create = useCreateContractorMutation()
  const update = useUpdateContractorMutation()
  const idempotency = useIdempotencyKey(true)
  const ifMatchRef = useRef<number | undefined>(undefined)
  const [conflictOpen, setConflictOpen] = useState(false)
  const pendingResubmitRef = useRef<(() => Promise<void>) | null>(null)
  const [apiError, setApiError] =
    useState<ReturnType<typeof toApiError> | null>(null)
  const baseline = useRef<{
    name: string
    phone: string
    email: string
  } | null>(null)

  useEffect(() => {
    if (loaded) ifMatchRef.current = loaded.version
  }, [loaded?.id, loaded?.version, loaded])

  const form = useForm<ContractorFormValues>({
    resolver: zodResolver(contractorFormSchema),
    defaultValues: { name: "", phone: "", email: "" },
  })

  useEffect(() => {
    if (isEdit && loaded) {
      const email = directoryEmailFromApi(loaded.email)
      form.reset({ name: loaded.name, phone: loaded.phone, email })
      baseline.current = { name: loaded.name, phone: loaded.phone, email }
    }
    if (!isEdit) {
      form.reset({ name: "", phone: "", email: "" })
      baseline.current = null
    }
  }, [isEdit, loaded, form])

  useEffect(() => {
    if (isEdit && isError) {
      const parsed = toApiError(error)
      if (parsed.code === "CONTRACTOR_NOT_FOUND" || parsed.status === 404) {
        onDeletedWhileEditing()
        onClose()
      }
    }
  }, [isEdit, isError, error, onClose, onDeletedWhileEditing])

  const onPhoneBlur = () => {
    const v = form.getValues("phone")
    const next = normalizePhoneInput(v)
    if (next !== v) form.setValue("phone", next, { shouldValidate: true })
  }

  const submit = form.handleSubmit(async (values) => {
    setApiError(null)
    const name = values.name.trim()
    const phone = normalizePhoneInput(values.phone)
    const email = directoryEmailForApi(values.email)
    const baseEmail = baseline.current
      ? directoryEmailForApi(baseline.current.email)
      : null

    const run = async () => {
      if (isEdit && contractorId && baseline.current) {
        const patch: {
          name?: string
          phone?: string
          email?: string | null
        } = {}
        if (name !== baseline.current.name) patch.name = name
        if (phone !== baseline.current.phone) patch.phone = phone
        if (DIRECTORY_EMAIL_API_ENABLED && email !== baseEmail) {
          patch.email = email
        }
        const apiPatch = stripDirectoryEmailFromPayload(patch)
        if (Object.keys(apiPatch).length === 0) {
          onClose()
          return
        }
        await update.mutateAsync({
          id: contractorId,
          input: apiPatch,
          write: fullWrite(idempotency.getKey(), ifMatchRef.current),
        })
      } else {
        await create.mutateAsync({
          input: stripDirectoryEmailFromPayload({ name, phone, email }),
          write: idempotencyWrite(idempotency.getKey()),
        })
      }
      idempotency.resetKey()
      onSaved()
      onClose()
    }

    pendingResubmitRef.current = run
    try {
      await run()
    } catch (err) {
      const parsed = toApiError(err)
      if (parsed.code === "VERSION_CONFLICT" && contractorId) {
        const fresh = await getContractor(contractorId)
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
  })

  useEffect(() => {
    const sub = form.watch(() => idempotency.onEditAfterReject())
    return () => sub.unsubscribe()
  }, [form, idempotency])

  const loadingEdit = isEdit && !loaded && !isError

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? t("contractors.editTitle") : t("contractors.addTitle")}
      footer={
        <>
          <Button type="button" autoFocus onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="contractor-form"
            variant="primary"
            disabled={loadingEdit || create.isPending || update.isPending}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      {apiError && !apiError.details?.length && (
        <div
          role="alert"
          className="mb-3 rounded-lg bg-danger-soft p-3 text-sm text-danger"
        >
          {apiError.message}
          {apiError.requestId && (
            <p dir="ltr" className="mt-1 font-mono text-xs">
              {t("common.requestId", { id: apiError.requestId })}
            </p>
          )}
        </div>
      )}
      {loadingEdit ? (
        <FormFieldsSkeleton fields={3} />
      ) : (
        <Form {...form}>
          <form
            id="contractor-form"
            noValidate
            className="space-y-4"
            onSubmit={submit}
          >
            {isEdit && loaded && (
              <p className="text-xs text-muted-foreground">
                {t("contractors.lastUpdated", {
                  time: formatDateTime(loaded.updatedAt),
                })}
              </p>
            )}
            <FormTextField
              control={form.control}
              name="name"
              label={t("contractors.name")}
              dir="auto"
            />
            <FormTextField
              control={form.control}
              name="phone"
              label={t("contractors.phone")}
              dir="ltr"
              onBlur={onPhoneBlur}
            />
            <DirectoryEmailFormField control={form.control} name="email" />
          </form>
        </Form>
      )}
      <VersionConflictDialog
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
        recordLabel={loaded?.name ?? ""}
        onReload={() => {
          void getContractor(contractorId!).then((fresh) => {
            const freshEmail = directoryEmailFromApi(fresh.email)
            form.reset({
              name: fresh.name,
              phone: fresh.phone,
              email: freshEmail,
            })
            baseline.current = {
              name: fresh.name,
              phone: fresh.phone,
              email: freshEmail,
            }
            ifMatchRef.current = fresh.version
            idempotency.resetKey()
            setConflictOpen(false)
          })
        }}
        onApplyOnTop={() => pendingResubmitRef.current?.()}
      />
    </Modal>
  )
}
