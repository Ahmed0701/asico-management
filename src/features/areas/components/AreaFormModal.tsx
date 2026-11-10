import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { applyApiFieldErrors } from "@/features/auth/api/formErrors"
import { toApiError } from "@/shared/api/errors"
import Modal from "@/shared/ui/Modal"
import Button from "@/shared/ui/Button"
import { Form } from "@/shared/ui/form"
import { FormTextField } from "@/shared/ui/form-text-field"
import { FormFieldsSkeleton } from "@/shared/ui/loading-skeletons"
import {
  fullWrite,
  idempotencyWrite,
  resolveWriteSafetyClientMessage,
  useIdempotencyKey,
} from "@/shared/api/write-safety"
import VersionConflictDialog from "@/shared/ui/VersionConflictDialog"
import {
  getArea,
  useAreaQuery,
  useCreateAreaMutation,
  useUpdateAreaMutation,
  type UpdateAreaInput,
} from "../api"
import { areaFormSchema, type AreaFormValues } from "../schema"

export default function AreaFormModal({
  open,
  areaId,
  onClose,
  onSaved,
  onDeletedWhileEditing,
}: {
  open: boolean
  areaId?: string
  onClose: () => void
  onSaved: () => void
  onDeletedWhileEditing: () => void
}) {
  if (!open) return null
  return (
    <Inner
      key={areaId ?? "new"}
      areaId={areaId}
      onClose={onClose}
      onSaved={onSaved}
      onDeletedWhileEditing={onDeletedWhileEditing}
    />
  )
}

function Inner({
  areaId,
  onClose,
  onSaved,
  onDeletedWhileEditing,
}: {
  areaId?: string
  onClose: () => void
  onSaved: () => void
  onDeletedWhileEditing: () => void
}) {
  const { t } = useTranslation()
  const isEdit = !!areaId
  const {
    data: loaded,
    isError,
    error,
  } = useAreaQuery(isEdit ? areaId : undefined)
  const create = useCreateAreaMutation()
  const update = useUpdateAreaMutation()
  const idempotency = useIdempotencyKey(true)
  const ifMatchRef = useRef<number | undefined>(undefined)
  const [conflictOpen, setConflictOpen] = useState(false)
  const pendingResubmitRef = useRef<(() => Promise<void>) | null>(null)
  const [apiError, setApiError] =
    useState<ReturnType<typeof toApiError> | null>(null)
  const baseline = useRef<AreaFormValues | null>(null)

  useEffect(() => {
    if (loaded) ifMatchRef.current = loaded.version
  }, [loaded?.id, loaded?.version, loaded])

  const form = useForm<AreaFormValues>({
    resolver: zodResolver(areaFormSchema),
    defaultValues: { name: "", city: "" },
  })

  useEffect(() => {
    if (isEdit && loaded) {
      const values = { name: loaded.name, city: loaded.city }
      form.reset(values)
      baseline.current = values
    }
    if (!isEdit) {
      form.reset({ name: "", city: "" })
      baseline.current = null
    }
  }, [isEdit, loaded, form])

  useEffect(() => {
    if (isEdit && isError) {
      const parsed = toApiError(error)
      if (parsed.code === "AREA_NOT_FOUND" || parsed.status === 404) {
        onDeletedWhileEditing()
        onClose()
      }
    }
  }, [isEdit, isError, error, onClose, onDeletedWhileEditing])

  const submit = form.handleSubmit(async (values) => {
    setApiError(null)
    const name = values.name.trim()
    const city = values.city.trim()

    const run = async () => {
      if (isEdit && areaId && baseline.current) {
        const patch: UpdateAreaInput = {}
        if (name !== baseline.current.name) patch.name = name
        if (city !== baseline.current.city) patch.city = city
        if (Object.keys(patch).length === 0) {
          onClose()
          return
        }
        await update.mutateAsync({
          id: areaId,
          input: patch,
          write: fullWrite(idempotency.getKey(), ifMatchRef.current),
        })
      } else {
        await create.mutateAsync({
          input: { name, city },
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
      if (parsed.code === "VERSION_CONFLICT" && areaId) {
        const fresh = await getArea(areaId)
        ifMatchRef.current = fresh.version
        form.reset({ name: fresh.name, city: fresh.city })
        baseline.current = { name: fresh.name, city: fresh.city }
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
    <>
      <Modal
        open
        onClose={onClose}
        title={isEdit ? t("areas.editTitle") : t("areas.addTitle")}
        footer={
          <>
            <Button type="button" autoFocus onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              form="area-form"
              variant="primary"
              disabled={loadingEdit || create.isPending || update.isPending}
            >
              {t("common.save")}
            </Button>
          </>
        }
      >
        {apiError && !apiError.details?.length && (
          <p className="mb-3 text-sm text-danger" role="alert">
            {apiError.message}
          </p>
        )}
        {loadingEdit ? (
          <FormFieldsSkeleton fields={2} />
        ) : (
          <Form {...form}>
            <form
              id="area-form"
              onSubmit={(e) => void submit(e)}
              className="space-y-4"
            >
              <FormTextField
                control={form.control}
                name="name"
                label={t("areas.name")}
                maxLength={100}
              />
              <FormTextField
                control={form.control}
                name="city"
                label={t("areas.city")}
                maxLength={100}
              />
            </form>
          </Form>
        )}
      </Modal>
      <VersionConflictDialog
        open={conflictOpen}
        recordLabel={loaded?.name ?? t("areas.title")}
        onReload={async () => {
          if (!areaId) return
          const fresh = await getArea(areaId)
          ifMatchRef.current = fresh.version
          form.reset({ name: fresh.name, city: fresh.city })
          baseline.current = { name: fresh.name, city: fresh.city }
          setConflictOpen(false)
        }}
        onApplyOnTop={async () => {
          setConflictOpen(false)
          await pendingResubmitRef.current?.()
        }}
        onClose={() => setConflictOpen(false)}
        applyPending={create.isPending || update.isPending}
      />
    </>
  )
}
