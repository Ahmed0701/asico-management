import { useEffect, useRef, useState } from "react"
import { SearchSelect } from "@/shared/ui/search-select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { useElecPhaseOptionsQuery } from "@/features/elec-phases/api"
import { applyApiFieldErrors } from "@/features/auth/api/formErrors"
import { useVillaOptionsQuery, useVillaQuery } from "@/features/villas/api"
import { toApiError } from "@/shared/api/errors"
import {
  fullWrite,
  idempotencyWrite,
  useIdempotencyKey,
} from "@/shared/api/write-safety"
import Modal from "@/shared/ui/Modal"
import Button from "@/shared/ui/Button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/shared/ui/form"
import { Input } from "@/shared/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { FormFieldsSkeleton } from "@/shared/ui/loading-skeletons"
import VersionConflictDialog from "@/shared/ui/VersionConflictDialog"
import { toast } from "@/shared/lib/toast"
import {
  useCreateOpenWorkMutation,
  useOpenWorkQuery,
  useVillaOpenWorksQuery,
  useUpdateOpenWorkMutation,
  WORK_STATUSES,
  PRIORITIES,
} from "../api"
import {
  openWorkCreateSchema,
  openWorkEditSchema,
  type OpenWorkCreateFormValues,
  type OpenWorkEditFormValues,
} from "../schema"
import { getOpenWork } from "../api/open-works.api"

type SharedProps = {
  onClose: () => void
  onSaved: () => void
  onDeletedWhileEditing?: () => void
}

export default function OpenWorkFormModal({
  open,
  workId,
  defaultVillaId,
  onClose,
  onSaved,
  onDeletedWhileEditing,
}: {
  open: boolean
  workId?: string
  defaultVillaId?: string
  onClose: () => void
  onSaved: () => void
  onDeletedWhileEditing?: () => void
}) {
  if (!open) return null
  return (
    <Inner
      key={workId ?? `new-${defaultVillaId ?? ""}`}
      workId={workId}
      defaultVillaId={defaultVillaId}
      onClose={onClose}
      onSaved={onSaved}
      onDeletedWhileEditing={onDeletedWhileEditing}
    />
  )
}

function Inner({
  workId,
  defaultVillaId,
  onClose,
  onSaved,
  onDeletedWhileEditing,
}: {
  workId?: string
  defaultVillaId?: string
} & SharedProps) {
  const { t } = useTranslation()
  const isEdit = !!workId
  const {
    data: loaded,
    isError,
    error,
  } = useOpenWorkQuery(isEdit ? workId : undefined)
  const create = useCreateOpenWorkMutation()
  const update = useUpdateOpenWorkMutation()
  const idempotency = useIdempotencyKey(true)
  const ifMatchRef = useRef<number | undefined>(undefined)
  const [conflictOpen, setConflictOpen] = useState(false)
  const { data: villaOptions } = useVillaOptionsQuery()
  const {
    data: elecPhaseOptions,
    isError: elecPhaseOptionsError,
    error: elecPhaseOptionsErr,
  } = useElecPhaseOptionsQuery()
  const elecPhaseOptionsForbidden =
    elecPhaseOptionsError && toApiError(elecPhaseOptionsErr).status === 403
  const createBlockedByElecPhaseOptions = !isEdit && elecPhaseOptionsForbidden

  const createForm = useForm<OpenWorkCreateFormValues>({
    resolver: zodResolver(openWorkCreateSchema),
    defaultValues: {
      villaId: defaultVillaId ?? "",
      elecPhaseId: "",
      status: "NOT_STARTED",
      priority: "MEDIUM",
      progress: 0,
      contractorId: "",
      startDate: "",
      endDate: "",
    },
  })

  const editForm = useForm<OpenWorkEditFormValues>({
    resolver: zodResolver(openWorkEditSchema),
    defaultValues: {
      elecPhaseId: "",
      status: "NOT_STARTED",
      priority: "MEDIUM",
      progress: 0,
      contractorId: "",
      startDate: "",
      endDate: "",
    },
  })

  const villaIdWatch = isEdit ? loaded?.villa.id : createForm.watch("villaId")
  const { data: villaDetail } = useVillaQuery(
    !isEdit && villaIdWatch ? villaIdWatch : undefined,
  )
  const villaForContractor = isEdit ? loaded?.villa.id : villaIdWatch
  const { data: editVilla } = useVillaQuery(
    isEdit && villaForContractor ? villaForContractor : undefined,
  )
  const villaContractor = isEdit
    ? editVilla?.contractor
    : villaDetail?.contractor

  useEffect(() => {
    if (!loaded || !isEdit) return
    ifMatchRef.current = loaded.version
    editForm.reset({
      elecPhaseId: loaded.elecPhase.id,
      status: loaded.status,
      priority: loaded.priority,
      progress: loaded.progress,
      contractorId: loaded.contractor?.id ?? "",
      startDate: loaded.startDate ?? "",
      endDate: loaded.endDate ?? "",
    })
  }, [loaded, isEdit, editForm])

  useEffect(() => {
    if (isEdit || !villaContractor) return
    createForm.setValue("contractorId", villaContractor.id)
  }, [isEdit, villaContractor, createForm])

  // A villa has at most one open work per elec phase: the phases it already has
  // (other than this open work's own) are shown but cannot be picked.
  const villaIdForPhases = isEdit ? loaded?.villa.id : villaIdWatch
  const { data: villaOpenWorks } = useVillaOpenWorksQuery(
    villaIdForPhases || undefined,
  )
  const takenPhaseIds = new Set(
    (villaOpenWorks?.data ?? [])
      .filter((work) => work.villa.id === villaIdForPhases)
      .filter((work) => work.id !== loaded?.id)
      .map((work) => work.elecPhase.id),
  )

  const mapPayload = (
    values: OpenWorkCreateFormValues | OpenWorkEditFormValues,
  ) => ({
    elecPhaseId: values.elecPhaseId.trim(),
    status: values.status,
    priority: values.priority,
    progress: values.progress,
    contractorId: values.contractorId?.trim() || null,
    startDate: values.startDate?.trim() || null,
    endDate: values.endDate?.trim() || null,
  })

  const handleApiError = (
    err: unknown,
    setError: typeof createForm.setError,
  ) => {
    const parsed = toApiError(err)
    if (parsed.code === "WORK_ITEM_NOT_FOUND" || parsed.status === 404) {
      onDeletedWhileEditing?.()
      onClose()
      return
    }
    if (parsed.code === "VERSION_CONFLICT") {
      setConflictOpen(true)
      return
    }
    if (parsed.code === "OPEN_WORK_PHASE_TAKEN") {
      setError("elecPhaseId", { message: "openWorks.errors.phaseTaken" })
      toast.error(t("openWorks.errors.phaseTaken"))
      return
    }
    if (parsed.code === "ELEC_PHASE_INACTIVE") {
      toast.error(t("openWorks.errors.elecPhaseInactive"))
      return
    }
    if (parsed.code === "ELEC_PHASE_NOT_FOUND") {
      toast.error(t("openWorks.errors.elecPhaseNotFound"))
      return
    }
    applyApiFieldErrors(parsed, setError)
    if (!parsed.details?.length) {
      toast.error(parsed.message)
    }
  }

  const onSubmitCreate = async (values: OpenWorkCreateFormValues) => {
    try {
      await create.mutateAsync({
        input: {
          villaId: values.villaId,
          ...mapPayload(values),
        },
        write: idempotencyWrite(idempotency.getKey()),
      })
      idempotency.resetKey()
      onSaved()
      onClose()
    } catch (err) {
      idempotency.markRejected()
      handleApiError(err, createForm.setError)
    }
  }

  const onSubmitEdit = async (values: OpenWorkEditFormValues) => {
    if (!loaded) return
    try {
      await update.mutateAsync({
        id: loaded.id,
        input: mapPayload(values),
        write: fullWrite(idempotency.getKey(), ifMatchRef.current!),
      })
      idempotency.resetKey()
      onSaved()
      onClose()
    } catch (err) {
      idempotency.markRejected()
      handleApiError(err, editForm.setError)
    }
  }

  const busy = create.isPending || update.isPending
  const loading = isEdit && !loaded && !isError

  if (isEdit && isError) {
    const parsed = toApiError(error)
    return (
      <Modal open onClose={onClose} title={t("openWorks.editTitle")}>
        <p className="text-sm text-muted-foreground">{parsed.message}</p>
      </Modal>
    )
  }

  return (
    <>
      <Modal
        open
        onClose={busy ? () => {} : onClose}
        title={isEdit ? t("openWorks.editTitle") : t("openWorks.addTitle")}
        size="lg"
        footer={
          <>
            <Button type="button" disabled={busy} onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              form="open-work-form"
              variant="primary"
              disabled={busy || loading || createBlockedByElecPhaseOptions}
            >
              {t("common.save")}
            </Button>
          </>
        }
      >
        {loading ? (
          <FormFieldsSkeleton fields={6} />
        ) : isEdit ? (
          <Form {...editForm}>
            <form
              id="open-work-form"
              className="space-y-4"
              onSubmit={editForm.handleSubmit(onSubmitEdit)}
            >
              <OpenWorkSharedFields
                control={editForm.control}
                villaContractor={villaContractor}
                elecPhaseOptions={elecPhaseOptions ?? []}
                takenPhaseIds={takenPhaseIds}
              />
            </form>
          </Form>
        ) : (
          <Form {...createForm}>
            <form
              id="open-work-form"
              className="space-y-4"
              onSubmit={createForm.handleSubmit(onSubmitCreate)}
            >
              <FormField
                control={createForm.control}
                name="villaId"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t("openWorks.fieldVilla")}</FormLabel>
                    <FormControl>
                      <SearchSelect
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!!defaultVillaId}
                        options={(villaOptions ?? []).map((v) => ({
                          value: v.id,
                          label: v.villaNumber,
                        }))}
                        placeholder={t("openWorks.selectVilla")}
                      />
                    </FormControl>
                    <OpenWorkFormError message={fieldState.error?.message} />
                  </FormItem>
                )}
              />
              <OpenWorkSharedFields
                control={
                  createForm.control as unknown as import("react-hook-form").Control<OpenWorkEditFormValues>
                }
                villaContractor={villaContractor}
                elecPhaseOptions={elecPhaseOptions ?? []}
                elecPhaseOptionsForbidden={createBlockedByElecPhaseOptions}
                takenPhaseIds={takenPhaseIds}
              />
            </form>
          </Form>
        )}
      </Modal>
      <VersionConflictDialog
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
        recordLabel={t("openWorks.entityName")}
        onReload={async () => {
          if (!workId) return
          const fresh = await getOpenWork(workId)
          ifMatchRef.current = fresh.version
          editForm.reset({
            elecPhaseId: fresh.elecPhase.id,
            status: fresh.status,
            priority: fresh.priority,
            progress: fresh.progress,
            contractorId: fresh.contractor?.id ?? "",
            startDate: fresh.startDate ?? "",
            endDate: fresh.endDate ?? "",
          })
          setConflictOpen(false)
        }}
        onApplyOnTop={() => void editForm.handleSubmit(onSubmitEdit)()}
      />
    </>
  )
}

const I18N_FORM_ERROR = /^(openWorks\.|validation\.)/

function OpenWorkFormError({
  message,
  className = "text-red-500 text-[10px]",
}: {
  message?: string
  className?: string
}) {
  const { t } = useTranslation()
  if (!message) return null
  const text = I18N_FORM_ERROR.test(message) ? t(message) : message
  return <p className={className}>{text}</p>
}

function OpenWorkSharedFields({
  control,
  villaContractor,
  elecPhaseOptions,
  elecPhaseOptionsForbidden,
  takenPhaseIds,
}: {
  control: import("react-hook-form").Control<OpenWorkEditFormValues>
  villaContractor: import("../api/open-works.types").OpenWorkPartyRef | null | undefined
  elecPhaseOptions: {
    id: string
    name: string
  }[]
  elecPhaseOptionsForbidden?: boolean
  takenPhaseIds: ReadonlySet<string>
}) {
  const { t } = useTranslation()
  return (
    <>
      <FormField
        control={control}
        name="elecPhaseId"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("openWorks.fieldElecPhase")}</FormLabel>
            {elecPhaseOptionsForbidden ? (
              <p className="text-sm text-muted-foreground">
                {t("openWorks.elecPhaseOptionsForbidden")}
              </p>
            ) : (
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("openWorks.selectElecPhase")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {elecPhaseOptions.map((p) => {
                    const taken = takenPhaseIds.has(p.id)
                    return (
                      <SelectItem key={p.id} value={p.id} disabled={taken}>
                        {taken
                          ? `${p.name} (${t("openWorks.phaseAlreadyAdded")})`
                          : p.name}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            )}
            <input type="hidden" {...field} />
            <OpenWorkFormError message={fieldState.error?.message} />
          </FormItem>
        )}
      />
      <div className="space-y-2">
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 sm:items-start">
          <FormField
            control={control}
            name="status"
            render={({ field, fieldState }) => (
              <FormItem className="gap-2">
                <FormLabel>{t("openWorks.fieldStatus")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {WORK_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`openWorks.status.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <OpenWorkFormError message={fieldState.error?.message} />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="progress"
            render={({ field, fieldState }) => (
              <FormItem className="gap-2">
                <FormLabel>{t("openWorks.fieldProgress")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <OpenWorkFormError message={fieldState.error?.message} />
              </FormItem>
            )}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          {t("openWorks.statusProgressHint")}
        </p>
      </div>
      <FormField
        control={control}
        name="priority"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("openWorks.fieldPriority")}</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {t(`openWorks.priority.${p}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <OpenWorkFormError message={fieldState.error?.message} />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="contractorId"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("openWorks.fieldContractor")}</FormLabel>
            {!villaContractor ? (
              <p className="text-sm text-muted-foreground">
                {t("openWorks.noVillaContractor")}
              </p>
            ) : (
              <p className="text-sm" dir="auto">
                {villaContractor.name}
              </p>
            )}
            <input type="hidden" {...field} />
            <OpenWorkFormError message={fieldState.error?.message} />
          </FormItem>
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
        <FormField
          control={control}
          name="startDate"
          render={({ field, fieldState }) => (
            <FormItem className="gap-2">
              <FormLabel>{t("openWorks.fieldStartDate")}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <OpenWorkFormError message={fieldState.error?.message} />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="endDate"
          render={({ field, fieldState }) => (
            <FormItem className="gap-2">
              <FormLabel>{t("openWorks.fieldEndDate")}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <OpenWorkFormError message={fieldState.error?.message} />
            </FormItem>
          )}
        />
      </div>
    </>
  )
}
