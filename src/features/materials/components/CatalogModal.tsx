import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { toApiError } from "@/shared/api/errors"
import { idempotencyWrite, useIdempotencyKey } from "@/shared/api/write-safety"
import { toast } from "@/shared/lib/toast"
import { Badge } from "@/shared/ui/Badge"
import Button, { IconButton } from "@/shared/ui/Button"
import { Input, Select } from "@/shared/ui/Field"
import Modal from "@/shared/ui/Modal"
import {
  FACTORY_TYPES,
  useCreateItemMutation,
  useDeleteItemMutation,
  useItemsQuery,
  useUpdateItemMutation,
  type FactoryType,
  type MaterialItem,
} from "../api"
import { formatQuantity } from "./DeliveriesTable"

const quantityOk = (text: string): boolean => {
  const value = Number(text)
  return (
    text.trim() !== "" && value >= 0 && Math.round(value * 100) === value * 100
  )
}

/**
 * The catalog of materials the deliveries are ticked from, one list per factory type. "Required per villa" is what every
 * villa needs of it (a villa can differ on its page); the balance is that minus what came.
 */
export default function CatalogModal({
  open,
  canEdit,
  onClose,
}: {
  open: boolean
  canEdit: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const catalog = useItemsQuery(open)
  const create = useCreateItemMutation()
  const idempotency = useIdempotencyKey(true)
  const [name, setName] = useState("")
  const [type, setType] = useState<FactoryType>("SWITCHGEAR")
  const [unit, setUnit] = useState("pcs")
  const [required, setRequired] = useState("0")
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const add = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!name.trim() || !unit.trim()) {
      setError(t("materials.errors.itemName"))
      return
    }
    if (!quantityOk(required)) {
      setError(t("materials.errors.required"))
      return
    }
    try {
      await create.mutateAsync({
        input: {
          name: name.trim(),
          type,
          unit: unit.trim(),
          requiredPerVilla: Number(required),
        },
        write: idempotencyWrite(idempotency.getKey()),
      })
      idempotency.resetKey()
      toast.success(t("materials.itemAdded", { name: name.trim() }))
      setName("")
      setRequired("0")
    } catch (err) {
      idempotency.markRejected()
      setError(toApiError(err).message)
    }
  }

  return (
    <Modal open size="lg" onClose={onClose} title={t("materials.catalogTitle")}>
      <div className="grid gap-5">
        <p className="text-sm text-muted-foreground">
          {t("materials.catalogHelp")}
        </p>
        {canEdit && (
          <form
            className="grid items-end gap-3 sm:grid-cols-[1fr_140px_90px_110px_auto]"
            onSubmit={add}
          >
            <Input
              label={t("materials.itemName")}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
              maxLength={120}
              dir="auto"
            />
            <Select
              label={t("materials.type")}
              value={type}
              onChange={(e) => setType(e.target.value as FactoryType)}
              options={FACTORY_TYPES.map((value) => ({
                value,
                label: t(`materials.types.${value}`),
              }))}
            />
            <Input
              label={t("materials.unit")}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              maxLength={20}
            />
            <Input
              label={t("materials.requiredPerVilla")}
              type="number"
              min="0"
              step="0.01"
              value={required}
              onChange={(e) => setRequired(e.target.value)}
            />
            <Button
              type="submit"
              variant="primary"
              icon="plus"
              disabled={create.isPending}
            >
              {t("materials.addItem")}
            </Button>
            {error && (
              <p role="alert" className="text-sm text-danger sm:col-span-5">
                {error}
              </p>
            )}
          </form>
        )}
        {FACTORY_TYPES.map((group) => {
          const items = (catalog.data ?? []).filter((i) => i.type === group)
          return (
            <section key={group} className="grid gap-2">
              <h3 className="text-sm font-semibold">
                {t(`materials.typesPlural.${group}`)}
              </h3>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("materials.noItems")}
                </p>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {items.map((item) => (
                    <CatalogRow key={item.id} item={item} canEdit={canEdit} />
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </Modal>
  )
}

function CatalogRow({
  item,
  canEdit,
}: {
  item: MaterialItem
  canEdit: boolean
}) {
  const { t } = useTranslation()
  const update = useUpdateItemMutation()
  const remove = useDeleteItemMutation()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const [unit, setUnit] = useState(item.unit)
  const [required, setRequired] = useState(String(item.requiredPerVilla))

  const save = async () => {
    if (!name.trim() || !unit.trim() || !quantityOk(required)) {
      toast.error(t("materials.errors.required"))
      return
    }
    try {
      await update.mutateAsync({
        id: item.id,
        input: {
          name: name.trim(),
          unit: unit.trim(),
          requiredPerVilla: Number(required),
        },
        version: item.version,
      })
      setEditing(false)
    } catch (err) {
      toast.error(toApiError(err).message)
    }
  }

  const drop = async () => {
    try {
      await remove.mutateAsync({ id: item.id, version: item.version })
      toast.success(t("materials.itemDeleted", { name: item.name }))
    } catch (err) {
      toast.error(toApiError(err).message)
    }
  }

  if (editing) {
    return (
      <li className="grid items-center gap-2 px-3 py-2 sm:grid-cols-[1fr_80px_100px_auto]">
        <input
          className="h-8 min-w-0 rounded-md border border-border bg-background px-2 text-sm"
          aria-label={t("materials.itemName")}
          value={name}
          dir="auto"
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="h-8 rounded-md border border-border bg-background px-2 text-sm"
          aria-label={t("materials.unit")}
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        />
        <input
          type="number"
          min="0"
          step="0.01"
          className="h-8 rounded-md border border-border bg-background px-2 text-end text-sm tabular-nums"
          aria-label={t("materials.requiredPerVilla")}
          value={required}
          onChange={(e) => setRequired(e.target.value)}
        />
        <span className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="primary"
            disabled={update.isPending}
            onClick={() => void save()}
          >
            {t("common.save")}
          </Button>
          <Button type="button" size="sm" onClick={() => setEditing(false)}>
            {t("common.cancel")}
          </Button>
        </span>
      </li>
    )
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
      <span className="text-sm" dir="auto">
        {item.name}
      </span>
      <span className="flex items-center gap-2">
        <Badge tone={item.requiredPerVilla > 0 ? "info" : "neutral"}>
          {t("materials.perVilla", {
            quantity: formatQuantity(item.requiredPerVilla, item.unit),
          })}
        </Badge>
        <Badge tone="neutral">
          {t("materials.lineCount", { count: item.lineCount })}
        </Badge>
        {canEdit && (
          <IconButton
            icon="edit"
            label={t("common.edit")}
            onClick={() => setEditing(true)}
          />
        )}
        {canEdit && item.lineCount === 0 && (
          <IconButton
            icon="trash"
            label={t("common.delete")}
            variant="danger"
            onClick={() => void drop()}
          />
        )}
      </span>
    </li>
  )
}
