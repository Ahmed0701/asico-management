import { useEffect, useRef, useState } from "react"
import { SearchSelect } from "@/shared/ui/search-select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import ContractorSelect from "@/features/contractors/components/ContractorSelect"
import { useContractorOptions } from "@/features/contractors/api"
import { applyApiFieldErrors } from "@/features/auth/api/formErrors"
import { useVillaOptionsQuery } from "@/features/villas/api"
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
  useCreateSmallWorkMutation,
  useSmallWorkQuery,
  useUpdateSmallWorkMutation,
  SMALL_WORK_STATUSES,
} from "../api"
import { getSmallWork } from "../api/small-works.api"
import {
  smallWorkCreateSchema,
  smallWorkEditSchema,
  type SmallWorkCreateFormValues,
  type SmallWorkEditFormValues,
} from "../schema"

type SharedProps = {
  onClose: () => void
  onSaved: () => void
  onDeletedWhileEditing?: () => void
}

export default function SmallWorkFormModal({
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
  } = useSmallWorkQuery(isEdit ? workId : undefined)
  const create = useCreateSmallWorkMutation()
  const update = useUpdateSmallWorkMutation()
  const idempotency = useIdempotencyKey(true)
  const ifMatchRef = useRef<number | undefined>(undefined)
  const [conflictOpen, setConflictOpen] = useState(false)
  const { data: villaOptions } = useVillaOptionsQuery()
  const contractorOptionsQuery = useContractorOptions()
  const contractorOptionsForbidden =
    contractorOptionsQuery.isError &&
    toApiError(contractorOptionsQuery.error).status === 403
  const createBlockedByContractorOptions = !isEdit && contractorOptionsForbidden

  const createForm = useForm<SmallWorkCreateFormValues>({
    resolver: zodResolver(smallWorkCreateSchema),
    defaultValues: {
      villaId: defaultVillaId ?? "",
      contractorId: "",
      startDate: "",
      endDate: "",
      description: "",
      status: "PENDING",
    },
  })

  const editForm = useForm<SmallWorkEditFormValues>({
    resolver: zodResolver(smallWorkEditSchema),
    defaultValues: {
      contractorId: "",
      startDate: "",
      endDate: "",
      description: "",
      status: "PENDING",
    },
  })

  useEffect(() => {
    if (!loaded || !isEdit) return
    ifMatchRef.current = loaded.version
    editForm.reset({
      contractorId: loaded.contractor.id,
      startDate: loaded.startDate,
      endDate: loaded.endDate,
      description: loaded.description,
      status: loaded.status,
    })
  }, [loaded, isEdit, editForm])

  const mapPayload = (
    values: SmallWorkCreateFormValues | SmallWorkEditFormValues,
  ) => ({
    contractorId: values.contractorId!.trim(),
    startDate: values.startDate!.trim(),
    endDate: values.endDate!.trim(),
    description: values.description!.trim(),
    status: values.status ?? "PENDING",
  })

  const handleApiError = (
    err: unknown,
    setError: typeof createForm.setError,
  ) => {
    const parsed = toApiError(err)
    if (parsed.code === "SMALL_WORK_NOT_FOUND" || parsed.status === 404) {
      onDeletedWhileEditing?.()
      onClose()
      return
    }
    if (parsed.code === "VERSION_CONFLICT") {
      setConflictOpen(true)
      return
    }
    if (parsed.code === "SMALL_WORK_DATE_RANGE_INVALID") {
      setError("endDate", { message: "smallWorks.errors.dateRange" })
      return
    }
    if (parsed.code === "CONTRACTOR_NOT_FOUND") {
      setError("contractorId", {
        message: "smallWorks.errors.contractorNotFound",
      })
      return
    }
    if (parsed.code === "CONTRACTOR_INACTIVE") {
      setError("contractorId", {
        message: "smallWorks.errors.contractorInactive",
      })
      return
    }
    applyApiFieldErrors(parsed, setError)
    if (!parsed.details?.length) {
      toast.error(parsed.message)
    }
  }

  const onSubmitCreate = async (values: SmallWorkCreateFormValues) => {
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

  const onSubmitEdit = async (values: SmallWorkEditFormValues) => {
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
      <Modal open onClose={onClose} title={t("smallWorks.editTitle")}>
        <p className="text-sm text-muted-foreground">{parsed.message}</p>
      </Modal>
    )
  }

  const sharedFields = (
    control: import("react-hook-form").Control<SmallWorkEditFormValues>,
    includeContractor: boolean,
  ) => (
    <>
      {includeContractor && (
        <FormField
          control={control}
          name="contractorId"
          render={({ field, fieldState }) => (
            <FormItem>
              <ContractorSelect
                label={t("smallWorks.fieldContractor")}
                value={field.value ?? ""}
                onChange={field.onChange}
              />
              <I18nFormError message={fieldState.error?.message} />
            </FormItem>
          )}
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
        <FormField
          control={control}
          name="startDate"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t("smallWorks.fieldStartDate")}</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value ?? ""} />
              </FormControl>
              <I18nFormError message={fieldState.error?.message} />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="endDate"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t("smallWorks.fieldEndDate")}</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value ?? ""} />
              </FormControl>
              <I18nFormError message={fieldState.error?.message} />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name="description"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("smallWorks.fieldDescription")}</FormLabel>
            <FormControl>
              <Textarea rows={3} {...field} />
            </FormControl>
            <I18nFormError message={fieldState.error?.message} />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="status"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("smallWorks.fieldStatus")}</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {SMALL_WORK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`smallWorks.status.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        title={isEdit ? t("smallWorks.editTitle") : t("smallWorks.addTitle")}
        size="lg"
        footer={
          <>
            <Button type="button" disabled={busy} onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              form="small-work-form"
              variant="primary"
              disabled={busy || loading || createBlockedByContractorOptions}
            >
              {t("common.save")}
            </Button>
          </>
        }
      >
        {loading ? (
          <FormFieldsSkeleton fields={7} />
        ) : isEdit ? (
          <Form {...editForm}>
            <form
              id="small-work-form"
              className="space-y-4"
              onSubmit={editForm.handleSubmit(onSubmitEdit)}
            >
              {loaded && (
                <p className="text-sm text-muted-foreground">
                  {t("smallWorks.editVillaLocked", {
                    villaNumber: loaded.villa.villaNumber,
                  })}
                </p>
              )}
              {sharedFields(editForm.control, true)}
            </form>
          </Form>
        ) : (
          <Form {...createForm}>
            <form
              id="small-work-form"
              className="space-y-4"
              onSubmit={createForm.handleSubmit(onSubmitCreate)}
            >
              <FormField
                control={createForm.control}
                name="villaId"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t("smallWorks.fieldVilla")}</FormLabel>
                    <FormControl>
                      <SearchSelect
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!!defaultVillaId}
                        options={(villaOptions ?? []).map((v) => ({
                          value: v.id,
                          label: v.villaNumber,
                        }))}
                        placeholder={t("smallWorks.selectVilla")}
                      />
                    </FormControl>
                    <I18nFormError message={fieldState.error?.message} />
                  </FormItem>
                )}
              />
              {sharedFields(
                createForm.control as unknown as import("react-hook-form").Control<SmallWorkEditFormValues>,
                true,
              )}
            </form>
          </Form>
        )}
      </Modal>
      <VersionConflictDialog
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
        recordLabel={t("smallWorks.entityName")}
        onReload={async () => {
          if (!workId) return
          const fresh = await getSmallWork(workId)
          ifMatchRef.current = fresh.version
          editForm.reset({
            contractorId: fresh.contractor.id,
            startDate: fresh.startDate,
            endDate: fresh.endDate,
            description: fresh.description,
            status: fresh.status,
          })
          setConflictOpen(false)
        }}
        onApplyOnTop={() => void editForm.handleSubmit(onSubmitEdit)()}
      />
    </>
  )
}
