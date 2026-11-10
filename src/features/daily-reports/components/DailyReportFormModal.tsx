import { useEffect, useRef, useState } from "react"
import { SearchSelect } from "@/shared/ui/search-select"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import ContractorSelect from "@/features/contractors/components/ContractorSelect"
import { useContractorOptions } from "@/features/contractors/api"
import { useElectricalEngineerOptions } from "@/features/electrical-engineers/api"
import { applyApiFieldErrors } from "@/features/auth/api/formErrors"
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
  useCreateDailyReportMutation,
  useDailyReportQuery,
  useUpdateDailyReportMutation,
  WEATHERS,
} from "../api"
import { getDailyReport } from "../api/daily-reports.api"
import {
  dailyReportCreateSchema,
  dailyReportEditSchema,
  type DailyReportCreateFormValues,
  type DailyReportEditFormValues,
} from "../schema"

type SharedProps = {
  onClose: () => void
  onSaved: () => void
  onDeletedWhileEditing?: () => void
}

export default function DailyReportFormModal({
  open,
  reportId,
  defaultContractorId,
  onClose,
  onSaved,
  onDeletedWhileEditing,
}: {
  open: boolean
  reportId?: string
  defaultContractorId?: string
  onClose: () => void
  onSaved: () => void
  onDeletedWhileEditing?: () => void
}) {
  if (!open) return null
  return (
    <Inner
      key={reportId ?? `new-${defaultContractorId ?? ""}`}
      reportId={reportId}
      defaultContractorId={defaultContractorId}
      onClose={onClose}
      onSaved={onSaved}
      onDeletedWhileEditing={onDeletedWhileEditing}
    />
  )
}

function Inner({
  reportId,
  defaultContractorId,
  onClose,
  onSaved,
  onDeletedWhileEditing,
}: {
  reportId?: string
  defaultContractorId?: string
} & SharedProps) {
  const { t } = useTranslation()
  const isEdit = !!reportId
  const {
    data: loaded,
    isError,
    error,
  } = useDailyReportQuery(isEdit ? reportId : undefined)
  const create = useCreateDailyReportMutation()
  const update = useUpdateDailyReportMutation()
  const idempotency = useIdempotencyKey(true)
  const ifMatchRef = useRef<number | undefined>(undefined)
  const [conflictOpen, setConflictOpen] = useState(false)
  const contractorOptionsQuery = useContractorOptions()
  const engineerOptionsQuery = useElectricalEngineerOptions()
  const { data: engineerOptions } = engineerOptionsQuery
  const contractorOptionsForbidden =
    contractorOptionsQuery.isError &&
    toApiError(contractorOptionsQuery.error).status === 403
  const engineerOptionsForbidden =
    engineerOptionsQuery.isError &&
    toApiError(engineerOptionsQuery.error).status === 403
  const createBlockedByOptions =
    !isEdit && (contractorOptionsForbidden || engineerOptionsForbidden)

  const createForm = useForm<DailyReportCreateFormValues>({
    resolver: zodResolver(
      dailyReportCreateSchema,
    ) as Resolver<DailyReportCreateFormValues>,
    defaultValues: {
      contractorId: defaultContractorId ?? "",
      preparedByEngineerId: "",
      reportDate: "",
      weather: "SUNNY",
      workersCount: 0,
      notes: "",
    },
  })

  const editForm = useForm<DailyReportEditFormValues>({
    resolver: zodResolver(
      dailyReportEditSchema,
    ) as Resolver<DailyReportEditFormValues>,
    defaultValues: {
      contractorId: "",
      preparedByEngineerId: "",
      reportDate: "",
      weather: "SUNNY",
      workersCount: 0,
      notes: "",
    },
  })

  useEffect(() => {
    if (!loaded || !isEdit) return
    ifMatchRef.current = loaded.version
    editForm.reset({
      contractorId: loaded.contractor.id,
      preparedByEngineerId: loaded.preparedBy.id,
      reportDate: loaded.reportDate,
      weather: loaded.weather,
      workersCount: loaded.workersCount,
      notes: loaded.notes ?? "",
    })
  }, [loaded, isEdit, editForm])

  const mapPayload = (
    values: DailyReportCreateFormValues | DailyReportEditFormValues,
  ) => ({
    contractorId: values.contractorId!.trim(),
    preparedByEngineerId: values.preparedByEngineerId!.trim(),
    reportDate: values.reportDate!.trim(),
    weather: values.weather!,
    workersCount: values.workersCount!,
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
    if (parsed.code === "DAILY_REPORT_NOT_FOUND" || parsed.status === 404) {
      onDeletedWhileEditing?.()
      onClose()
      return
    }
    if (parsed.code === "VERSION_CONFLICT") {
      setConflictOpen(true)
      return
    }
    if (parsed.code === "DAILY_REPORT_EXISTS") {
      toast.error(t("dailyReports.errors.exists"))
      return
    }
    if (parsed.code === "CONTRACTOR_INACTIVE") {
      toast.error(t("dailyReports.errors.contractorInactive"))
      return
    }
    if (parsed.code === "ELECTRICAL_ENGINEER_INACTIVE") {
      toast.error(t("dailyReports.errors.engineerInactive"))
      return
    }
    applyApiFieldErrors(parsed, setError)
    if (!parsed.details?.length) {
      toast.error(parsed.message)
    }
  }

  const onSubmitCreate = async (values: DailyReportCreateFormValues) => {
    try {
      await create.mutateAsync({
        input: mapPayload(values),
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

  const onSubmitEdit = async (values: DailyReportEditFormValues) => {
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
      <Modal open onClose={onClose} title={t("dailyReports.editTitle")}>
        <p className="text-sm text-muted-foreground">{parsed.message}</p>
      </Modal>
    )
  }

  const sharedFields = (
    control: import("react-hook-form").Control<DailyReportEditFormValues>,
    showOptionsForbidden: boolean,
  ) => (
    <>
      <FormField
        control={control}
        name="contractorId"
        render={({ field, fieldState }) => (
          <FormItem>
            <ContractorSelect
              label={t("dailyReports.fieldContractor")}
              value={field.value ?? ""}
              onChange={field.onChange}
            />
            <I18nFormError message={fieldState.error?.message} />
          </FormItem>
        )}
      />
      {showOptionsForbidden && engineerOptionsForbidden && (
        <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {t("electricalEngineers.selectForbidden")}
        </p>
      )}
      <FormField
        control={control}
        name="preparedByEngineerId"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("dailyReports.fieldPreparedByEngineer")}</FormLabel>
            {engineerOptionsForbidden ? (
              <p className="text-sm text-muted-foreground">
                {t("electricalEngineers.selectForbidden")}
              </p>
            ) : (
              <FormControl>
                <SearchSelect
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={(engineerOptions ?? []).map((e) => ({
                    value: e.id,
                    label: e.name,
                  }))}
                  placeholder={t("dailyReports.selectPreparedByEngineer")}
                />
              </FormControl>
            )}
            <I18nFormError message={fieldState.error?.message} />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="reportDate"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("dailyReports.fieldReportDate")}</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <I18nFormError message={fieldState.error?.message} />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="weather"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("dailyReports.fieldWeather")}</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {WEATHERS.map((w) => (
                  <SelectItem key={w} value={w}>
                    {t(`dailyReports.weather.${w}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <I18nFormError message={fieldState.error?.message} />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="workersCount"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("dailyReports.fieldWorkersCount")}</FormLabel>
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
            <FormLabel>{t("dailyReports.fieldNotes")}</FormLabel>
            <FormControl>
              <Textarea rows={4} {...field} value={field.value ?? ""} />
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
        title={
          isEdit ? t("dailyReports.editTitle") : t("dailyReports.addTitle")
        }
        size="lg"
        footer={
          <>
            <Button type="button" disabled={busy} onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              form="daily-report-form"
              variant="primary"
              disabled={busy || loading || createBlockedByOptions}
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
              id="daily-report-form"
              className="space-y-4"
              onSubmit={editForm.handleSubmit(onSubmitEdit)}
            >
              {sharedFields(editForm.control, false)}
            </form>
          </Form>
        ) : (
          <Form {...createForm}>
            <form
              id="daily-report-form"
              className="space-y-4"
              onSubmit={createForm.handleSubmit(onSubmitCreate)}
            >
              {sharedFields(
                createForm.control as unknown as import("react-hook-form").Control<DailyReportEditFormValues>,
                true,
              )}
            </form>
          </Form>
        )}
      </Modal>
      <VersionConflictDialog
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
        recordLabel={t("dailyReports.entityName")}
        onReload={async () => {
          if (!reportId) return
          const fresh = await getDailyReport(reportId)
          ifMatchRef.current = fresh.version
          editForm.reset({
            contractorId: fresh.contractor.id,
            preparedByEngineerId: fresh.preparedBy.id,
            reportDate: fresh.reportDate,
            weather: fresh.weather,
            workersCount: fresh.workersCount,
            notes: fresh.notes ?? "",
          })
          setConflictOpen(false)
        }}
        onApplyOnTop={() => void editForm.handleSubmit(onSubmitEdit)()}
      />
    </>
  )
}
