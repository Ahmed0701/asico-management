import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { applyApiFieldErrors } from "@/features/auth/api/formErrors"
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
  STORE_CATEGORIES,
  STORE_UNITS,
  useCreateStoreItemNameMutation,
  useUpdateStoreItemNameMutation,
  type StoreItemName,
  type StoreItemNameUpdate,
  useStoreFactoriesQuery,
} from "../api"
import { unitLabel } from "../lib/storeFormat"
import {
  storeItemNameFormSchema,
  type StoreItemNameFormValues,
} from "../schema"
import { FormSelectField } from "./StoreFormFields"

/** Adds a name to the items reference list, in a category. The add-item form picks names from that list. */
type Props = {
  open: boolean
  /** The item to change; missing: a new one. */
  entry?: StoreItemName
  onClose: () => void
}

export default function ItemReferenceFormModal({
  open,
  entry,
  onClose,
}: Props) {
  if (!open) return null
  return <Inner key={entry?.id ?? "new"} entry={entry} onClose={onClose} />
}

function Inner({ entry, onClose }: Omit<Props, "open">) {
  const { t } = useTranslation()
  const create = useCreateStoreItemNameMutation()
  const update = useUpdateStoreItemNameMutation()
  const idempotency = useIdempotencyKey(true)
  const form = useForm<StoreItemNameFormValues>({
    resolver: zodResolver(storeItemNameFormSchema),
    defaultValues: {
      name: entry?.name ?? "",
      category: entry?.category ?? "WIRE",
      factoryId: entry?.factory?.id ?? "",
      unit: entry?.unit ?? "Pcs",
    },
  })
  const factories = useStoreFactoriesQuery()
  const category = form.watch("category")
  const factoryId = form.watch("factoryId")
  // Only a wire has a factory.
  useEffect(() => {
    if (category !== "WIRE" && factoryId) form.setValue("factoryId", "")
  }, [category, factoryId, form])

  const submit = form.handleSubmit(async (values) => {
    const name = values.name.trim()
    const fields = {
      name,
      category: values.category,
      factoryId: values.category === "WIRE" ? values.factoryId : null,
      unit: values.unit,
    }
    try {
      if (entry) {
        // Only what changed is sent.
        const patch: StoreItemNameUpdate = {}
        if (fields.name !== entry.name) patch.name = fields.name
        if (fields.category !== entry.category) patch.category = fields.category
        if (fields.factoryId !== (entry.factory?.id ?? null))
          patch.factoryId = fields.factoryId
        if (fields.unit !== entry.unit) patch.unit = fields.unit
        if (Object.keys(patch).length > 0) {
          await update.mutateAsync({ id: entry.id, input: patch })
          toast.success(t("store.itemNameSaved", { name }))
        }
      } else {
        await create.mutateAsync({
          input: fields,
          write: idempotencyWrite(idempotency.getKey()),
        })
        idempotency.resetKey()
        toast.success(t("store.itemNameAdded", { name }))
      }
      onClose()
    } catch (err) {
      const parsed = toApiError(err)
      idempotency.markRejected()
      applyApiFieldErrors(parsed, form.setError)
      form.setError("name", {
        message: resolveWriteSafetyClientMessage(t, parsed),
      })
    }
  })

  const categoryOptions = STORE_CATEGORIES.map((value) => ({
    value,
    label: t(`store.categories.${value}`),
  }))

  return (
    <Modal
      open
      onClose={create.isPending || update.isPending ? () => {} : onClose}
      title={entry ? t("store.editItemName") : t("store.addItemName")}
      footer={
        <>
          <Button
            type="button"
            onClick={onClose}
            disabled={create.isPending || update.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="item-reference-form"
            variant="primary"
            disabled={create.isPending || update.isPending}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id="item-reference-form"
          className="space-y-4"
          onSubmit={(e) => void submit(e)}
        >
          <FormTextField
            control={form.control}
            name="name"
            label={t("store.itemName")}
            maxLength={120}
            dir="auto"
          />
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
              options={STORE_UNITS.map((value) => ({
                value,
                label: unitLabel(value),
              }))}
            />
          </div>
          {category === "WIRE" && (
            <FormSelectField
              control={form.control}
              name="factoryId"
              label={t("store.factory")}
              options={(factories.data ?? [])
                .filter((factory) => factory.category === "WIRE")
                .map((factory) => ({ value: factory.id, label: factory.name }))}
              placeholder={t("store.pickFactory")}
            />
          )}
        </form>
      </Form>
    </Modal>
  )
}
