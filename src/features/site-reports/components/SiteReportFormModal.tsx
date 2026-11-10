import { useEffect, useRef, useState } from "react"
import { SearchSelect } from "@/shared/ui/search-select"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
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
  MAX_RATING,
  MIN_RATING,
  SITE_REPORT_TYPES,
  useCreateSiteReportMutation,
  useSiteReportQuery,
  useUpdateSiteReportMutation,
} from "../api"
import { getSiteReport } from "../api/site-reports.api"
import {
  siteReportCreateSchema,
  siteReportEditSchema,
  type SiteReportCreateFormValues,
  type SiteReportEditFormValues,
} from "../schema"
import StarRatingInput from "./StarRatingInput"

type SharedProps = {
  onClose: () => void
  onSaved: () => void
  onDeletedWhileEditing?: () => void
}

export default function SiteReportFormModal({
  open,
  reportId,
  defaultVillaId,
  onClose,
  onSaved,
  onDeletedWhileEditing,
}: {
  open: boolean
  reportId?: string
  defaultVillaId?: string
  onClose: () => void
  onSaved: () => void
  onDeletedWhileEditing?: () => void
}) {
  if (!open) return null
  return (
    <Inner
      key={reportId ?? `new-${defaultVillaId ?? ""}`}
      reportId={reportId}
      defaultVillaId={defaultVillaId}
      onClose={onClose}
      onSaved={onSaved}
      onDeletedWhileEditing={onDeletedWhileEditing}
    />
  )
}

function Inner({
  reportId,
  defaultVillaId,
  onClose,
  onSaved,
  onDeletedWhileEditing,
}: {
  reportId?: string
  defaultVillaId?: string
} & SharedProps) {
  const { t } = useTranslation()
  const isEdit = !!reportId
  const {
    data: loaded,
    isError,
    error,
  } = useSiteReportQuery(isEdit ? reportId : undefined)
  const create = useCreateSiteReportMutation()
  const update = useUpdateSiteReportMutation()
  const idempotency = useIdempotencyKey(true)
  const ifMatchRef = useRef<number | undefined>(undefined)
  const [conflictOpen, setConflictOpen] = useState(false)
  const { data: villaOptions } = useVillaOptionsQuery()

  const createForm = useForm<SiteReportCreateFormValues>({
    resolver: zodResolver(
      siteReportCreateSchema,
    ) as Resolver<SiteReportCreateFormValues>,
    defaultValues: {
      villaId: defaultVillaId ?? "",
      title: "",
      visitDate: "",
      inspector: "",
      type: "INSPECTION",
      rating: 3,
      findings: "",
      recommendations: "",
    },
  })

  const editForm = useForm<SiteReportEditFormValues>({
    resolver: zodResolver(
      siteReportEditSchema,
    ) as Resolver<SiteReportEditFormValues>,
    defaultValues: {
      title: "",
      visitDate: "",
      inspector: "",
      type: "INSPECTION",
      rating: 3,
      findings: "",
      recommendations: "",
    },
  })

  useEffect(() => {
    if (!loaded || !isEdit) return
    ifMatchRef.current = loaded.version
    editForm.reset({
      title: loaded.title,
      visitDate: loaded.visitDate,
      inspector: loaded.inspector,
      type: loaded.type,
      rating: loaded.rating,
      findings: loaded.findings,
      recommendations: loaded.recommendations ?? "",
    })
  }, [loaded, isEdit, editForm])

  const mapPayload = (
    values: SiteReportCreateFormValues | SiteReportEditFormValues,
  ) => ({
    title: values.title!.trim(),
    visitDate: values.visitDate!.trim(),
    inspector: values.inspector!.trim(),
    type: values.type!,
    rating: values.rating!,
    findings: values.findings!.trim(),
    recommendations:
      typeof values.recommendations === "string" &&
      values.recommendations.trim() === ""
        ? null
        : (values.recommendations ?? null),
  })

  const handleApiError = (
    err: unknown,
    setError: typeof createForm.setError,
  ) => {
    const parsed = toApiError(err)
    if (parsed.code === "SITE_REPORT_NOT_FOUND" || parsed.status === 404) {
      onDeletedWhileEditing?.()
      onClose()
      return
    }
    if (parsed.code === "VERSION_CONFLICT") {
      setConflictOpen(true)
      return
    }
    applyApiFieldErrors(parsed, setError)
    if (!parsed.details?.length) {
      toast.error(parsed.message)
    }
  }

  const onSubmitCreate = async (values: SiteReportCreateFormValues) => {
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

  const onSubmitEdit = async (values: SiteReportEditFormValues) => {
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
      <Modal open onClose={onClose} title={t("siteReports.editTitle")}>
        <p className="text-sm text-muted-foreground">{parsed.message}</p>
      </Modal>
    )
  }

  const sharedFields = (
    control: import("react-hook-form").Control<SiteReportEditFormValues>,
  ) => (
    <>
      <FormField
        control={control}
        name="title"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("siteReports.fieldTitle")}</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ""} />
            </FormControl>
            <I18nFormError message={fieldState.error?.message} />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="visitDate"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("siteReports.fieldVisitDate")}</FormLabel>
            <FormControl>
              <Input type="date" {...field} value={field.value ?? ""} />
            </FormControl>
            <I18nFormError message={fieldState.error?.message} />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="inspector"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("siteReports.fieldInspector")}</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ""} />
            </FormControl>
            <I18nFormError message={fieldState.error?.message} />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="type"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("siteReports.fieldType")}</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {SITE_REPORT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`siteReports.type.${type}`)}
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
        name="rating"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{t("siteReports.fieldRating")}</FormLabel>
            <FormControl>
              <StarRatingInput
                value={field.value ?? MIN_RATING}
                onChange={field.onChange}
                disabled={field.disabled}
              />
            </FormControl>
            <I18nFormError message={fieldState.error?.message} />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="findings"
        render={({ field, fieldState }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>{t("siteReports.fieldFindings")}</FormLabel>
            <FormControl>
              <Textarea rows={4} {...field} value={field.value ?? ""} />
            </FormControl>
            <I18nFormError message={fieldState.error?.message} />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="recommendations"
        render={({ field, fieldState }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>{t("siteReports.fieldRecommendations")}</FormLabel>
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
        title={isEdit ? t("siteReports.editTitle") : t("siteReports.addTitle")}
        size="lg"
        footer={
          <>
            <Button type="button" disabled={busy} onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              form="site-report-form"
              variant="primary"
              disabled={busy || loading}
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
              id="site-report-form"
              className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start"
              onSubmit={editForm.handleSubmit(onSubmitEdit)}
            >
              {loaded && (
                <p className="text-sm text-muted-foreground md:col-span-2">
                  {t("siteReports.editVillaLocked", {
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
              id="site-report-form"
              className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start"
              onSubmit={createForm.handleSubmit(onSubmitCreate)}
            >
              <FormField
                control={createForm.control}
                name="villaId"
                render={({ field, fieldState }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>{t("siteReports.fieldVilla")}</FormLabel>
                    <FormControl>
                      <SearchSelect
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!!defaultVillaId}
                        options={(villaOptions ?? []).map((v) => ({
                          value: v.id,
                          label: v.villaNumber,
                        }))}
                        placeholder={t("siteReports.selectVilla")}
                      />
                    </FormControl>
                    <I18nFormError message={fieldState.error?.message} />
                  </FormItem>
                )}
              />
              {sharedFields(
                createForm.control as unknown as import("react-hook-form").Control<SiteReportEditFormValues>,
              )}
            </form>
          </Form>
        )}
      </Modal>
      <VersionConflictDialog
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
        recordLabel={t("siteReports.entityName")}
        onReload={async () => {
          if (!reportId) return
          const fresh = await getSiteReport(reportId)
          ifMatchRef.current = fresh.version
          editForm.reset({
            title: fresh.title,
            visitDate: fresh.visitDate,
            inspector: fresh.inspector,
            type: fresh.type,
            rating: fresh.rating,
            findings: fresh.findings,
            recommendations: fresh.recommendations ?? "",
          })
          setConflictOpen(false)
        }}
        onApplyOnTop={() => void editForm.handleSubmit(onSubmitEdit)()}
      />
    </>
  )
}
