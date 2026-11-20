import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { toApiError } from "@/shared/api/errors"
import { idempotencyWrite, useIdempotencyKey } from "@/shared/api/write-safety"
import { toast } from "@/shared/lib/toast"
import Button from "@/shared/ui/Button"
import { Input, Select } from "@/shared/ui/Field"
import Modal from "@/shared/ui/Modal"
import {
  FACTORY_TYPES,
  useCreateItemMutation,
  useUpdateItemMutation,
  type FactoryType,
  type ItemInput,
  type MaterialItem,
} from "../api"

/** The units a material is counted in: pieces or meters. */
export const UNITS = ["pcs", "Mt"] as const

type Values = {
  name: string
  type: FactoryType
  unit: string
  required: string
}

type Errors = Partial<Record<keyof Values, string>>

// A quantity with at most two decimals, 0 or more.
const validQuantity = (text: string): boolean => {
  const value = Number(text)
  return (
    text.trim() !== "" &&
    Number.isFinite(value) &&
    value >= 0 &&
    Math.round(value * 100) === value * 100
  )
}

type Props = {
  /** The material to change; none to add one. */
  item?: MaterialItem
  onClose: () => void
}

/**
 * Adds a material to the list, or changes one: its name, type, unit and how much every villa needs. A material already
 * on deliveries keeps its type.
 */
export default function MaterialItemFormModal({ item, onClose }: Props) {
  const { t } = useTranslation()
  const create = useCreateItemMutation()
  const update = useUpdateItemMutation()
  const idempotency = useIdempotencyKey()
  const [values, setValues] = useState<Values>({
    name: item?.name ?? "",
    type: item?.type ?? "SWITCHGEAR",
    unit: item?.unit ?? UNITS[0],
    required: item ? String(item.requiredPerVilla) : "0",
  })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const pending = create.isPending || update.isPending
  const typeLocked = (item?.lineCount ?? 0) > 0
  // A material saved with another unit before keeps it as a choice.
  const unitOptions = [
    ...UNITS,
    ...(item && !(UNITS as readonly string[]).includes(item.unit)
      ? [item.unit]
      : []),
  ].map((unit) => ({
    value: unit,
    label: t(`materials.items.units.${unit}`, unit),
  }))

  const set = (key: keyof Values) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const found: Errors = {}
    if (!values.name.trim()) found.name = "materials.items.nameRequired"
    if (!values.unit.trim()) found.unit = "materials.items.unitRequired"
    if (!validQuantity(values.required)) {
      found.required = "materials.items.requiredInvalid"
    }
    setErrors(found)
    if (Object.keys(found).length > 0) return
    const input: ItemInput = {
      name: values.name.trim(),
      type: values.type,
      unit: values.unit.trim(),
      requiredPerVilla: Number(values.required),
    }
    setFormError(null)
    try {
      if (item) {
        // Only what changed is sent.
        const patch: Partial<ItemInput> = {}
        if (input.name !== item.name) patch.name = input.name
        if (input.type !== item.type) patch.type = input.type
        if (input.unit !== item.unit) patch.unit = input.unit
        if (input.requiredPerVilla !== item.requiredPerVilla) {
          patch.requiredPerVilla = input.requiredPerVilla
        }
        if (Object.keys(patch).length > 0) {
          await update.mutateAsync({
            id: item.id,
            input: patch,
            version: item.version,
          })
        }
        toast.success(t("materials.items.saved", { name: input.name }))
      } else {
        await create.mutateAsync({
          input,
          write: idempotencyWrite(idempotency.getKey()),
        })
        idempotency.resetKey()
        toast.success(t("materials.items.added", { name: input.name }))
      }
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
        item ? t("materials.items.editTitle") : t("materials.items.addTitle")
      }
      footer={
        <>
          <Button type="button" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="material-item-form"
            variant="primary"
            disabled={pending}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="material-item-form" className="grid gap-4" onSubmit={submit}>
        <Input
          label={t("materials.items.name")}
          value={values.name}
          onChange={(e) => set("name")(e.target.value)}
          error={errors.name}
          maxLength={100}
          dir="auto"
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label={t("materials.type")}
            value={values.type}
            onChange={(e) => set("type")(e.target.value)}
            disabled={typeLocked}
            options={FACTORY_TYPES.map((type) => ({
              value: type,
              label: t(`materials.types.${type}`),
            }))}
          />
          <Select
            label={t("materials.items.unit")}
            value={values.unit}
            onChange={(e) => set("unit")(e.target.value)}
            error={errors.unit}
            options={unitOptions}
          />
          <Input
            label={t("materials.items.required")}
            inputMode="decimal"
            value={values.required}
            onChange={(e) => set("required")(e.target.value)}
            error={errors.required}
            dir="ltr"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {typeLocked
            ? t("materials.items.typeLocked")
            : t("materials.items.requiredHint")}
        </p>
        {formError && (
          <p
            role="alert"
            className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
          >
            {formError}
          </p>
        )}
      </form>
    </Modal>
  )
}
