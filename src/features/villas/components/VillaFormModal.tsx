import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { applyApiFieldErrors } from "@/features/auth/api/formErrors"
import CivilEngineerSelect from "@/features/engineers/components/CivilEngineerSelect"
import ContractorSelect from "@/features/contractors/components/ContractorSelect"
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
import { Input } from "@/shared/ui/input"
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
import { toast } from "@/shared/lib/toast"
import {
  getVilla,
  majorStringToMinorUnits,
  minorUnitsToMajorString,
  useCreateVillaMutation,
  useUpdateVillaMutation,
  useVillaOptionsQuery,
  useVillaQuery,
  VILLA_TYPES,
  type CreateVillaInput,
  type UpdateVillaInput,
  type VillaType,
} from "../api"
import { villaFormSchema, type VillaFormValues } from "../schema"
import VillaAreaSelect from "./VillaAreaSelect"
import ElectricalEngineerOptionalSelect from "./ElectricalEngineerOptionalSelect"

const emptyValues: VillaFormValues = {
  villaNumber: "",
  ownerName: "",
  villaType: "",
  areaId: "",
  block: "",
  plot: "",
  civilEngineerId: "",
  electricalEngineerId: "",
  contractorId: "",
  startDate: "",
  targetDate: "",
  budgetMajor: "",
  currency: "KWD",
}

function detailToValues(
  villa: Awaited<ReturnType<typeof getVilla>>,
): VillaFormValues {
  return {
    villaNumber: villa.villaNumber,
    ownerName: villa.ownerName ?? "",
    villaType: villa.villaType ?? "",
    areaId: villa.areaId,
    block: villa.block,
    plot: villa.plot,
    civilEngineerId: villa.civilEngineer.id,
    electricalEngineerId: villa.electricalEngineer?.id ?? "",
    contractorId: villa.contractor?.id ?? "",
    startDate: villa.startDate ?? "",
    targetDate: villa.targetDate ?? "",
    budgetMajor:
      villa.budgetMinor != null && villa.currency
        ? minorUnitsToMajorString(villa.budgetMinor, villa.currency)
        : "",
    currency: villa.currency ?? "KWD",
  }
}

function toVillaType(value: string): VillaType | null {
  return (VILLA_TYPES as readonly string[]).includes(value)
    ? value as VillaType
    : null
}

function toCreateInput(values: VillaFormValues): CreateVillaInput {
  const owner = values.ownerName?.trim()
  const cur = values.currency.trim().toUpperCase()
  const budgetMinor = majorStringToMinorUnits(values.budgetMajor, cur)
  const base: CreateVillaInput = {
    villaNumber: values.villaNumber.trim(),
    ownerName: owner ? owner : null,
    villaType: toVillaType(values.villaType),
    areaId: values.areaId,
    block: values.block.trim(),
    plot: values.plot.trim(),
    civilEngineerId: values.civilEngineerId,
    electricalEngineerId: values.electricalEngineerId.trim() || null,
    contractorId: values.contractorId.trim() || null,
    startDate: values.startDate.trim() || null,
    targetDate: values.targetDate.trim() || null,
  }
  if (budgetMinor !== null) {
    base.budgetMinor = budgetMinor
    base.currency = cur
  }
  return base
}

function toUpdateInput(
  values: VillaFormValues,
  baseline: VillaFormValues,
): UpdateVillaInput {
  const patch: UpdateVillaInput = {}
  const owner = values.ownerName?.trim()
  const baselineOwner = baseline.ownerName?.trim()
  if (values.villaNumber.trim() !== baseline.villaNumber.trim()) {
    patch.villaNumber = values.villaNumber.trim()
  }
  if (owner !== baselineOwner) patch.ownerName = owner ? owner : null
  if (values.villaType !== baseline.villaType) {
    patch.villaType = toVillaType(values.villaType)
  }
  if (values.areaId !== baseline.areaId) patch.areaId = values.areaId
  if (values.block.trim() !== baseline.block.trim())
    patch.block = values.block.trim()
  if (values.plot.trim() !== baseline.plot.trim())
    patch.plot = values.plot.trim()
  if (values.civilEngineerId !== baseline.civilEngineerId) {
    patch.civilEngineerId = values.civilEngineerId
  }
  const elec = values.electricalEngineerId.trim() || null
  const baseElec = baseline.electricalEngineerId.trim() || null
  if (elec !== baseElec) patch.electricalEngineerId = elec
  const con = values.contractorId.trim() || null
  const baseCon = baseline.contractorId.trim() || null
  if (con !== baseCon) patch.contractorId = con
  const start = values.startDate.trim() || null
  const baseStart = baseline.startDate.trim() || null
  if (start !== baseStart) patch.startDate = start
  const target = values.targetDate.trim() || null
  const baseTarget = baseline.targetDate.trim() || null
  if (target !== baseTarget) patch.targetDate = target

  const cur = values.currency.trim().toUpperCase()
  const baseCurNorm = baseline.currency.trim().toUpperCase()
  const budgetMinor = majorStringToMinorUnits(values.budgetMajor, cur)
  const baseBudget = majorStringToMinorUnits(baseline.budgetMajor, baseCurNorm)
  const baseCur = baseline.currency.trim().toUpperCase()
  if (budgetMinor !== baseBudget) patch.budgetMinor = budgetMinor
  if (budgetMinor !== null && cur !== baseCur) patch.currency = cur

  return patch
}

export default function VillaFormModal({
  open,
  villaId,
  onClose,
  onSaved,
  onDeletedWhileEditing,
}: {
  open: boolean
  villaId?: string
  onClose: () => void
  onSaved: () => void
  onDeletedWhileEditing: () => void
}) {
  if (!open) return null
  return (
    <Inner
      key={villaId ?? "new"}
      villaId={villaId}
      onClose={onClose}
      onSaved={onSaved}
      onDeletedWhileEditing={onDeletedWhileEditing}
    />
  )
}

function Inner({
  villaId,
  onClose,
  onSaved,
  onDeletedWhileEditing,
}: {
  villaId?: string
  onClose: () => void
  onSaved: () => void
  onDeletedWhileEditing: () => void
}) {
  const { t } = useTranslation()
  const isEdit = !!villaId
  const {
    data: loaded,
    isError,
    error,
  } = useVillaQuery(isEdit ? villaId : undefined)
  const create = useCreateVillaMutation()
  const update = useUpdateVillaMutation()
  const idempotency = useIdempotencyKey(true)
  const ifMatchRef = useRef<number | undefined>(undefined)
  const [conflictOpen, setConflictOpen] = useState(false)
  const pendingResubmitRef = useRef<(() => Promise<void>) | null>(null)
  const [apiError, setApiError] =
    useState<ReturnType<typeof toApiError> | null>(null)
  const baseline = useRef<VillaFormValues | null>(null)

  useEffect(() => {
    if (loaded) ifMatchRef.current = loaded.version
  }, [loaded?.id, loaded?.version, loaded])

  const form = useForm<VillaFormValues>({
    resolver: zodResolver(villaFormSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (isEdit && loaded) {
      const values = detailToValues(loaded)
      form.reset(values)
      baseline.current = values
    }
    if (!isEdit) {
      form.reset(emptyValues)
      baseline.current = null
    }
  }, [isEdit, loaded, form])

  useEffect(() => {
    if (isEdit && isError) {
      const parsed = toApiError(error)
      if (parsed.code === "VILLA_NOT_FOUND" || parsed.status === 404) {
        onDeletedWhileEditing()
        onClose()
      }
    }
  }, [isEdit, isError, error, onClose, onDeletedWhileEditing])

  // Every villa number, to stop a second villa with the same one before it is sent.
  const { data: villaOptions } = useVillaOptionsQuery()

  // A villa number must be unique: the field says so, and an alert pops up.
  const showNumberTaken = () => {
    const message = t("villas.errors.numberTaken")
    form.setError("villaNumber", { message })
    toast.error(message)
  }

  const submit = form.handleSubmit(async (values) => {
    setApiError(null)
    const number = values.villaNumber.trim().toLowerCase()
    const taken = (villaOptions ?? []).some(
      (option) =>
        option.id !== villaId &&
        option.villaNumber.trim().toLowerCase() === number,
    )
    if (taken) {
      showNumberTaken()
      return
    }
    const run = async () => {
      if (isEdit && villaId && baseline.current) {
        const input = toUpdateInput(values, baseline.current)
        if (Object.keys(input).length === 0) {
          onClose()
          return
        }
        await update.mutateAsync({
          id: villaId,
          input,
          write: fullWrite(idempotency.getKey(), ifMatchRef.current),
        })
      } else {
        await create.mutateAsync({
          input: toCreateInput(values),
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
      if (parsed.code === "VERSION_CONFLICT" && villaId) {
        const fresh = await getVilla(villaId)
        ifMatchRef.current = fresh.version
        setConflictOpen(true)
        return
      }
      if (parsed.code === "VILLA_NUMBER_TAKEN") {
        showNumberTaken()
        idempotency.markRejected()
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
        title={isEdit ? t("villas.editTitle") : t("villas.newTitle")}
        footer={
          <>
            <Button type="button" autoFocus onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              form="villa-form"
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
          </div>
        )}
        {loadingEdit ? (
          <FormFieldsSkeleton fields={8} />
        ) : (
          <Form {...form}>
            <form id="villa-form" onSubmit={submit} className="space-y-4">
              <p className="text-xs font-medium text-muted-foreground">
                {t("villas.form.basics")}
              </p>
              <FormTextField
                control={form.control}
                name="villaNumber"
                label={t("villas.villaNumber")}
              />
              <FormTextField
                control={form.control}
                name="ownerName"
                label={t("villas.owner")}
              />
              <FormField
                control={form.control}
                name="villaType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("villas.villaType")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue
                            placeholder={t("villas.villaTypePlaceholder")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VILLA_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`villas.villaTypes.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-500 text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="areaId"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <VillaAreaSelect
                      label={t("villas.area")}
                      value={field.value}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                    <FormMessage className="text-red-500 text-[10px]" />
                  </FormItem>
                )}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <FormTextField
                  control={form.control}
                  name="block"
                  label={t("villas.block")}
                />
                <FormTextField
                  control={form.control}
                  name="plot"
                  label={t("villas.plot")}
                />
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {t("villas.form.assignment")}
              </p>
              <FormField
                control={form.control}
                name="electricalEngineerId"
                render={({ field }) => (
                  <FormItem>
                    <ElectricalEngineerOptionalSelect
                      label={t("villas.electricalEngineer")}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="civilEngineerId"
                render={({ field }) => (
                  <FormItem>
                    <CivilEngineerSelect
                      label={t("villas.civilEngineer")}
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage className="text-red-500 text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contractorId"
                render={({ field }) => (
                  <FormItem>
                    <ContractorSelect
                      label={t("villas.contractor")}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormItem>
                )}
              />
              <p className="text-xs font-medium text-muted-foreground">
                {t("villas.form.schedule")}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("villas.startDate")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage className="text-red-500 text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("villas.targetDate")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage className="text-red-500 text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-2">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormTextField
                    control={form.control}
                    name="budgetMajor"
                    label={t("villas.budgetMajor")}
                    placeholder={t("villas.budgetMajorPlaceholder")}
                    inputMode="decimal"
                    dir="ltr"
                  />
                  <FormTextField
                    control={form.control}
                    name="currency"
                    label={t("villas.currency")}
                    maxLength={3}
                    dir="ltr"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("villas.budgetMajorHint")}
                </p>
              </div>
            </form>
          </Form>
        )}
      </Modal>
      <VersionConflictDialog
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
        recordLabel={loaded?.villaNumber ?? ""}
        onReload={() => {
          if (!villaId) return
          void getVilla(villaId).then((fresh) => {
            const values = detailToValues(fresh)
            form.reset(values)
            baseline.current = values
            ifMatchRef.current = fresh.version
            idempotency.resetKey()
            setConflictOpen(false)
          })
        }}
        onApplyOnTop={async () => {
          setConflictOpen(false)
          await pendingResubmitRef.current?.()
        }}
        applyPending={update.isPending}
      />
    </>
  )
}
