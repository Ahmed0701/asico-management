import { useState } from "react"
import { useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import { toApiError } from "@/shared/api/errors"
import { toast } from "@/shared/lib/toast"
import ListToolbar, {
  clearedListParams,
  countActive,
} from "@/shared/list/ListToolbar"
import { setListParam } from "@/shared/query/listParams"
import Button from "@/shared/ui/Button"
import { FilterSelect } from "@/shared/ui/Field"
import { ConfirmModal } from "@/shared/ui/Modal"
import PageHeader from "@/shared/ui/PageHeader"
import {
  FACTORY_TYPES,
  useDeleteItemMutation,
  useItemsQuery,
  type FactoryType,
  type MaterialItem,
} from "../api"
import MaterialItemFormModal from "../components/MaterialItemFormModal"
import MaterialItemsTable from "../components/MaterialItemsTable"

type FormState = { item?: MaterialItem } | null

const isType = (value: string | null): value is FactoryType =>
  (FACTORY_TYPES as readonly string[]).includes(value ?? "")

/**
 * The materials list (like the elec phases): every material a villa can need, of the switchgear or the cable factories,
 * with its unit and the quantity each villa needs. Each villa's page reads it.
 */
export default function MaterialItemsPage() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const canEdit = can("materials:update")
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get("search") ?? ""
  const rawType = searchParams.get("type")
  const type = isType(rawType) ? rawType : undefined
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(setListParam(searchParams, key, value))
  const items = useItemsQuery()
  const remove = useDeleteItemMutation()
  const [form, setForm] = useState<FormState>(null)
  const [deleting, setDeleting] = useState<MaterialItem | null>(null)

  // The list is small (a few dozen materials): searched and filtered here.
  const term = search.trim().toLocaleLowerCase()
  const rows = (items.data ?? []).filter(
    (item) =>
      (!type || item.type === type) &&
      (!term || item.name.toLocaleLowerCase().includes(term)),
  )

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync({ id: deleting.id, version: deleting.version })
      toast.success(t("materials.itemDeleted", { name: deleting.name }))
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <PageHeader
        title={t("materials.items.title")}
        subtitle={t("materials.items.subtitle")}
      />
      <ListToolbar
        search={{
          value: search,
          onChange: (value) => setParam("search", value || undefined),
          placeholder: t("materials.items.searchPlaceholder"),
        }}
        count={rows.length}
        activeCount={countActive(search, type)}
        onClear={() => setSearchParams(clearedListParams(searchParams))}
        columns={2}
        actions={
          canEdit ? (
            <Button
              type="button"
              size="sm"
              variant="primary"
              icon="plus"
              onClick={() => setForm({})}
            >
              {t("materials.items.add")}
            </Button>
          ) : undefined
        }
      >
        <FilterSelect
          label={t("materials.type")}
          value={type ?? ""}
          onChange={(v) => setParam("type", v || undefined)}
          options={FACTORY_TYPES.map((value) => ({
            value,
            label: t(`materials.types.${value}`),
          }))}
        />
      </ListToolbar>

      {items.isError && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {toApiError(items.error).message}
        </p>
      )}

      <MaterialItemsTable
        rows={rows}
        loading={items.isLoading}
        canEdit={canEdit}
        onEdit={(item) => setForm({ item })}
        onDelete={setDeleting}
      />

      {form && (
        <MaterialItemFormModal item={form.item} onClose={() => setForm(null)} />
      )}
      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={t("materials.items.deleteTitle")}
        message={t("materials.items.deleteBody", {
          name: deleting?.name ?? "",
        })}
        confirmPending={remove.isPending}
      />
    </>
  )
}
