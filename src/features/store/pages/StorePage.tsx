import { useCallback, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import { toApiError } from "@/shared/api/errors"
import { downloadExport } from "@/shared/export/downloadExport"
import { ListExportMenu } from "@/shared/export/ListExportMenu"
import { IMPORT_RESOURCES, ImportWizardModal } from "@/shared/import"
import { SIDEBAR_COUNT_KEY } from "@/shared/layout/sidebarCountKey"
import { toast } from "@/shared/lib/toast"
import Button from "@/shared/ui/Button"
import { ConfirmModal } from "@/shared/ui/Modal"
import PageHeader from "@/shared/ui/PageHeader"
import Tabs from "@/shared/ui/Tabs"
import {
  buildStoreItemsQueryParams,
  buildStoreMovementsQueryParams,
  storeKeys,
  useDeleteStoreItemMutation,
  useStoreItemsQuery,
  useStoreMovementsQuery,
  useStoreWarehousesQuery,
  useUndoStoreMovementMutation,
  type StoreItem,
  type StoreMovement,
  type StoreMovementKind,
} from "../api"
import StoreItemFormModal from "../components/StoreItemFormModal"
import StoreItemsPanel from "../components/StoreItemsPanel"
import StoreMovementModal, {
  type StoreMovementPreset,
} from "../components/StoreMovementModal"
import StoreMovementsPanel from "../components/StoreMovementsPanel"
import StoreSummaryTiles from "../components/StoreSummaryTiles"
import { formatChange, unitLabel } from "../lib/storeFormat"
import { useStoreParams } from "../lib/useStoreParams"

const MOVE_BUTTONS: {
  kind: StoreMovementKind
  icon: "download" | "upload" | "edit"
  label: string
}[] = [
  { kind: "RECEIVE", icon: "download", label: "store.receive" },
  { kind: "ISSUE", icon: "upload", label: "store.issue" },
  { kind: "ADJUST", icon: "edit", label: "store.adjust" },
]

/**
 * The store: one of the two stores (Mutlaa, Khitan) at a time, its stock of every item and its movements (receipts, issues,
 * counts and transfers to the other store).
 */
export default function StorePage() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const qc = useQueryClient()
  const canCreate = can("store:create")
  const canMove = can("store:update")
  const canDelete = can("store:delete")
  const canImport = can("store:import")
  const params = useStoreParams()
  const { tab, view, setParam, setTab, setStore, clearFilters } = params
  const warehouses = useStoreWarehousesQuery()
  // The store the page shows: the one in the URL, or the first.
  const storeId = params.store ?? warehouses.data?.[0]?.id
  const store = warehouses.data?.find((w) => w.id === storeId)
  const items = { ...params.items, warehouseId: storeId }
  const movements = { ...params.movements, warehouseId: storeId }
  // The items query also brings the summary, so it runs on both tabs (the tiles are always shown).
  const itemsQuery = useStoreItemsQuery(items, storeId !== undefined)
  const movementsQuery = useStoreMovementsQuery(
    movements,
    tab === "movements" && storeId !== undefined,
  )
  const removeItem = useDeleteStoreItemMutation()
  const undo = useUndoStoreMovementMutation()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<StoreItem | undefined>()
  const [deleting, setDeleting] = useState<StoreItem | null>(null)
  const [undoing, setUndoing] = useState<StoreMovement | null>(null)
  const [moving, setMoving] = useState<StoreMovementPreset | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  // The export is of the tab on screen, in the store on screen, with its filters and sort.
  const onExport = useCallback(
    async (format: "xlsx" | "pdf", signal: AbortSignal) => {
      await downloadExport(
        tab === "stock"
          ? {
              path: "/store/items/export",
              query: buildStoreItemsQueryParams(items, { forExport: true }),
              format,
              filenameStem: "store-stock",
              signal,
            }
          : {
              path: "/store/movements/export",
              query: buildStoreMovementsQueryParams(movements, {
                forExport: true,
              }),
              format,
              filenameStem: "store-movements",
              signal,
            },
      )
    },
    [tab, items, movements],
  )
  const exportQuery = tab === "stock" ? itemsQuery : movementsQuery

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await removeItem.mutateAsync({
        id: deleting.id,
        version: deleting.version,
      })
      toast.success(t("store.itemDeleted", { name: deleting.name }))
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setDeleting(null)
    }
  }

  const confirmUndo = async () => {
    if (!undoing) return
    try {
      await undo.mutateAsync(undoing.id)
      toast.success(t("store.undone", { name: undoing.item.name }))
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setUndoing(null)
    }
  }

  const apiError = itemsQuery.isError ? toApiError(itemsQuery.error) : null

  return (
    <>
      <PageHeader
        title={t("store.title")}
        subtitle={t("store.subtitle")}
        actions={
          <div className="flex flex-wrap gap-2">
            {canMove &&
              storeId &&
              MOVE_BUTTONS.map((button) => (
                <Button
                  key={button.kind}
                  type="button"
                  size="sm"
                  icon={button.icon}
                  onClick={() =>
                    setMoving({ kind: button.kind, warehouseId: storeId })
                  }
                >
                  {t(button.label)}
                </Button>
              ))}
            {canImport && storeId && (
              <Button
                type="button"
                size="sm"
                icon="upload"
                onClick={() => setImportOpen(true)}
              >
                {t("store.import")}
              </Button>
            )}
            <ListExportMenu
              total={exportQuery.data?.meta.total}
              listLoading={exportQuery.isLoading}
              onExport={onExport}
            />
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
                {t("store.addItem")}
              </Button>
            )}
          </div>
        }
      />
      {warehouses.data && storeId && (
        <Tabs
          value={storeId}
          onChange={setStore}
          tabs={warehouses.data.map((w) => ({ id: w.id, label: w.name }))}
        />
      )}
      <StoreSummaryTiles summary={itemsQuery.data?.summary} />
      <Tabs
        value={tab}
        onChange={(next) => setTab(next)}
        tabs={[
          { id: "stock", label: t("store.tabs.stock") },
          { id: "movements", label: t("store.tabs.movements") },
        ]}
      />
      {apiError && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {apiError.message}
        </p>
      )}
      {tab === "stock" ? (
        <StoreItemsPanel
          params={items}
          view={view}
          data={itemsQuery.data}
          loading={itemsQuery.isLoading || storeId === undefined}
          storeId={storeId}
          setParam={setParam}
          onClear={clearFilters}
          canMove={canMove}
          canEdit={canMove}
          canDelete={canDelete}
          onMove={(item, kind) =>
            storeId &&
            setMoving({ kind, itemId: item.id, warehouseId: storeId })
          }
          onHistory={(item) => setTab("movements", { itemId: item.id })}
          onEdit={(item) => {
            setEditing(item)
            setFormOpen(true)
          }}
          onDelete={setDeleting}
        />
      ) : (
        <StoreMovementsPanel
          params={movements}
          data={movementsQuery.data}
          loading={movementsQuery.isLoading}
          setParam={setParam}
          onClear={clearFilters}
          canUndo={canMove}
          onUndo={setUndoing}
        />
      )}
      <StoreItemFormModal
        open={formOpen}
        item={editing}
        defaultWarehouseId={storeId}
        onClose={() => setFormOpen(false)}
      />
      <StoreMovementModal preset={moving} onClose={() => setMoving(null)} />
      {storeId && (
        <ImportWizardModal
          open={importOpen}
          onClose={() => setImportOpen(false)}
          config={{
            ...IMPORT_RESOURCES.store,
            importPath: `/store/import?warehouseId=${storeId}`,
          }}
          extraNote={t("store.importInto", { store: store?.name ?? "" })}
          onSuccess={() => {
            void qc.invalidateQueries({ queryKey: storeKeys.all })
            void qc.invalidateQueries({ queryKey: SIDEBAR_COUNT_KEY })
          }}
        />
      )}
      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={t("store.deleteTitle")}
        message={t("store.deleteBody", { name: deleting?.name ?? "" })}
        confirmLabel={t("common.delete")}
        confirmPending={removeItem.isPending}
      />
      <ConfirmModal
        open={undoing !== null}
        onClose={() => setUndoing(null)}
        onConfirm={confirmUndo}
        title={t("store.undoTitle")}
        message={t(
          undoing?.transfer ? "store.undoTransferBody" : "store.undoBody",
          {
            name: undoing?.item.name ?? "",
            change: undoing
              ? `${formatChange(undoing.change)} ${unitLabel(undoing.item.unit)}`
              : "",
          },
        )}
        confirmLabel={t("store.undo")}
        confirmPending={undo.isPending}
      />
    </>
  )
}
