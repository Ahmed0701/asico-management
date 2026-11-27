import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { applyApiFieldErrors } from "@/features/auth/api/formErrors"
import { useVillaOptionsQuery } from "@/features/villas/api"
import { toApiError } from "@/shared/api/errors"
import {
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
  STORE_MOVEMENT_KINDS,
  useCreateStoreMovementMutation,
  useStoreItemOptionsQuery,
  useStoreWarehousesQuery,
  type StoreMovementKind,
} from "../api"
import { itemTextStyle } from "../lib/itemColor"
import { formatQuantity, unitLabel } from "../lib/storeFormat"
import ColoredItemName from "./ColoredItemName"
import {
  storeMovementFormSchema,
  type StoreMovementFormValues,
} from "../schema"
import {
  FormSearchSelectField,
  FormSelectField,
  FormTextareaField,
} from "./StoreFormFields"

const withFactory = (name: string, factory?: { name: string } | null) =>
  factory ? `${name} · ${factory.name}` : name

/** Today on this device, YYYY-MM-DD. */
const today = () => new Date().toLocaleDateString("en-CA")

export type StoreMovementPreset = {
  kind: StoreMovementKind
  // The store it happens in; missing: the first store.
  warehouseId?: string
  itemId?: string
  villaId?: string
}

/**
 * Receives stock, issues it to a villa or a person, corrects it to what was counted, or transfers it to the other store.
 * `preset` picks the kind and the store, and may pick the item (from its row) or the villa (from the villa's page).
 */
export default function StoreMovementModal({
  preset,
  onClose,
}: {
  preset: StoreMovementPreset | null
  onClose: () => void
}) {
  if (!preset) return null
  return <Inner preset={preset} onClose={onClose} />
}

function Inner({
  preset,
  onClose,
}: {
  preset: StoreMovementPreset
  onClose: () => void
}) {
  const { t } = useTranslation()
  const items = useStoreItemOptionsQuery()
  const warehouses = useStoreWarehousesQuery()
  const villas = useVillaOptionsQuery()
  const create = useCreateStoreMovementMutation()
  const idempotency = useIdempotencyKey(true)
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<StoreMovementFormValues>({
    resolver: zodResolver(storeMovementFormSchema),
    defaultValues: {
      itemId: preset.itemId ?? "",
      warehouseId: preset.warehouseId ?? "",
      toWarehouseId: "",
      kind: preset.kind,
      quantity: "",
      villaId: preset.villaId ?? "",
      party: "",
      reference: "",
      note: "",
      movedOn: today(),
    },
  })
  const kind = form.watch("kind")
  const itemId = form.watch("itemId")
  const item = items.data?.find((option) => option.id === itemId)
  const warehouseId = form.watch("warehouseId")
  const toWarehouseId = form.watch("toWarehouseId")
  const stockIn = (id: string) =>
    item?.stocks.find((stock) => stock.warehouseId === id)?.quantity ?? 0

  // The store defaults to the first one; a transfer goes to another store (the other one, when there are two).
  useEffect(() => {
    const list = warehouses.data ?? []
    if (!warehouseId && list[0]) form.setValue("warehouseId", list[0].id)
    const other = list.find((w) => w.id !== warehouseId)
    if (
      kind === "TRANSFER" &&
      other &&
      (!toWarehouseId || toWarehouseId === warehouseId)
    ) {
      form.setValue("toWarehouseId", other.id)
    }
  }, [warehouses.data, warehouseId, toWarehouseId, kind, form])

  useEffect(() => {
    const sub = form.watch(() => idempotency.onEditAfterReject())
    return () => sub.unsubscribe()
  }, [form, idempotency])

  const submit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      const moved = await create.mutateAsync({
        input: {
          itemId: values.itemId,
          warehouseId: values.warehouseId,
          toWarehouseId:
            values.kind === "TRANSFER" ? values.toWarehouseId : null,
          kind: values.kind,
          quantity: Number(values.quantity),
          villaId:
            values.kind === "ISSUE" && values.villaId ? values.villaId : null,
          party: values.party.trim() || null,
          reference: values.reference.trim() || null,
          note: values.note.trim() || null,
          movedOn: values.movedOn || undefined,
        },
        write: idempotencyWrite(idempotency.getKey()),
      })
      idempotency.resetKey()
      toast.success(
        t("store.moved", {
          name: moved.item.name,
          balance: formatQuantity(moved.balanceAfter),
          unit: unitLabel(moved.item.unit),
        }),
      )
      onClose()
    } catch (err) {
      const parsed = toApiError(err)
      applyApiFieldErrors(parsed, form.setError)
      setFormError(resolveWriteSafetyClientMessage(t, parsed))
      idempotency.markRejected()
    }
  })

  const itemOptions = (items.data ?? []).map((option) => ({
    value: option.id,
    label: withFactory(option.name, option.factory),
  }))
  const villaOptions = (villas.data ?? []).map((villa) => ({
    value: villa.id,
    label: villa.villaNumber,
  }))
  const storeOptions = (warehouses.data ?? []).map((w) => ({
    value: w.id,
    label: w.name,
  }))
  // The store's page does not offer transfers between the stores.
  const kindOptions = STORE_MOVEMENT_KINDS.filter(
    (value) => value !== "TRANSFER",
  ).map((value) => ({
    value,
    label: t(`store.kinds.${value}`),
  }))

  return (
    <Modal
      open
      onClose={create.isPending ? () => {} : onClose}
      title={t(`store.moveTitle.${kind}`)}
      footer={
        <>
          <Button type="button" onClick={onClose} disabled={create.isPending}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="store-movement-form"
            variant="primary"
            disabled={create.isPending}
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
          id="store-movement-form"
          className="space-y-4"
          onSubmit={(e) => void submit(e)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelectField
              control={form.control}
              name="kind"
              label={t("store.kind")}
              options={kindOptions}
            />
            <FormTextField
              control={form.control}
              name="movedOn"
              label={t("store.movedOn")}
              type="date"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelectField
              control={form.control}
              name="warehouseId"
              label={
                kind === "TRANSFER"
                  ? t("store.fromStore")
                  : t("store.storeLabel")
              }
              options={storeOptions}
              placeholder={t("store.pickStore")}
            />
            {kind === "TRANSFER" && (
              <FormSelectField
                control={form.control}
                name="toWarehouseId"
                label={t("store.toStore")}
                options={storeOptions.filter((o) => o.value !== warehouseId)}
                placeholder={t("store.pickStore")}
              />
            )}
          </div>
          <FormSearchSelectField
            control={form.control}
            name="itemId"
            label={t("store.item")}
            options={itemOptions}
            loading={items.isLoading}
            placeholder={t("store.pickItem")}
            renderOption={(option) => {
              const entry = items.data?.find((o) => o.id === option.value)
              return entry ? (
                <ColoredItemName
                  name={entry.name}
                  factory={entry.factory?.name}
                />
              ) : (
                option.label
              )
            }}
            selectedStyle={item ? itemTextStyle(item.name) : undefined}
          />
          <div>
            <FormTextField
              control={form.control}
              name="quantity"
              label={
                kind === "ADJUST"
                  ? t("store.countedQuantity")
                  : t("store.quantity")
              }
              inputMode="decimal"
              placeholder={item ? unitLabel(item.unit) : undefined}
            />
            {item && (
              <p
                className="mt-1 text-xs text-muted-foreground"
                data-testid="store-in-stock"
              >
                {(warehouses.data ?? [])
                  .map((w) =>
                    t("store.inStoreStock", {
                      store: w.name,
                      quantity: formatQuantity(stockIn(w.id)),
                      unit: unitLabel(item.unit),
                    }),
                  )
                  .join(", ")}
              </p>
            )}
          </div>
          {kind === "ISSUE" && (
            <FormSearchSelectField
              control={form.control}
              name="villaId"
              label={t("store.villa")}
              options={villaOptions}
              loading={villas.isLoading}
              placeholder={t("store.pickVilla")}
              clearable
            />
          )}
          {kind !== "ADJUST" && kind !== "TRANSFER" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormTextField
                control={form.control}
                name="party"
                label={
                  kind === "RECEIVE" ? t("store.supplier") : t("store.receiver")
                }
                maxLength={120}
                dir="auto"
              />
              <FormTextField
                control={form.control}
                name="reference"
                label={t("store.reference")}
                maxLength={60}
                dir="auto"
              />
            </div>
          )}
          <FormTextareaField
            control={form.control}
            name="note"
            label={t("store.note")}
            maxLength={1000}
          />
        </form>
      </Form>
    </Modal>
  )
}
