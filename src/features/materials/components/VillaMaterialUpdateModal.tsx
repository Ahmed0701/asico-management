import { useEffect, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import {
  assignedFactoryOf,
  useVillaVendorsOfQuery,
} from "@/features/vendors/api"
import { toApiError } from "@/shared/api/errors"
import { idempotencyWrite, useIdempotencyKey } from "@/shared/api/write-safety"
import { toast } from "@/shared/lib/toast"
import Button from "@/shared/ui/Button"
import { Input, Select } from "@/shared/ui/Field"
import Modal from "@/shared/ui/Modal"
import {
  useCreateDeliveryMutation,
  useFactoriesQuery,
  useSetRequirementsMutation,
} from "../api"
import type { VillaMaterialRow } from "./VillaMaterialsProgressCard"

// Today on this computer, YYYY-MM-DD.
function today(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// At most two decimals.
const round2 = (value: number): number => Math.round(value * 100) / 100
const isQuantity = (text: string): boolean => {
  const value = Number(text)
  return (
    text.trim() !== "" &&
    Number.isFinite(value) &&
    value >= 0 &&
    Math.round(value * 100) === value * 100
  )
}

type Values = {
  required: string
  delivered: string
  factoryId: string
  deliveryDate: string
  noteNumber: string
}

type Errors = Partial<Record<keyof Values, string>>

type Props = {
  villaId: string
  villaNumber: string
  row: VillaMaterialRow
  onClose: () => void
}

/**
 * Updates one material of a villa: what the villa needs (empty: the list's quantity), and what came. Raising what came
 * records a delivery of the difference from a factory of the material's type, so the deliveries list follows. What came
 * is never lowered here: a wrong delivery is edited or deleted on the Materials page.
 */
export default function VillaMaterialUpdateModal({
  villaId,
  villaNumber,
  row,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const canRequire = can("materials:update")
  const canDeliver = can("materials:create")
  const factories = useFactoriesQuery()
  const setRequirements = useSetRequirementsMutation()
  const createDelivery = useCreateDeliveryMutation()
  const idempotency = useIdempotencyKey()
  const [values, setValues] = useState<Values>({
    required: row.custom ? String(row.required) : "",
    delivered: String(row.delivered),
    factoryId: "",
    deliveryDate: today(),
    noteNumber: "",
  })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const pending = setRequirements.isPending || createDelivery.isPending
  // The delivery comes from the villa's vendor of the material's type (the Vendors page), unless another is picked.
  const vendors = useVillaVendorsOfQuery(villaId)
  const assigned = assignedFactoryOf(vendors.data, row.type)
  useEffect(() => {
    if (!assigned) return
    setValues((v) => (v.factoryId ? v : { ...v, factoryId: assigned.id }))
  }, [assigned])

  const delivered = isQuantity(values.delivered)
    ? Number(values.delivered)
    : row.delivered
  const extra = round2(delivered - row.delivered)
  const factoryOptions = (factories.data ?? [])
    .filter((factory) => factory.type === row.type)
    .map((factory) => ({ value: factory.id, label: factory.name }))

  const set = (key: keyof Values) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const found: Errors = {}
    const requiredText = values.required.trim()
    if (requiredText !== "" && !isQuantity(requiredText)) {
      found.required = "materials.villaUpdate.quantityInvalid"
    }
    if (!isQuantity(values.delivered)) {
      found.delivered = "materials.villaUpdate.quantityInvalid"
    } else if (Number(values.delivered) < row.delivered) {
      found.delivered = "materials.villaUpdate.cannotLower"
    }
    if (extra > 0) {
      if (!values.factoryId)
        found.factoryId = "materials.villaUpdate.factoryRequired"
      if (!values.deliveryDate)
        found.deliveryDate = "materials.errors.deliveryDate"
    }
    setErrors(found)
    if (Object.keys(found).length > 0) return

    // The villa's own quantity: a number, or null to follow the list's.
    const own = requiredText === "" ? null : Number(requiredText)
    const requirementChanged = own !== (row.custom ? row.required : null)
    setFormError(null)
    try {
      if (requirementChanged) {
        await setRequirements.mutateAsync({
          villaId,
          items: [{ itemId: row.itemId, quantity: own }],
        })
      }
      if (extra > 0) {
        await createDelivery.mutateAsync({
          input: {
            villaId,
            factoryId: values.factoryId,
            lines: [{ itemId: row.itemId, quantity: extra }],
            noteNumber: values.noteNumber.trim() || null,
            deliveryDate: values.deliveryDate,
            mrDate: null,
            poDate: null,
          },
          write: idempotencyWrite(idempotency.getKey()),
        })
        idempotency.resetKey()
      }
      toast.success(
        t("materials.villaUpdate.saved", {
          name: row.name,
          villa: villaNumber,
        }),
      )
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
      title={t("materials.villaUpdate.title", {
        name: row.name,
        villa: villaNumber,
      })}
      footer={
        <>
          <Button type="button" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="villa-material-form"
            variant="primary"
            disabled={pending}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="villa-material-form" className="grid gap-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={`${t("materials.villaUpdate.required")} (${row.unit})`}
            inputMode="decimal"
            value={values.required}
            onChange={(e) => set("required")(e.target.value)}
            error={errors.required}
            placeholder={String(row.listRequired)}
            disabled={!canRequire}
            dir="ltr"
          />
          <Input
            label={`${t("materials.villaUpdate.delivered")} (${row.unit})`}
            inputMode="decimal"
            value={values.delivered}
            onChange={(e) => set("delivered")(e.target.value)}
            error={errors.delivered}
            disabled={!canDeliver}
            dir="ltr"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {t("materials.villaUpdate.hint", {
            list: row.listRequired,
            unit: row.unit,
            delivered: row.delivered,
          })}
        </p>
        {extra > 0 && (
          <fieldset className="grid gap-4 rounded-xl border border-accent/30 bg-accent/5 p-3">
            <legend className="px-1 text-xs font-semibold text-accent">
              {t("materials.villaUpdate.newDelivery", {
                quantity: extra,
                unit: row.unit,
              })}
            </legend>
            <Select
              label={t("materials.factory")}
              value={values.factoryId}
              onChange={(e) => set("factoryId")(e.target.value)}
              error={errors.factoryId}
              placeholder={t("materials.villaUpdate.pickFactory")}
              options={factoryOptions}
              hint={
                assigned
                  ? values.factoryId === assigned.id
                    ? t("materials.fromVendors")
                    : t("materials.notTheVendor", { name: assigned.name })
                  : t("materials.noVendor")
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t("materials.deliveryDate")}
                type="date"
                value={values.deliveryDate}
                onChange={(e) => set("deliveryDate")(e.target.value)}
                error={errors.deliveryDate}
              />
              <Input
                label={t("materials.noteNumber")}
                value={values.noteNumber}
                onChange={(e) => set("noteNumber")(e.target.value)}
                maxLength={50}
              />
            </div>
          </fieldset>
        )}
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
