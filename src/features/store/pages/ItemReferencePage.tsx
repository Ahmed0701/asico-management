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
  STORE_CATEGORIES,
  useDeleteStoreItemNameMutation,
  useStoreItemNamesQuery,
  type StoreCategory,
  type StoreItemName,
} from "../api"
import ItemReferenceFormModal from "../components/ItemReferenceFormModal"
import ItemReferenceTable from "../components/ItemReferenceTable"
import StoreFactoriesModal from "../components/StoreFactoriesModal"

const isCategory = (value: string | null): value is StoreCategory =>
  (STORE_CATEGORIES as readonly string[]).includes(value ?? "")

/**
 * The items reference list: the names items can be given, by category. Adding an item picks its name from this list;
 * removing a name does not rename the items that have it.
 */
export default function ItemReferencePage() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const canCreate = can("store:create")
  const canEdit = can("store:update")
  const canDelete = can("store:delete")
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get("search") ?? ""
  const rawCategory = searchParams.get("category")
  const category = isCategory(rawCategory) ? rawCategory : undefined
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(setListParam(searchParams, key, value))
  const names = useStoreItemNamesQuery()
  const remove = useDeleteStoreItemNameMutation()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<StoreItemName | undefined>()
  const [factoriesOpen, setFactoriesOpen] = useState(false)
  const [deleting, setDeleting] = useState<StoreItemName | null>(null)

  // The list is small: searched and filtered here.
  const term = search.trim().toLocaleLowerCase()
  const rows = (names.data ?? []).filter(
    (entry) =>
      (!category || entry.category === category) &&
      (!term || entry.name.toLocaleLowerCase().includes(term)),
  )

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync(deleting.id)
      toast.success(t("store.itemNameDeleted", { name: deleting.name }))
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <PageHeader
        title={t("store.itemReference.title")}
        subtitle={t("store.itemReference.subtitle")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              icon="hardhat"
              onClick={() => setFactoriesOpen(true)}
            >
              {t("store.factories")}
            </Button>
            {canCreate && (
              <Button
                type="button"
                size="sm"
                variant="primary"
                icon="plus"
                onClick={() => {
                  setEditing(undefined)
                  setFormOpen(true)
                }}
              >
                {t("store.addItemName")}
              </Button>
            )}
          </div>
        }
      />
      <ListToolbar
        search={{
          value: search,
          onChange: (value) => setParam("search", value || undefined),
          placeholder: t("store.searchItemNames"),
        }}
        count={rows.length}
        activeCount={countActive(search, category)}
        onClear={() => setSearchParams(clearedListParams(searchParams))}
        columns={2}
      >
        <FilterSelect
          label={t("store.category")}
          value={category ?? ""}
          onChange={(value) => setParam("category", value || undefined)}
          options={STORE_CATEGORIES.map((value) => ({
            value,
            label: t(`store.categories.${value}`),
          }))}
        />
      </ListToolbar>
      {names.isError && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {toApiError(names.error).message}
        </p>
      )}
      <ItemReferenceTable
        rows={rows}
        loading={names.isLoading}
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={(entry) => {
          setEditing(entry)
          setFormOpen(true)
        }}
        onDelete={setDeleting}
      />
      <StoreFactoriesModal
        open={factoriesOpen}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        onClose={() => setFactoriesOpen(false)}
      />
      <ItemReferenceFormModal
        open={formOpen}
        entry={editing}
        onClose={() => setFormOpen(false)}
      />
      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={t("store.deleteItemNameTitle")}
        message={t("store.deleteItemNameBody", { name: deleting?.name ?? "" })}
        confirmLabel={t("common.delete")}
        confirmPending={remove.isPending}
      />
    </>
  )
}
