import { useState } from "react"
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
import { Badge } from "@/shared/ui/Badge"
import Button, { IconButton } from "@/shared/ui/Button"
import { Form } from "@/shared/ui/form"
import { FormTextField } from "@/shared/ui/form-text-field"
import { FormFieldsSkeleton } from "@/shared/ui/loading-skeletons"
import { Input } from "@/shared/ui/input"
import Modal, { ConfirmModal } from "@/shared/ui/Modal"
import {
  STORE_FACTORY_CATEGORIES,
  useCreateStoreFactoryMutation,
  useDeleteStoreFactoryMutation,
  useRenameStoreFactoryMutation,
  useStoreFactoriesQuery,
  type StoreFactory,
} from "../api"
import { storeFactoryFormSchema, type StoreFactoryFormValues } from "../schema"
import { FormSelectField } from "./StoreFormFields"

type Props = {
  open: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  onClose: () => void
}

/** The factories of the wires and the boxes: add one, or delete one that no item comes from. */
export default function StoreFactoriesModal({
  open,
  canCreate,
  canEdit,
  canDelete,
  onClose,
}: Props) {
  if (!open) return null
  return (
    <Inner
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
      onClose={onClose}
    />
  )
}

function Inner({
  canCreate,
  canEdit,
  canDelete,
  onClose,
}: Omit<Props, "open">) {
  const { t } = useTranslation()
  const factories = useStoreFactoriesQuery()
  const create = useCreateStoreFactoryMutation()
  const remove = useDeleteStoreFactoryMutation()
  const rename = useRenameStoreFactoryMutation()
  const idempotency = useIdempotencyKey(true)
  const form = useForm<StoreFactoryFormValues>({
    resolver: zodResolver(storeFactoryFormSchema),
    defaultValues: { name: "", category: "WIRE" },
  })

  const add = form.handleSubmit(async (values) => {
    const name = values.name.trim()
    try {
      await create.mutateAsync({
        input: { name, category: values.category },
        write: idempotencyWrite(idempotency.getKey()),
      })
      idempotency.resetKey()
      form.reset({ name: "", category: values.category })
      toast.success(t("store.factoryAdded", { name }))
    } catch (err) {
      const parsed = toApiError(err)
      idempotency.markRejected()
      applyApiFieldErrors(parsed, form.setError)
      form.setError("name", {
        message: resolveWriteSafetyClientMessage(t, parsed),
      })
    }
  })

  // Renaming in place: the name becomes a field; Enter or leaving it saves, Escape cancels.
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const saveName = async (factory: StoreFactory) => {
    const name = editName.trim()
    setEditing(null)
    if (!name || name === factory.name) return
    try {
      await rename.mutateAsync({ id: factory.id, name })
      toast.success(t("store.factoryRenamed", { name }))
    } catch (err) {
      toast.error(toApiError(err).message)
    }
  }

  // Deleting asks first. A factory that items come from stays: the server says so.
  const [deleting, setDeleting] = useState<StoreFactory | null>(null)
  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync(deleting.id)
      toast.success(t("store.factoryDeleted", { name: deleting.name }))
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setDeleting(null)
    }
  }

  const categoryOptions = STORE_FACTORY_CATEGORIES.map((value) => ({
    value,
    label: t(`store.categoriesPlural.${value}`),
  }))

  return (
    <>
      <Modal open size="lg" onClose={onClose} title={t("store.factories")}>
        <div className="grid gap-5">
          {canCreate && (
            <Form {...form}>
              <form
                className="grid items-start gap-3 sm:grid-cols-[1fr_180px_auto]"
                onSubmit={(e) => void add(e)}
              >
                <FormTextField
                  control={form.control}
                  name="name"
                  label={t("store.factoryName")}
                  maxLength={80}
                  dir="auto"
                />
                <FormSelectField
                  control={form.control}
                  name="category"
                  label={t("store.category")}
                  options={categoryOptions}
                />
                <Button
                  type="submit"
                  variant="primary"
                  icon="plus"
                  className="sm:mt-6"
                  disabled={create.isPending}
                >
                  {t("store.addFactory")}
                </Button>
              </form>
            </Form>
          )}
          {STORE_FACTORY_CATEGORIES.map((category) => {
            const rows = (factories.data ?? []).filter(
              (factory) => factory.category === category,
            )
            return (
              <section key={category} className="grid gap-2">
                <h3 className="text-sm font-semibold">
                  {t(`store.categoriesPlural.${category}`)}
                </h3>
                {factories.isLoading ? (
                  <FormFieldsSkeleton fields={2} />
                ) : rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("store.noFactories")}
                  </p>
                ) : (
                  <ul className="divide-y divide-border rounded-lg border border-border">
                    {rows.map((factory) => (
                      <li
                        key={factory.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                      >
                        {editing === factory.id ? (
                          <Input
                            className="h-8 min-w-0 flex-1"
                            value={editName}
                            autoFocus
                            maxLength={80}
                            aria-label={t("store.factoryName")}
                            dir="auto"
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={() => void saveName(factory)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void saveName(factory)
                              if (e.key === "Escape") setEditing(null)
                            }}
                          />
                        ) : (
                          <span className="text-sm font-medium" dir="auto">
                            {factory.name}
                          </span>
                        )}
                        <span className="flex items-center gap-2">
                          <Badge>
                            {t("store.itemCount", { count: factory.itemCount })}
                          </Badge>
                          {canEdit && (
                            <IconButton
                              icon="edit"
                              label={t("store.editFactoryOf", {
                                name: factory.name,
                              })}
                              onClick={() => {
                                setEditing(factory.id)
                                setEditName(factory.name)
                              }}
                            />
                          )}
                          {canDelete && (
                            <IconButton
                              icon="trash"
                              variant="danger"
                              label={t("store.deleteFactoryOf", {
                                name: factory.name,
                              })}
                              onClick={() => setDeleting(factory)}
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
      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={t("store.deleteFactoryTitle")}
        message={t("store.deleteFactoryBody", { name: deleting?.name ?? "" })}
        confirmLabel={t("common.delete")}
        confirmPending={remove.isPending}
      />
    </>
  )
}
