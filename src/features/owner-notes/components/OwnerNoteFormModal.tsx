import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useVillaOptionsQuery, useVillaQuery } from "@/features/villas/api"
import { toApiError } from "@/shared/api/errors"
import {
  fullWrite,
  idempotencyWrite,
  useIdempotencyKey,
} from "@/shared/api/write-safety"
import { toast } from "@/shared/lib/toast"
import Button from "@/shared/ui/Button"
import { FormField, Input, Textarea } from "@/shared/ui/Field"
import Modal from "@/shared/ui/Modal"
import { SearchSelect } from "@/shared/ui/search-select"
import {
  useCreateOwnerNoteMutation,
  useUpdateOwnerNoteMutation,
  type OwnerNote,
  type OwnerNoteInput,
  type OwnerNoteUpdate,
} from "../api"

type Errors = Partial<Record<keyof OwnerNoteInput, string>>

const FIELDS: Array<keyof OwnerNoteInput> = ["villaId", "notes"]

// The checks the server makes, so a missing field is shown before anything is sent.
function check(values: OwnerNoteInput): Errors {
  const errors: Errors = {}
  if (!values.villaId) errors.villaId = "ownerNotes.errors.villa"
  if (!values.notes.trim()) errors.notes = "ownerNotes.errors.notes"
  return errors
}

/** Adds an owner note for a villa, or edits `item` when it is given. */
export default function OwnerNoteFormModal({
  open,
  item,
  onClose,
}: {
  open: boolean
  item?: OwnerNote
  onClose: () => void
}) {
  if (!open) return null
  return <Inner key={item?.id ?? "new"} item={item} onClose={onClose} />
}

type InnerProps = {
  item?: OwnerNote
  onClose: () => void
}

function Inner({ item, onClose }: InnerProps) {
  const { t } = useTranslation()
  const villas = useVillaOptionsQuery()
  const create = useCreateOwnerNoteMutation()
  const update = useUpdateOwnerNoteMutation()
  const idempotency = useIdempotencyKey(true)
  const [values, setValues] = useState<OwnerNoteInput>(
    item
      ? { villaId: item.villa.id, notes: item.notes }
      : { villaId: "", notes: "" },
  )
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  // The picked villa, for its location and its owner's name (both shown, not typed).
  const villa = useVillaQuery(values.villaId || undefined)
  const pending = create.isPending || update.isPending

  const set = (key: keyof OwnerNoteInput) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const picked = villa.data?.id === values.villaId ? villa.data : undefined
  const fromItem = item && item.villa.id === values.villaId ? item : undefined
  const location = picked?.location ?? fromItem?.villa.location ?? ""
  const ownerName = picked
    ? (picked.ownerName ?? "-")
    : fromItem
      ? (fromItem.ownerName ?? "-")
      : ""

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    const found = check(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    const input: OwnerNoteInput = {
      villaId: values.villaId,
      notes: values.notes.trim(),
    }
    try {
      if (item) {
        // Only what changed is sent.
        const before: OwnerNoteInput = {
          villaId: item.villa.id,
          notes: item.notes,
        }
        const patch: OwnerNoteUpdate = {}
        for (const key of FIELDS) {
          if (input[key] !== before[key]) patch[key] = input[key]
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
        toast.success(t("ownerNotes.added"))
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
      title={item ? t("ownerNotes.editTitle") : t("ownerNotes.addTitle")}
      footer={
        <>
          <Button type="button" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="owner-note-form"
            variant="primary"
            disabled={pending}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="owner-note-form" className="grid gap-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={t("ownerNotes.villaNumber")}
            error={errors.villaId}
            htmlFor="owner-note-villa"
          >
            <SearchSelect
              id="owner-note-villa"
              value={values.villaId}
              onChange={set("villaId")}
              options={villaOptions}
              loading={villas.isLoading}
              placeholder={t("ownerNotes.pickVilla")}
              aria-invalid={!!errors.villaId}
            />
          </FormField>
          <Input
            label={t("ownerNotes.location")}
            value={location}
            readOnly
            disabled
            placeholder={t("ownerNotes.locationHint")}
            dir="auto"
          />
        </div>
        <Input
          label={t("ownerNotes.ownerName")}
          value={ownerName}
          readOnly
          disabled
          placeholder={t("ownerNotes.ownerNameHint")}
          dir="auto"
        />
        <Textarea
          label={t("ownerNotes.notes")}
          value={values.notes}
          onChange={(e) => set("notes")(e.target.value)}
          error={errors.notes}
          maxLength={4000}
          rows={5}
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
