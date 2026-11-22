import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
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
import { Input, Select, Textarea } from "@/shared/ui/Field"
import Modal from "@/shared/ui/Modal"
import {
  VARIATION_ORDER_STATUSES,
  useCreateVariationOrderMutation,
  useUpdateVariationOrderMutation,
  type VariationOrder,
  type VariationOrderInput,
  type VariationOrderStatus,
  type VariationOrderUpdate,
} from "../api"

type Values = {
  voNumber: string
  amount: string
  dateAdded: string
  status: VariationOrderStatus
  notes: string
}

type Errors = Partial<Record<keyof Values, string>>

type Checked = {
  errors: Errors
  amountMinor: number | null
}

const MAX_AMOUNT_MINOR = 999_999_999_999

// Today on this computer, YYYY-MM-DD.
function today(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function valuesOf(item?: VariationOrder): Values {
  if (!item) {
    return {
      voNumber: "",
      amount: "",
      dateAdded: today(),
      status: "PENDING",
      notes: "",
    }
  }
  return {
    voNumber: item.voNumber,
    amount: minorUnitsToMajorString(item.amountMinor, "KWD"),
    dateAdded: item.dateAdded,
    status: item.status,
    notes: item.notes ?? "",
  }
}

// The checks the server makes, so a mistake is shown before anything is sent.
function check(values: Values): Checked {
  const errors: Errors = {}
  const voNumber = values.voNumber.trim()
  if (!voNumber) errors.voNumber = "variationOrders.errors.voNumber"
  else if (voNumber.length > 50)
    errors.voNumber = "variationOrders.errors.voNumberLong"
  const amountMinor = majorStringToMinorUnits(values.amount, "KWD")
  if (amountMinor === null || amountMinor > MAX_AMOUNT_MINOR) {
    errors.amount = "variationOrders.errors.amount"
  }
  if (!values.dateAdded) errors.dateAdded = "variationOrders.errors.date"
  if (values.notes.trim().length > 2000) {
    errors.notes = "variationOrders.errors.notesLong"
  }
  return { errors, amountMinor }
}

type Props = {
  open: boolean
  villaId: string
  item?: VariationOrder
  /** Choosing Pending or Paid; without it (an electrical engineer) a new order is pending. Defaults to true. */
  canSetStatus?: boolean
  /** Called with a new order once it is added, e.g. to attach its PDF next. */
  onCreated?: (item: VariationOrder) => void
  onClose: () => void
}

/** Adds a variation order to the villa, or edits `item` when it is given. */
export default function VariationOrderFormModal({
  open,
  villaId,
  item,
  canSetStatus = true,
  onCreated,
  onClose,
}: Props) {
  if (!open) return null
  return (
    <Inner
      key={item?.id ?? "new"}
      villaId={villaId}
      item={item}
      canSetStatus={canSetStatus}
      onCreated={onCreated}
      onClose={onClose}
    />
  )
}

type InnerProps = {
  villaId: string
  item?: VariationOrder
  canSetStatus: boolean
  onCreated?: (item: VariationOrder) => void
  onClose: () => void
}

function Inner({
  villaId,
  item,
  canSetStatus,
  onCreated,
  onClose,
}: InnerProps) {
  const { t } = useTranslation()
  const create = useCreateVariationOrderMutation()
  const update = useUpdateVariationOrderMutation()
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
    const input: VariationOrderInput = {
      voNumber: values.voNumber.trim(),
      amountMinor,
      dateAdded: values.dateAdded,
      status: values.status,
      notes: values.notes.trim() || null,
    }
    try {
      if (item) {
        // Only what changed is sent.
        const before: VariationOrderInput = {
          voNumber: item.voNumber,
          amountMinor: item.amountMinor,
          dateAdded: item.dateAdded,
          status: item.status,
          notes: item.notes,
        }
        const patch: VariationOrderUpdate = {}
        for (const key of Object.keys(
          input,
        ) as Array<keyof VariationOrderInput>) {
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
        const created = await create.mutateAsync({
          villaId,
          input,
          write: idempotencyWrite(idempotency.getKey()),
        })
        toast.success(t("variationOrders.added"))
        onCreated?.(created)
      }
      idempotency.resetKey()
      onClose()
    } catch (err) {
      idempotency.markRejected()
      setFormError(toApiError(err).message)
    }
  }

  return (
    <Modal
      open
      onClose={pending ? () => {} : onClose}
      title={
        item ? t("variationOrders.editTitle") : t("variationOrders.addTitle")
      }
      footer={
        <>
          <Button type="button" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="variation-order-form"
            variant="primary"
            disabled={pending}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="variation-order-form" className="grid gap-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t("variationOrders.voNumber")}
            value={values.voNumber}
            onChange={(e) => set("voNumber")(e.target.value)}
            error={errors.voNumber}
            maxLength={50}
            dir="auto"
          />
          <Input
            label={t("variationOrders.amountKwd")}
            inputMode="decimal"
            value={values.amount}
            onChange={(e) => set("amount")(e.target.value)}
            error={errors.amount}
            placeholder="0.000"
            dir="ltr"
          />
          <Input
            label={t("variationOrders.dateAdded")}
            type="date"
            value={values.dateAdded}
            onChange={(e) => set("dateAdded")(e.target.value)}
            error={errors.dateAdded}
          />
          {canSetStatus && (
            <Select
              label={t("variationOrders.status")}
              value={values.status}
              onChange={(e) =>
                set("status")(e.target.value as VariationOrderStatus)
              }
              options={VARIATION_ORDER_STATUSES.map((status) => ({
                value: status,
                label: t(`variationOrders.statuses.${status}`),
              }))}
            />
          )}
        </div>
        <Textarea
          label={t("variationOrders.notes")}
          value={values.notes}
          onChange={(e) => set("notes")(e.target.value)}
          error={errors.notes}
          maxLength={2000}
          rows={4}
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
