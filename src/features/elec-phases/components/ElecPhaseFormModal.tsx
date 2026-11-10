import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
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
  FormMessage,
} from "@/shared/ui/form"
import { FormTextField } from "@/shared/ui/form-text-field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { FormFieldsSkeleton } from "@/shared/ui/loading-skeletons"
import {
  fullWrite,
  idempotencyWrite,
  resolveWriteSafetyClientMessage,
  useIdempotencyKey,
} from "@/shared/api/write-safety"
import VersionConflictDialog from "@/shared/ui/VersionConflictDialog"
import {
  getElecPhase,
  useCreateElecPhaseMutation,
  useElecPhaseQuery,
  useUpdateElecPhaseMutation,
  type UpdateElecPhaseInput,
  type ElecPhase,
} from "../api"
import { elecPhaseFormSchema, type ElecPhaseFormValues } from "../schema"

const EMPTY: ElecPhaseFormValues = {
  name: "",
  status: "ACTIVE",
  progressRatio: "0",
}

function toFormValues(phase: ElecPhase): ElecPhaseFormValues {
  return {
    name: phase.name,
    status: phase.status,
    progressRatio: String(phase.progressRatio),
  }
}

export default function ElecPhaseFormModal({
  open,
  phaseId,
  onClose,
  onSaved,
  onDeletedWhileEditing,
}: {
  open: boolean
  phaseId?: string
  onClose: () => void
  onSaved: () => void
  onDeletedWhileEditing: () => void
}) {
  if (!open) return null
  return (
    <Inner
      key={phaseId ?? "new"}
      phaseId={phaseId}
      onClose={onClose}
      onSaved={onSaved}
      onDeletedWhileEditing={onDeletedWhileEditing}
    />
  )
}

function Inner({
  phaseId,
  onClose,
  onSaved,
  onDeletedWhileEditing,
}: {
  phaseId?: string
  onClose: () => void
  onSaved: () => void
  onDeletedWhileEditing: () => void
}) {
  const { t } = useTranslation()
  const isEdit = !!phaseId
  const {
    data: loaded,
    isError,
    error,
  } = useElecPhaseQuery(isEdit ? phaseId : undefined)
  const create = useCreateElecPhaseMutation()
  const update = useUpdateElecPhaseMutation()
  const idempotency = useIdempotencyKey(true)
  const ifMatchRef = useRef<number | undefined>(undefined)
  const [conflictOpen, setConflictOpen] = useState(false)
  const pendingResubmitRef = useRef<(() => Promise<void>) | null>(null)
  const [apiError, setApiError] =
    useState<ReturnType<typeof toApiError> | null>(null)
  const baseline = useRef<ElecPhaseFormValues | null>(null)

  useEffect(() => {
    if (loaded) ifMatchRef.current = loaded.version
  }, [loaded?.id, loaded?.version, loaded])

  const form = useForm<ElecPhaseFormValues>({
    resolver: zodResolver(elecPhaseFormSchema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (isEdit && loaded) {
      const values = toFormValues(loaded)
      form.reset(values)
      baseline.current = values
    }
    if (!isEdit) {
      form.reset(EMPTY)
      baseline.current = null
    }
  }, [isEdit, loaded, form])

  useEffect(() => {
    if (isEdit && isError) {
      const parsed = toApiError(error)
      if (parsed.code === "ELEC_PHASE_NOT_FOUND" || parsed.status === 404) {
        onDeletedWhileEditing()
        onClose()
      }
    }
  }, [isEdit, isError, error, onClose, onDeletedWhileEditing])

  const submit = form.handleSubmit(async (values) => {
    setApiError(null)
    const name = values.name.trim()
    const progressRatio = Number(values.progressRatio)

    const run = async () => {
      if (isEdit && phaseId && baseline.current) {
        const patch: UpdateElecPhaseInput = {}
        if (name !== baseline.current.name) patch.name = name
        if (values.status !== baseline.current.status)
          patch.status = values.status
        if (values.progressRatio !== baseline.current.progressRatio)
          patch.progressRatio = progressRatio
        if (Object.keys(patch).length === 0) {
          onClose()
          return
        }
        await update.mutateAsync({
          id: phaseId,
          input: patch,
          write: fullWrite(idempotency.getKey(), ifMatchRef.current),
        })
      } else {
        await create.mutateAsync({
          input: { name, status: values.status, progressRatio },
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
      if (parsed.code === "VERSION_CONFLICT" && phaseId) {
        const fresh = await getElecPhase(phaseId)
        ifMatchRef.current = fresh.version
        form.reset(toFormValues(fresh))
        baseline.current = toFormValues(fresh)
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
        title={isEdit ? t("elecPhases.editTitle") : t("elecPhases.addTitle")}
        footer={
          <>
            <Button type="button" autoFocus onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              form="elec-phase-form"
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
          <FormFieldsSkeleton fields={3} />
        ) : (
          <Form {...form}>
            <form
              id="elec-phase-form"
              onSubmit={(e) => void submit(e)}
              className="space-y-4"
            >
              <FormTextField
                control={form.control}
                name="name"
                label={t("elecPhases.name")}
                maxLength={100}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("elecPhases.status")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">
                          {t("elecPhases.statusLabels.ACTIVE")}
                        </SelectItem>
                        <SelectItem value="INACTIVE">
                          {t("elecPhases.statusLabels.INACTIVE")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-500 text-[10px]" />
                  </FormItem>
                )}
              />
              <div>
                <FormTextField
                  control={form.control}
                  name="progressRatio"
                  label={`${t("elecPhases.progressRatio")} (%)`}
                  type="number"
                  inputMode="numeric"
                  maxLength={3}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("elecPhases.progressRatioHint")}
                </p>
              </div>
            </form>
          </Form>
        )}
      </Modal>
      <VersionConflictDialog
        open={conflictOpen}
        recordLabel={loaded?.name ?? t("elecPhases.title")}
        onReload={async () => {
          if (!phaseId) return
          const fresh = await getElecPhase(phaseId)
          ifMatchRef.current = fresh.version
          form.reset(toFormValues(fresh))
          baseline.current = toFormValues(fresh)
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
