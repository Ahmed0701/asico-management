import { useEffect, useRef, useState } from "react"
import { SearchSelect } from "@/shared/ui/search-select"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
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
import I18nFormError from "@/shared/ui/I18nFormError"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/shared/ui/form"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { FormFieldsSkeleton } from "@/shared/ui/loading-skeletons"
import VersionConflictDialog from "@/shared/ui/VersionConflictDialog"
import { toast } from "@/shared/lib/toast"
import {
  useCreateDailyLabourMutation,
  useDailyLabourQuery,
  useUpdateDailyLabourMutation,
} from "../api"
import { getDailyLabour } from "../api/daily-labour.api"
import {
  dailyLabourCreateSchema,
  dailyLabourEditSchema,
  type DailyLabourCreateFormValues,
  type DailyLabourEditFormValues,
} from "../schema"

type SharedProps = {
  onClose: () => void
  onSaved: () => void
  onDeletedWhileEditing?: () => void
}

export default function DailyLabourFormModal({
  open,
  labourId,
  defaultVillaId,
  onClose,
  onSaved,
  onDeletedWhileEditing,
}: {
  open: boolean
  labourId?: string
  defaultVillaId?: string
  onClose: () => void
  onSaved: () => void
  onDeletedWhileEditing?: () => void
}) {
  if (!open) return null
  return (
    <Inner
      key={labourId ?? `new-${defaultVillaId ?? ""}`}
      labourId={labourId}
      defaultVillaId={defaultVillaId}
      onClose={onClose}
      onSaved={onSaved}
      onDeletedWhileEditing={onDeletedWhileEditing}
    />
  )
}

function Inner({
  labourId,
  defaultVillaId,
  onClose,
  onSaved,
  onDeletedWhileEditing,
}: {
  labourId?: string
  defaultVillaId?: string
} & SharedProps) {
  const { t } = useTranslation()
  const isEdit = !!labourId
  const {
    data: loaded,
    isError,
    error,
  } = useDailyLabourQuery(isEdit ? labourId : undefined)
  const create = useCreateDailyLabourMutation()
  const update = useUpdateDailyLabourMutation()
  const idempotency = useIdempotencyKey(true)
  const ifMatchRef = useRef<number | undefined>(undefined)
  const [conflictOpen, setConflictOpen] = useState(false)
  const { data: villaOptions } = useVillaOptionsQuery()

  const createForm = useForm<DailyLabourCreateFormValues>({
    resolver: zodResolver(
      dailyLabourCreateSchema,
    ) as Resolver<DailyLabourCreateFormValues>,
    defaultValues: {
      villaId: defaultVillaId ?? "",
      labourDate: "",
      contractorId: "",
      labourCount: 0,
      notes: "",
    },
  })

  const editForm = useForm<DailyLabourEditFormValues>({
    resolver: zodResolver(
      dailyLabourEditSchema,
    ) as Resolver<DailyLabourEditFormValues>,
    defaultValues: {
      labourDate: "",
      contractorId: "",
      labourCount: 0,
      notes: "",
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
      labourDate: loaded.labourDate,
      contractorId: loaded.contractor.id,
      labourCount: loaded.labourCount,
      notes: loaded.notes ?? "",
    })
  }, [loaded, isEdit, editForm])

  useEffect(() => {
    if (isEdit || !villaContractor) return
    createForm.setValue("contractorId", villaContractor.id)
  }, [isEdit, villaContractor, createForm])

  const mapPayload = (
    values: DailyLabourCreateFormValues | DailyLabourEditFormValues,
  ) => ({
    labourDate: values.labourDate!.trim(),
    contractorId: values.contractorId!.trim(),
    labourCount: values.labourCount!,
    notes:
      typeof values.notes === "string" && values.notes.trim() === ""
        ? null
        : (values.notes ?? null),
  })

  const handleApiError = (
    err: unknown,
    setError: typeof createForm.setError,
  ) => {
    const parsed = toApiError(err)
    if (parsed.code === "DAILY_LABOUR_NOT_FOUND" || parsed.status === 404) {
      onDeletedWhileEditing?.()
      onClose()
      return
    }
    if (parsed.code === "VERSION_CONFLICT") {
      setConflictOpen(true)
      return
    }
    if (parsed.code === "DAILY_LABOUR_EXISTS") {
      toast.error(t("dailyLabour.errors.exists"))
      return
    }
    if (parsed.code === "CONTRACTOR_NOT_ON_VILLA") {
      toast.error(t("dailyLabour.errors.contractorNotOnVilla"))
      return
    }
    if (parsed.code === "CONTRACTOR_INACTIVE") {
      toast.error(t("dailyLabour.errors.contractorInactive"))
      return
    }
    applyApiFieldErrors(parsed, setError)
    if (!parsed.details?.length) {
      toast.error(parsed.message)
    }
  }

  const onSubmitCreate = async (values: DailyLabourCreateFormValues) => {
    if (!values.contractorId?.trim()) {
      createForm.setError("contractorId", {
        message: "dailyLabour.errors.contractorRequired",
      })
      return
    }
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

  const onSubmitEdit = async (values: DailyLabourEditFormValues) => {
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
      <Modal open onClose={onClose} title={t("dailyLabour.editTitle")}>
        <p className="text-sm text-muted-foreground">{parsed.message}</p>
      </Modal>
    )
  }

  const contractorField = (
    control: import("react-hook-form").Control<DailyLabourEditFormValues>,
    name: "contractorId",
  ) => (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel>{t("dailyLabour.fieldContractor")}</FormLabel>
          {!villaContractor ? (
            <p className="text-sm text-muted-foreground">
              {t("dailyLabour.noVillaContractor")}
            </p>
          ) : (
            <p className="text-sm" dir="auto">
              {villaContractor.name}
            </p>
          )}
          <input type="hidden" {...field} value={field.value ?? ""} />
          <I18nFormError message={fieldState.error?.message} />
        </FormItem>
      )}
    />
  )

  const sharedFields = (
    control: import("react-hook-form").Control<DailyLabourEditFormValues>,
  ) => (
    <>
      <FormField
        control={control}
        name="labourDate"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("dailyLabour.fieldLabourDate")}</FormLabel>
            <FormControl>
              <Input type="date" {...field} value={field.value ?? ""} />
            </FormControl>
            <I18nFormError message={fieldState.error?.message} />
          </FormItem>
        )}
      />
      {contractorField(control, "contractorId")}
      <FormField
        control={control}
        name="labourCount"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("dailyLabour.fieldLabourCount")}</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <I18nFormError message={fieldState.error?.message} />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="notes"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("dailyLabour.fieldNotes")}</FormLabel>
            <FormControl>
              <Textarea rows={3} {...field} value={field.value ?? ""} />
            </FormControl>
            <I18nFormError message={fieldState.error?.message} />
          </FormItem>
        )}
      />
    </>
  )

  return (
    <>
      <Modal
        open
        onClose={busy ? () => {} : onClose}
        title={isEdit ? t("dailyLabour.editTitle") : t("dailyLabour.addTitle")}
        size="lg"
        footer={
          <>
            <Button type="button" disabled={busy} onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              form="daily-labour-form"
              variant="primary"
              disabled={busy || loading || (!isEdit && !villaContractor)}
            >
              {t("common.save")}
            </Button>
          </>
        }
      >
        {loading ? (
          <FormFieldsSkeleton fields={5} />
        ) : isEdit ? (
          <Form {...editForm}>
            <form
              id="daily-labour-form"
              className="space-y-4"
              onSubmit={editForm.handleSubmit(onSubmitEdit)}
            >
              {loaded && (
                <p className="text-sm text-muted-foreground">
                  {t("dailyLabour.editVillaLocked", {
                    villa: loaded.villa.villaNumber,
                  })}
                </p>
              )}
              {sharedFields(editForm.control)}
            </form>
          </Form>
        ) : (
          <Form {...createForm}>
            <form
              id="daily-labour-form"
              className="space-y-4"
              onSubmit={createForm.handleSubmit(onSubmitCreate)}
            >
              <FormField
                control={createForm.control}
                name="villaId"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t("dailyLabour.fieldVilla")}</FormLabel>
                    <FormControl>
                      <SearchSelect
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!!defaultVillaId}
                        options={(villaOptions ?? []).map((v) => ({
                          value: v.id,
                          label: v.villaNumber,
                        }))}
                        placeholder={t("dailyLabour.selectVilla")}
                      />
                    </FormControl>
                    <I18nFormError message={fieldState.error?.message} />
                  </FormItem>
                )}
              />
              {sharedFields(
                createForm.control as unknown as import("react-hook-form").Control<DailyLabourEditFormValues>,
              )}
            </form>
          </Form>
        )}
      </Modal>
      <VersionConflictDialog
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
        recordLabel={t("dailyLabour.entityName")}
        onReload={async () => {
          if (!labourId) return
          const fresh = await getDailyLabour(labourId)
          ifMatchRef.current = fresh.version
          editForm.reset({
            labourDate: fresh.labourDate,
            contractorId: fresh.contractor.id,
            labourCount: fresh.labourCount,
            notes: fresh.notes ?? "",
          })
          setConflictOpen(false)
        }}
        onApplyOnTop={() => void editForm.handleSubmit(onSubmitEdit)()}
      />
    </>
  )
}
