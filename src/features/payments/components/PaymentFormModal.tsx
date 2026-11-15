import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import ContractorSelect from "@/features/contractors/components/ContractorSelect"
import { useVillaOptionsQuery } from "@/features/villas/api"
import {
  majorStringToMinorUnits,
  minorUnitsToMajorString,
} from "@/features/villas/api/budget"
import { toApiError } from "@/shared/api/errors"
import {
  fullWrite,
  idempotencyWrite,
  useIdempotencyKey,
} from "@/shared/api/write-safety"
import { toast } from "@/shared/lib/toast"
import Button from "@/shared/ui/Button"
import { FormField, Input, Select, Textarea } from "@/shared/ui/Field"
import Modal from "@/shared/ui/Modal"
import { SearchSelect } from "@/shared/ui/search-select"
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  type Payment,
  type PaymentInput,
  type PaymentMethod,
  type PaymentStatus,
  type PaymentUpdate,
} from "../api"

type Values = {
  contractorId: string
  villaId: string
  amount: string
  status: PaymentStatus
  dueDate: string
  paidDate: string
  method: PaymentMethod | ""
  reference: string
  notes: string
}

type Errors = Partial<Record<keyof Values, string>>

const MAX_AMOUNT_MINOR = 999_999_999_999

function valuesOf(item?: Payment): Values {
  if (!item) {
    return {
      contractorId: "",
      villaId: "",
      amount: "",
      status: "PENDING",
      dueDate: "",
      paidDate: "",
      method: "",
      reference: "",
      notes: "",
    }
  }
  return {
    contractorId: item.contractor.id,
    villaId: item.villa?.id ?? "",
    amount: minorUnitsToMajorString(item.amountMinor, "KWD"),
    status: item.status,
    dueDate: item.dueDate ?? "",
    paidDate: item.paidDate ?? "",
    method: item.method ?? "",
    reference: item.reference ?? "",
    notes: item.notes ?? "",
  }
}

// The checks the server makes, so a mistake is shown before anything is sent.
function check(values: Values): {
  errors: Errors
  amountMinor: number | null
} {
  const errors: Errors = {}
  if (!values.contractorId) errors.contractorId = "payments.errors.contractor"
  const amountMinor = majorStringToMinorUnits(values.amount, "KWD")
  if (amountMinor === null || amountMinor > MAX_AMOUNT_MINOR) {
    errors.amount = "payments.errors.amount"
  }
  if (values.reference.trim().length > 100) {
    errors.reference = "payments.errors.referenceLong"
  }
  if (values.notes.trim().length > 2000) {
    errors.notes = "payments.errors.notesLong"
  }
  return { errors, amountMinor }
}

/** Adds a payment to a contractor, or edits `item` when it is given. */
export default function PaymentFormModal({
  open,
  item,
  onClose,
}: {
  open: boolean
  item?: Payment
  onClose: () => void
}) {
  if (!open) return null
  return <Inner key={item?.id ?? "new"} item={item} onClose={onClose} />
}

type InnerProps = {
  item?: Payment
  onClose: () => void
}

function Inner({ item, onClose }: InnerProps) {
  const { t } = useTranslation()
  const villas = useVillaOptionsQuery()
  const create = useCreatePaymentMutation()
  const update = useUpdatePaymentMutation()
  const idempotency = useIdempotencyKey(true)
  const [values, setValues] = useState<Values>(() => valuesOf(item))
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const pending = create.isPending || update.isPending

  const set =
    <K extends keyof Values>(key: K) =>
    (value: Values[K]) => {
      setValues((v) => ({ ...v, [key]: value }))
      setErrors((e) => ({ ...e, [key]: undefined }))
    }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    const { errors: found, amountMinor } = check(values)
    setErrors(found)
    if (Object.keys(found).length > 0 || amountMinor === null) return
    const input: PaymentInput = {
      contractorId: values.contractorId,
      villaId: values.villaId || null,
      amountMinor,
      status: values.status,
      dueDate: values.dueDate || null,
      // Empty for a paid payment: the server puts today's date.
      paidDate: values.status === "PAID" ? values.paidDate || null : null,
      method: values.method || null,
      reference: values.reference.trim() || null,
      notes: values.notes.trim() || null,
    }
    try {
      if (item) {
        // Only what changed is sent.
        const before: PaymentInput = {
          contractorId: item.contractor.id,
          villaId: item.villa?.id ?? null,
          amountMinor: item.amountMinor,
          status: item.status,
          dueDate: item.dueDate,
          paidDate: item.paidDate,
          method: item.method,
          reference: item.reference,
          notes: item.notes,
        }
        const patch: PaymentUpdate = {}
        for (const key of Object.keys(input) as Array<keyof PaymentInput>) {
          if (input[key] !== before[key]) {
            ;(patch as Record<string, unknown>)[key] = input[key]
          }
        }
        if (Object.keys(patch).length > 0) {
          await update.mutateAsync({
            id: item.id,
            input: patch,
            write: fullWrite(idempotency.getKey(), item.version),
          })
        }
      } else {
        await create.mutateAsync({
          input,
          write: idempotencyWrite(idempotency.getKey()),
        })
        toast.success(t("payments.added"))
      }
      idempotency.resetKey()
      onClose()
    } catch (err) {
      idempotency.markRejected()
      setFormError(toApiError(err).message)
    }
  }

  const villaOptions = (villas.data ?? []).map((v) => ({
    value: v.id,
    label: v.villaNumber,
  }))

  return (
    <Modal
      open
      onClose={pending ? () => {} : onClose}
      title={item ? t("payments.editTitle") : t("payments.addTitle")}
      footer={
        <>
          <Button type="button" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="payment-form"
            variant="primary"
            disabled={pending}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="payment-form" className="grid gap-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <ContractorSelect
              label={t("payments.contractor")}
              value={values.contractorId}
              onChange={set("contractorId")}
            />
            {errors.contractorId && (
              <p className="mt-1 text-xs text-danger">
                {t(errors.contractorId)}
              </p>
            )}
          </div>
          <FormField
            label={t("payments.villaOptional")}
            htmlFor="payment-villa"
          >
            <SearchSelect
              id="payment-villa"
              value={values.villaId}
              onChange={set("villaId")}
              options={villaOptions}
              loading={villas.isLoading}
              clearable
              placeholder={t("payments.pickVilla")}
            />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label={t("payments.amountKwd")}
            inputMode="decimal"
            value={values.amount}
            onChange={(e) => set("amount")(e.target.value)}
            error={errors.amount}
            placeholder="0.000"
            dir="ltr"
          />
          <Select
            label={t("payments.status")}
            value={values.status}
            onChange={(e) => set("status")(e.target.value as PaymentStatus)}
            options={PAYMENT_STATUSES.map((status) => ({
              value: status,
              label: t(`payments.statuses.${status}`),
            }))}
          />
          <Select
            label={t("payments.method")}
            value={values.method}
            onChange={(e) =>
              set("method")(e.target.value as PaymentMethod | "")
            }
            placeholder={t("payments.noMethod")}
            options={PAYMENT_METHODS.map((method) => ({
              value: method,
              label: t(`payments.methods.${method}`),
            }))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label={t("payments.dueDate")}
            type="date"
            value={values.dueDate}
            onChange={(e) => set("dueDate")(e.target.value)}
          />
          {values.status === "PAID" && (
            <Input
              label={t("payments.paidDate")}
              type="date"
              value={values.paidDate}
              onChange={(e) => set("paidDate")(e.target.value)}
              placeholder={t("payments.paidDateHint")}
            />
          )}
          <Input
            label={t("payments.reference")}
            value={values.reference}
            onChange={(e) => set("reference")(e.target.value)}
            error={errors.reference}
            maxLength={100}
            dir="auto"
          />
        </div>
        <Textarea
          label={t("payments.notes")}
          value={values.notes}
          onChange={(e) => set("notes")(e.target.value)}
          error={errors.notes}
          maxLength={2000}
          rows={3}
          dir="auto"
        />
        {formError && (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        )}
      </form>
    </Modal>
  )
}
