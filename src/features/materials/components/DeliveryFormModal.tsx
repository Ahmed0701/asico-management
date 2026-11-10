import { useState, type FormEvent } from "react"
import { SearchSelect } from "@/shared/ui/search-select"
import { useTranslation } from "react-i18next"
import { useVillaOptionsQuery } from "@/features/villas/api"
import { toApiError } from "@/shared/api/errors"
import { idempotencyWrite, useIdempotencyKey } from "@/shared/api/write-safety"
import { cn } from "@/shared/lib/cn"
import { toast } from "@/shared/lib/toast"
import Button from "@/shared/ui/Button"
import { Checkbox } from "@/shared/ui/checkbox"
import { FormField, Input, Select } from "@/shared/ui/Field"
import Modal from "@/shared/ui/Modal"
import {
  FACTORY_TYPES,
  uploadDeliveryNotes,
  useCreateDeliveryMutation,
  useFactoriesQuery,
  useItemsQuery,
  useUpdateDeliveryMutation,
  type DeliveryInput,
  type FactoryType,
  type MaterialDelivery,
} from "../api"

type Values = {
  villaId: string
  type: FactoryType
  factoryId: string
  noteNumber: string
  deliveryDate: string
}

type Errors = Partial<Record<keyof Values | "lines", string>>

/** The quantities typed for the ticked materials, by catalog item id. */
type Picked = Record<string, string>

const validQuantity = (text: string): boolean => {
  const quantity = Number(text)
  return quantity > 0 && Math.round(quantity * 100) === quantity * 100
}

/**
 * Records a delivery, or edits `item` when it is given. The materials are ticked from the catalog of the factory's type, each
 * with its quantity. `villaId` fixes the villa (opened from a villa page). A delivery note chosen here is uploaded right
 * after the delivery is saved.
 */
export default function DeliveryFormModal({
  open,
  item,
  villaId,
  onClose,
}: {
  open: boolean
  item?: MaterialDelivery
  villaId?: string
  onClose: () => void
}) {
  if (!open) return null
  return (
    <Inner
      key={item?.id ?? "new"}
      item={item}
      villaId={villaId}
      onClose={onClose}
    />
  )
}

function Inner({
  item,
  villaId,
  onClose,
}: {
  item?: MaterialDelivery
  villaId?: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const villas = useVillaOptionsQuery()
  const factories = useFactoriesQuery()
  const catalog = useItemsQuery()
  const create = useCreateDeliveryMutation()
  const update = useUpdateDeliveryMutation()
  const idempotency = useIdempotencyKey(true)
  const [values, setValues] = useState<Values>({
    villaId: item?.villa.id ?? villaId ?? "",
    type: item?.factory.type ?? "SWITCHGEAR",
    factoryId: item?.factory.id ?? "",
    noteNumber: item?.noteNumber ?? "",
    deliveryDate: item?.deliveryDate ?? new Date().toISOString().slice(0, 10),
  })
  const [picked, setPicked] = useState<Picked>(() =>
    Object.fromEntries(
      (item?.lines ?? []).map((line) => [line.item.id, String(line.quantity)]),
    ),
  )
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const set = (key: keyof Values) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  // A factory and the materials belong to one type: changing the type starts them over.
  const setType = (type: FactoryType) => {
    setValues((v) => ({ ...v, type, factoryId: "" }))
    setPicked({})
  }

  const toggle = (itemId: string, on: boolean) => {
    setPicked((p) => {
      const next = { ...p }
      if (on) next[itemId] = next[itemId] ?? "1"
      else delete next[itemId]
      return next
    })
    setErrors((e) => ({ ...e, lines: undefined }))
  }

  const items = (catalog.data ?? []).filter((i) => i.type === values.type)
  const factoryOptions = (factories.data ?? [])
    .filter((f) => f.type === values.type)
    .map((f) => ({ value: f.id, label: f.name }))
  const villaOptions = (villas.data ?? []).map((v) => ({
    value: v.id,
    label: v.villaNumber,
  }))
  const pickedIds = Object.keys(picked)

  const check = (): Errors => {
    const found: Errors = {}
    if (!values.villaId) found.villaId = "materials.errors.villa"
    if (!values.factoryId) found.factoryId = "materials.errors.factory"
    if (!values.deliveryDate)
      found.deliveryDate = "materials.errors.deliveryDate"
    if (pickedIds.length === 0) found.lines = "materials.errors.lines"
    else if (pickedIds.some((id) => !validQuantity(picked[id] ?? ""))) {
      found.lines = "materials.errors.quantity"
    }
    return found
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    const found = check()
    setErrors(found)
    if (Object.keys(found).length > 0) return
    const input: DeliveryInput = {
      villaId: values.villaId,
      factoryId: values.factoryId,
      lines: pickedIds.map((itemId) => ({
        itemId,
        quantity: Number(picked[itemId]),
      })),
      noteNumber: values.noteNumber.trim() || null,
      deliveryDate: values.deliveryDate,
    }
    setSaving(true)
    try {
      let saved: MaterialDelivery
      if (item) {
        saved = await update.mutateAsync({
          id: item.id,
          input,
          version: item.version,
        })
      } else {
        saved = await create.mutateAsync({
          input,
          write: idempotencyWrite(idempotency.getKey()),
        })
        idempotency.resetKey()
      }
      if (files.length > 0) {
        try {
          await uploadDeliveryNotes(saved.id, files)
        } catch (err) {
          // The delivery is saved; only the file failed. Say so, so it can be uploaded again from the list.
          toast.error(
            t("materials.noteUploadFailed", {
              reason: toApiError(err).message,
            }),
          )
        }
      }
      toast.success(t(item ? "materials.updated" : "materials.added"))
      onClose()
    } catch (err) {
      idempotency.markRejected()
      setFormError(toApiError(err).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      size="lg"
      onClose={saving ? () => {} : onClose}
      title={item ? t("materials.editTitle") : t("materials.addTitle")}
      footer={
        <>
          <Button type="button" onClick={onClose} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="delivery-form"
            variant="primary"
            disabled={saving}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="delivery-form" className="grid gap-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            label={t("materials.villa")}
            error={errors.villaId}
            htmlFor="delivery-villa"
          >
            <SearchSelect
              id="delivery-villa"
              value={values.villaId}
              onChange={set("villaId")}
              options={villaOptions}
              placeholder={t("materials.pickVilla")}
              disabled={!!villaId && !item}
              aria-invalid={!!errors.villaId}
            />
          </FormField>
          <Select
            label={t("materials.type")}
            value={values.type}
            onChange={(e) => setType(e.target.value as FactoryType)}
            options={FACTORY_TYPES.map((type) => ({
              value: type,
              label: t(`materials.types.${type}`),
            }))}
          />
          <Select
            label={t("materials.factory")}
            value={values.factoryId}
            onChange={(e) => set("factoryId")(e.target.value)}
            options={factoryOptions}
            placeholder={
              factoryOptions.length
                ? t("materials.pickFactory")
                : t("materials.noFactoriesOfType")
            }
            error={errors.factoryId}
          />
        </div>

        <fieldset className="grid gap-2">
          <legend className="mb-1 flex w-full items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
            <span>{t("materials.materialsDelivered")}</span>
            <span className="tabular-nums">
              {t("materials.pickedCount", { count: pickedIds.length })}
            </span>
          </legend>
          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
              {t("materials.noItemsOfType")}
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {items.map((material) => {
                const on = picked[material.id] !== undefined
                return (
                  <div
                    key={material.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2",
                      on
                        ? "border-accent/50 bg-accent/5"
                        : "border-border bg-card",
                    )}
                  >
                    <Checkbox
                      id={`material-${material.id}`}
                      checked={on}
                      onCheckedChange={(checked) =>
                        toggle(material.id, checked === true)
                      }
                    />
                    <label
                      htmlFor={`material-${material.id}`}
                      className="min-w-0 flex-1 cursor-pointer text-sm"
                      dir="auto"
                    >
                      {material.name}
                    </label>
                    {on && (
                      <span className="flex items-center gap-1.5">
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0.01"
                          step="0.01"
                          aria-label={t("materials.quantityOf", {
                            name: material.name,
                          })}
                          value={picked[material.id]}
                          onChange={(e) =>
                            setPicked((p) => ({
                              ...p,
                              [material.id]: e.target.value,
                            }))
                          }
                          className="h-8 w-20 rounded-md border border-border bg-background px-2 text-end text-sm tabular-nums"
                        />
                        <span className="w-8 text-xs text-muted-foreground">
                          {material.unit}
                        </span>
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {errors.lines && (
            <p role="alert" className="text-xs text-danger">
              {t(errors.lines)}
            </p>
          )}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t("materials.noteNumber")}
            value={values.noteNumber}
            onChange={(e) => set("noteNumber")(e.target.value)}
            maxLength={50}
          />
          <Input
            label={t("materials.deliveryDate")}
            type="date"
            value={values.deliveryDate}
            onChange={(e) => set("deliveryDate")(e.target.value)}
            error={errors.deliveryDate}
          />
        </div>
        <FormField
          label={t("materials.deliveryNote")}
          hint={
            item && item.deliveryNotes.length > 0
              ? t("materials.moreNotesHint", {
                  count: item.deliveryNotes.length,
                })
              : t("materials.noteHint")
          }
          htmlFor="delivery-note-file"
        >
          <input
            id="delivery-note-file"
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            multiple
            onChange={(e) =>
              setFiles(e.target.files ? Array.from(e.target.files) : [])
            }
            className="text-sm file:me-3 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-1.5 file:text-sm"
          />
        </FormField>
        {formError && (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        )}
      </form>
    </Modal>
  )
}
