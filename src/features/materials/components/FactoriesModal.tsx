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
  useCreateFactoryMutation,
  useDeleteFactoryMutation,
  useFactoriesQuery,
  useRenameFactoryMutation,
  type Factory,
  type FactoryType,
} from "../api"

/** The switchgear and cable factories: add one, rename one, or delete one that has no deliveries. */
export default function FactoriesModal({
  open,
  canEdit,
  onClose,
}: {
  open: boolean
  canEdit: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const factories = useFactoriesQuery(open)
  const create = useCreateFactoryMutation()
  const rename = useRenameFactoryMutation()
  const remove = useDeleteFactoryMutation()
  const idempotency = useIdempotencyKey(true)
  const [name, setName] = useState("")
  const [type, setType] = useState<FactoryType>("SWITCHGEAR")
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  if (!open) return null

  const add = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) {
      setError(t("materials.errors.factoryName"))
      return
    }
    try {
      await create.mutateAsync({
        input: { name: trimmed, type },
        write: idempotencyWrite(idempotency.getKey()),
      })
      idempotency.resetKey()
      setName("")
      toast.success(t("materials.factoryAdded", { name: trimmed }))
    } catch (err) {
      idempotency.markRejected()
      setError(toApiError(err).message)
    }
  }

  const saveName = async (factory: Factory) => {
    const trimmed = editName.trim()
    if (!trimmed || trimmed === factory.name) {
      setEditing(null)
      return
    }
    try {
      await rename.mutateAsync({
        id: factory.id,
        name: trimmed,
        version: factory.version,
      })
      setEditing(null)
    } catch (err) {
      toast.error(toApiError(err).message)
    }
  }

  const drop = async (factory: Factory) => {
    try {
      await remove.mutateAsync({ id: factory.id, version: factory.version })
      toast.success(t("materials.factoryDeleted", { name: factory.name }))
    } catch (err) {
      toast.error(toApiError(err).message)
    }
  }

  return (
    <Modal open size="lg" onClose={onClose} title={t("materials.factories")}>
      <div className="grid gap-5">
        {canEdit && (
          <form
            className="grid items-end gap-3 sm:grid-cols-[1fr_180px_auto]"
            onSubmit={add}
          >
            <Input
              label={t("materials.factoryName")}
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
            <Button
              type="submit"
              variant="primary"
              icon="plus"
              disabled={create.isPending}
            >
              {t("materials.addFactory")}
            </Button>
            {error && (
              <p role="alert" className="text-sm text-danger sm:col-span-3">
                {error}
              </p>
            )}
          </form>
        )}
        {FACTORY_TYPES.map((group) => {
          const items = (factories.data ?? []).filter((f) => f.type === group)
          return (
            <section key={group} className="grid gap-2">
              <h3 className="text-sm font-semibold">
                {t(`materials.typesPlural.${group}`)}
              </h3>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("materials.noFactories")}
                </p>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {items.map((factory) => (
                    <li
                      key={factory.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                    >
                      {editing === factory.id ? (
                        <input
                          className="h-8 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm"
                          value={editName}
                          autoFocus
                          aria-label={t("materials.factoryName")}
                          dir="auto"
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => void saveName(factory)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void saveName(factory)
                            if (e.key === "Escape") setEditing(null)
                          }}
                        />
                      ) : (
                        <span className="text-sm" dir="auto">
                          {factory.name}
                        </span>
                      )}
                      <span className="flex items-center gap-2">
                        <Badge tone="neutral">
                          {t("materials.deliveryCount", {
                            count: factory.deliveryCount,
                          })}
                        </Badge>
                        {canEdit && (
                          <IconButton
                            icon="edit"
                            label={t("common.edit")}
                            onClick={() => {
                              setEditing(factory.id)
                              setEditName(factory.name)
                            }}
                          />
                        )}
                        {canEdit && factory.deliveryCount === 0 && (
                          <IconButton
                            icon="trash"
                            label={t("common.delete")}
                            variant="danger"
                            onClick={() => void drop(factory)}
                          />
                        )}
                      </span>
                    </li>
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
