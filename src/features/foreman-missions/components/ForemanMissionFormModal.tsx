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
  useCreateForemanMissionMutation,
  useUpdateForemanMissionMutation,
  type ForemanMission,
  type ForemanMissionInput,
  type ForemanMissionUpdate,
} from "../api"

type Errors = Partial<Record<keyof ForemanMissionInput, string>>

const FIELDS: Array<keyof ForemanMissionInput> = ["villaId", "notes"]

// The checks the server makes, so a missing field is shown before anything is sent.
function check(values: ForemanMissionInput): Errors {
  const errors: Errors = {}
  if (!values.villaId) errors.villaId = "foremanMissions.errors.villa"
  if (!values.notes.trim()) errors.notes = "foremanMissions.errors.notes"
  return errors
}

/** Adds a foreman mission for a villa, or edits `item` when it is given. */
export default function ForemanMissionFormModal({
  open,
  item,
  onClose,
}: {
  open: boolean
  item?: ForemanMission
  onClose: () => void
}) {
  if (!open) return null
  return <Inner key={item?.id ?? "new"} item={item} onClose={onClose} />
}

type InnerProps = {
  item?: ForemanMission
  onClose: () => void
}

function Inner({ item, onClose }: InnerProps) {
  const { t } = useTranslation()
  const villas = useVillaOptionsQuery()
  const create = useCreateForemanMissionMutation()
  const update = useUpdateForemanMissionMutation()
  const idempotency = useIdempotencyKey(true)
  const [values, setValues] = useState<ForemanMissionInput>(
    item
      ? { villaId: item.villa.id, notes: item.notes }
      : { villaId: "", notes: "" },
  )
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  // The picked villa, for its location and its owner's name (both shown, not typed).
  const villa = useVillaQuery(values.villaId || undefined)
  const pending = create.isPending || update.isPending

  const set = (key: keyof ForemanMissionInput) => (value: string) => {
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
    const input: ForemanMissionInput = {
      villaId: values.villaId,
      notes: values.notes.trim(),
    }
    try {
      if (item) {
        // Only what changed is sent.
        const before: ForemanMissionInput = {
          villaId: item.villa.id,
          notes: item.notes,
        }
        const patch: ForemanMissionUpdate = {}
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
        toast.success(t("foremanMissions.added"))
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
      title={
        item ? t("foremanMissions.editTitle") : t("foremanMissions.addTitle")
      }
      footer={
        <>
          <Button type="button" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="foreman-mission-form"
            variant="primary"
            disabled={pending}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="foreman-mission-form" className="grid gap-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={t("foremanMissions.villaNumber")}
            error={errors.villaId}
            htmlFor="foreman-mission-villa"
          >
            <SearchSelect
              id="foreman-mission-villa"
              value={values.villaId}
              onChange={set("villaId")}
              options={villaOptions}
              loading={villas.isLoading}
              placeholder={t("foremanMissions.pickVilla")}
              aria-invalid={!!errors.villaId}
            />
          </FormField>
          <Input
            label={t("foremanMissions.location")}
            value={location}
            readOnly
            disabled
            placeholder={t("foremanMissions.locationHint")}
            dir="auto"
          />
        </div>
        <Input
          label={t("foremanMissions.ownerName")}
          value={ownerName}
          readOnly
          disabled
          placeholder={t("foremanMissions.ownerNameHint")}
          dir="auto"
        />
        <Textarea
          label={t("foremanMissions.notes")}
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
