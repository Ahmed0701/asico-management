import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { toApiError } from "@/shared/api/errors"
import {
  fullWrite,
  idempotencyWrite,
  useIdempotencyKey,
} from "@/shared/api/write-safety"
import { toast } from "@/shared/lib/toast"
import Button from "@/shared/ui/Button"
import { Input, Textarea } from "@/shared/ui/Field"
import Modal from "@/shared/ui/Modal"
import {
  useCreateMaintenanceMutation,
  useUpdateMaintenanceMutation,
  type MaintenanceInput,
  type MaintenanceUpdate,
  type MaintenanceVilla,
} from "../api"

type Errors = Partial<Record<keyof MaintenanceInput, string>>

const FIELDS: Array<keyof MaintenanceInput> = [
  "villaNumber",
  "location",
  "handoverDate",
  "issue",
]

const EMPTY: MaintenanceInput = {
  villaNumber: "",
  location: "",
  handoverDate: "",
  issue: "",
}

// The checks the server makes, so a missing field is shown before anything is sent.
function check(values: MaintenanceInput): Errors {
  const errors: Errors = {}
  const villaNumber = values.villaNumber.trim()
  if (!villaNumber) {
    errors.villaNumber = "maintenance.errors.villaNumber"
  } else if (villaNumber.length > 50) {
    errors.villaNumber = "maintenance.errors.villaNumberLong"
  }
  if (!values.location.trim()) errors.location = "maintenance.errors.location"
  if (!values.handoverDate) {
    errors.handoverDate = "maintenance.errors.handoverDate"
  }
  if (!values.issue.trim()) errors.issue = "maintenance.errors.issue"
  return errors
}

/** Adds a maintenance villa (all typed by hand), or edits `item` when it is given. */
export default function MaintenanceFormModal({
  open,
  item,
  onClose,
}: {
  open: boolean
  item?: MaintenanceVilla
  onClose: () => void
}) {
  if (!open) return null
  return <Inner key={item?.id ?? "new"} item={item} onClose={onClose} />
}

function Inner({
  item,
  onClose,
}: {
  item?: MaintenanceVilla
  onClose: () => void
}) {
  const { t } = useTranslation()
  const create = useCreateMaintenanceMutation()
  const update = useUpdateMaintenanceMutation()
  const idempotency = useIdempotencyKey(true)
  const [values, setValues] = useState<MaintenanceInput>(
    item
      ? {
          villaNumber: item.villaNumber,
          location: item.location,
          handoverDate: item.handoverDate,
          issue: item.issue,
        }
      : EMPTY,
  )
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const pending = create.isPending || update.isPending

  const set = (key: keyof MaintenanceInput) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    const found = check(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    const input: MaintenanceInput = {
      villaNumber: values.villaNumber.trim(),
      location: values.location.trim(),
      handoverDate: values.handoverDate,
      issue: values.issue.trim(),
    }
    try {
      if (item) {
        // Only what changed is sent.
        const patch: MaintenanceUpdate = {}
        for (const key of FIELDS) {
          if (input[key] !== item[key]) patch[key] = input[key]
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
        toast.success(t("maintenance.added", { name: input.villaNumber }))
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
      title={item ? t("maintenance.editTitle") : t("maintenance.addTitle")}
      footer={
        <>
          <Button type="button" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="maintenance-form"
            variant="primary"
            disabled={pending}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="maintenance-form" className="grid gap-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t("maintenance.villaNumber")}
            value={values.villaNumber}
            onChange={(e) => set("villaNumber")(e.target.value)}
            error={errors.villaNumber}
            maxLength={50}
            autoFocus
          />
          <Input
            label={t("maintenance.handoverDate")}
            type="date"
            value={values.handoverDate}
            onChange={(e) => set("handoverDate")(e.target.value)}
            error={errors.handoverDate}
          />
        </div>
        <Input
          label={t("maintenance.location")}
          value={values.location}
          onChange={(e) => set("location")(e.target.value)}
          error={errors.location}
          maxLength={200}
          dir="auto"
        />
        <Textarea
          label={t("maintenance.issue")}
          value={values.issue}
          onChange={(e) => set("issue")(e.target.value)}
          error={errors.issue}
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
