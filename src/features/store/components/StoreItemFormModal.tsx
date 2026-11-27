import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { applyApiFieldErrors } from "@/features/auth/api/formErrors"
import { toApiError } from "@/shared/api/errors"
import {
  fullWrite,
  idempotencyWrite,
  resolveWriteSafetyClientMessage,
  useIdempotencyKey,
} from "@/shared/api/write-safety"
import { toast } from "@/shared/lib/toast"
import Button from "@/shared/ui/Button"
import { Form } from "@/shared/ui/form"
import { FormTextField } from "@/shared/ui/form-text-field"
import Modal from "@/shared/ui/Modal"
import {
  STORE_CATEGORIES,
  STORE_UNITS,
  useCreateStoreItemMutation,
  useStoreFactoriesQuery,
  useStoreItemNamesQuery,
  useStoreItemOptionsQuery,
  useStoreWarehousesQuery,
  useUpdateStoreItemMutation,
  type StoreItem,
  type StoreItemUpdate,
} from "../api"
import { itemTextStyle } from "../lib/itemColor"
import { unitLabel } from "../lib/storeFormat"
import ColoredItemName from "./ColoredItemName"
import { storeItemFormSchema, type StoreItemFormValues } from "../schema"
import { StoreCategoryBadge } from "./StoreBadges"
import {
  FormSearchSelectField,
  FormSelectField,
  FormTextareaField,
} from "./StoreFormFields"

const toNumber = (text: string): number | null =>
  text.trim() === "" ? null : Number(text)

function valuesOf(item?: StoreItem): StoreItemFormValues {
  return {
    referenceId: "",
    name: item?.name ?? "",
    category: item?.category ?? "WIRE",
    unit: item?.unit ?? "Pcs",
    minQuantity: item?.minQuantity == null ? "" : String(item.minQuantity),
    openingQuantity: "",
    openingWarehouseId: "",
    factoryId: item?.factory?.id ?? "",
    notes: item?.notes ?? "",
  }
}

type Props = {
  open: boolean
  item?: StoreItem
  /** The store the opening stock goes to unless another is picked (the store on screen). */
  defaultWarehouseId?: string
  onClose: () => void
}

/**
 * Adds a store item picked from the items reference list (its name, category, factory and unit come from the list), with
 * the stock already in a store; or changes `item`'s details. The stock itself only moves by a movement.
 */
export default function StoreItemFormModal({
  open,
  item,
  defaultWarehouseId,
  onClose,
}: Props) {
  if (!open) return null
  return (
    <Inner
      key={item?.id ?? "new"}
      item={item}
      defaultWarehouseId={defaultWarehouseId}
      onClose={onClose}
    />
  )
}

function Inner({ item, defaultWarehouseId, onClose }: Omit<Props, "open">) {
  const { t } = useTranslation()
  const create = useCreateStoreItemMutation()
  const update = useUpdateStoreItemMutation()
  const idempotency = useIdempotencyKey(true)
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<StoreItemFormValues>({
    resolver: zodResolver(storeItemFormSchema),
    defaultValues: valuesOf(item),
  })
  const pending = create.isPending || update.isPending
  const factories = useStoreFactoriesQuery()
  const reference = useStoreItemNamesQuery()
  const items = useStoreItemOptionsQuery()
  const warehouses = useStoreWarehousesQuery()
  const category = form.watch("category")
  const factoryId = form.watch("factoryId")
  const name = form.watch("name")
  const referenceId = form.watch("referenceId")
  const picked = reference.data?.find((entry) => entry.id === referenceId)

  const openingWarehouseId = form.watch("openingWarehouseId")
  useEffect(() => {
    const first = defaultWarehouseId ?? warehouses.data?.[0]?.id
    if (!openingWarehouseId && first) form.setValue("openingWarehouseId", first)
  }, [defaultWarehouseId, warehouses.data, openingWarehouseId, form])

  // Adding: the entry picked from the reference list gives the item its name, category, factory and unit.
  useEffect(() => {
    if (item || !picked) return
    form.setValue("name", picked.name)
    form.setValue("category", picked.category)
    form.setValue("factoryId", picked.factory?.id ?? "")
    form.setValue("unit", picked.unit)
    form.clearErrors(["referenceId", "factoryId"])
  }, [item, picked, form])

  // Editing: a name belongs to the list of one category, and only a wire has a factory, so picking another category clears
  // a name that is not in its list, and the factory unless it is a wire.
  useEffect(() => {
    if (!item) return
    if (reference.data && name && name !== item.name) {
      const inList = reference.data.some(
        (entry) => entry.category === category && entry.name === name,
      )
      if (!inList) form.setValue("name", "")
    }
    if (category !== "WIRE" && factoryId) form.setValue("factoryId", "")
  }, [item, category, name, factoryId, reference.data, form])

  useEffect(() => {
    const sub = form.watch(() => idempotency.onEditAfterReject())
    return () => sub.unsubscribe()
  }, [form, idempotency])

  const submit = form.handleSubmit(async (values) => {
    setFormError(null)
    if (!item && !values.referenceId) {
      form.setError("referenceId", { message: "store.errors.pickItem" })
      return
    }
    const fields = {
      name: values.name.trim(),
      category: values.category,
      unit: values.unit.trim(),
      minQuantity: toNumber(values.minQuantity),
      factoryId: values.category === "WIRE" ? values.factoryId || null : null,
      notes: values.notes.trim() || null,
    }
    try {
      if (item) {
        // Only what changed is sent.
        const before = valuesOf(item)
        const patch: StoreItemUpdate = {}
        if (fields.name !== before.name) patch.name = fields.name
        if (fields.category !== before.category)
          patch.category = fields.category
        if (fields.unit !== before.unit) patch.unit = fields.unit
        if (fields.minQuantity !== toNumber(before.minQuantity))
          patch.minQuantity = fields.minQuantity
        if (fields.factoryId !== (before.factoryId || null))
          patch.factoryId = fields.factoryId
        if ((fields.notes ?? "") !== before.notes) patch.notes = fields.notes
        if (Object.keys(patch).length > 0) {
          await update.mutateAsync({
            id: item.id,
            input: patch,
            write: fullWrite(idempotency.getKey(), item.version),
          })
          toast.success(t("store.itemSaved", { name: fields.name }))
        }
      } else {
        const opening = toNumber(values.openingQuantity)
        await create.mutateAsync({
          input: {
            ...fields,
            ...(opening
              ? {
                  openingQuantity: opening,
                  openingWarehouseId: values.openingWarehouseId,
                }
              : {}),
          },
          write: idempotencyWrite(idempotency.getKey()),
        })
        toast.success(t("store.itemAdded", { name: fields.name }))
      }
      idempotency.resetKey()
      onClose()
    } catch (err) {
      const parsed = toApiError(err)
      applyApiFieldErrors(parsed, form.setError)
      setFormError(resolveWriteSafetyClientMessage(t, parsed))
      idempotency.markRejected()
    }
  })

  // The names another item already has are not offered again; an item being edited keeps its own.
  const used = new Set(
    (items.data ?? [])
      .filter((option) => option.id !== item?.id)
      .map((option) => option.name.toLocaleLowerCase()),
  )
  const free = (reference.data ?? []).filter(
    (entry) => !used.has(entry.name.toLocaleLowerCase()),
  )
  const referenceOptions = free.map((entry) => ({
    value: entry.id,
    label: `${
      entry.factory ? `${entry.name} · ${entry.factory.name}` : entry.name
    } (${t(`store.categories.${entry.category}`)})`,
  }))

  // Editing only: the fields stay as they were, picked from short lists.
  const units: string[] = [...STORE_UNITS]
  if (item && !units.includes(item.unit)) units.push(item.unit)
  const unitOptions = units.map((value) => ({ value, label: unitLabel(value) }))
  const listed = free
    .filter((entry) => entry.category === category)
    .map((entry) => entry.name)
  if (item && !listed.includes(item.name)) listed.unshift(item.name)
  const nameOptions = listed.map((entry) => ({ value: entry, label: entry }))
  const factoryOptions = (factories.data ?? [])
    .filter((factory) => factory.category === "WIRE")
    .map((factory) => ({ value: factory.id, label: factory.name }))
  const categoryOptions = STORE_CATEGORIES.map((value) => ({
    value,
    label: t(`store.categories.${value}`),
  }))

  return (
    <Modal
      open
      onClose={pending ? () => {} : onClose}
      title={item ? t("store.editItem") : t("store.addItem")}
      footer={
        <>
          <Button type="button" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="store-item-form"
            variant="primary"
            disabled={pending}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      {formError && (
        <p role="alert" className="mb-3 text-sm text-danger">
          {formError}
        </p>
      )}
      <Form {...form}>
        <form
          id="store-item-form"
          className="space-y-4"
          onSubmit={(e) => void submit(e)}
        >
          {item ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormSelectField
                  control={form.control}
                  name="category"
                  label={t("store.category")}
                  options={categoryOptions}
                />
                <FormSelectField
                  control={form.control}
                  name="unit"
                  label={t("store.unit")}
                  options={unitOptions}
                />
              </div>
              <FormSearchSelectField
                control={form.control}
                name="name"
                label={t("store.name")}
                options={nameOptions}
                loading={reference.isLoading}
                placeholder={t("store.pickItemName")}
                renderOption={(option) => (
                  <ColoredItemName name={option.value} />
                )}
                selectedStyle={itemTextStyle(name)}
              />
              {category === "WIRE" && (
                <FormSelectField
                  control={form.control}
                  name="factoryId"
                  label={t("store.factory")}
                  options={factoryOptions}
                  placeholder={t("store.pickFactory")}
                />
              )}
            </>
          ) : (
            <div>
              <FormSearchSelectField
                control={form.control}
                name="referenceId"
                label={t("store.name")}
                options={referenceOptions}
                loading={reference.isLoading}
                placeholder={t("store.pickItemName")}
                renderOption={(option) => {
                  const entry = free.find((e) => e.id === option.value)
                  return entry ? (
                    <span className="inline-flex items-center gap-1.5">
                      <ColoredItemName
                        name={entry.name}
                        factory={entry.factory?.name}
                      />{" "}
                      <span className="text-xs text-muted-foreground">
                        ({t(`store.categories.${entry.category}`)})
                      </span>
                    </span>
                  ) : (
                    option.label
                  )
                }}
                selectedStyle={picked ? itemTextStyle(picked.name) : undefined}
              />
              {reference.data && referenceOptions.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("store.noItemNames")}
                </p>
              )}
              {picked && (
                <div
                  className="mt-2 flex flex-wrap items-center gap-2 text-sm"
                  data-testid="store-item-picked"
                >
                  <StoreCategoryBadge category={picked.category} />
                  {picked.factory && (
                    <span className="text-muted-foreground" dir="auto">
                      {picked.factory.name}
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    {unitLabel(picked.unit)}
                  </span>
                </div>
              )}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormTextField
              control={form.control}
              name="minQuantity"
              label={t("store.minQuantity")}
              inputMode="decimal"
              placeholder={t("store.minQuantityHint")}
            />
          </div>
          {!item && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormTextField
                control={form.control}
                name="openingQuantity"
                label={t("store.openingQuantity")}
                inputMode="decimal"
                placeholder="0"
              />
              <FormSelectField
                control={form.control}
                name="openingWarehouseId"
                label={t("store.openingStore")}
                options={(warehouses.data ?? []).map((w) => ({
                  value: w.id,
                  label: w.name,
                }))}
              />
            </div>
          )}
          <FormTextareaField
            control={form.control}
            name="notes"
            label={t("store.notes")}
            maxLength={1000}
          />
        </form>
      </Form>
    </Modal>
  )
}
