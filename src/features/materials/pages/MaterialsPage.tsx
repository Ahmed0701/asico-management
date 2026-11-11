import { useCallback, useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import VillasListFooter from "@/features/villas/components/VillasListFooter"
import { toApiError } from "@/shared/api/errors"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import { normalizeSearchInput } from "@/shared/lib/phone/phoneNormalize"
import { toast } from "@/shared/lib/toast"
import { parseListParams, setListParam } from "@/shared/query/listParams"
import Button from "@/shared/ui/Button"
import { FilterSelect, SearchInput } from "@/shared/ui/Field"
import { ConfirmModal } from "@/shared/ui/Modal"
import PageHeader from "@/shared/ui/PageHeader"
import Tabs from "@/shared/ui/Tabs"
import { downloadExport } from "@/shared/export/downloadExport"
import { ImportWizardModal, IMPORT_RESOURCES } from "@/shared/import"
import ListPageHeaderActions from "@/shared/list/ListPageHeaderActions"
import {
  BALANCE_STATUSES,
  buildBalanceQueryParams,
  buildDeliveriesQueryParams,
  FACTORY_TYPES,
  materialsKeys,
  useDeleteDeliveryMutation,
  useDeliveriesQuery,
  useFactoriesQuery,
  useItemsQuery,
  type BalanceStatus,
  type DeliveriesListParams,
  type FactoryType,
  type MaterialDelivery,
} from "../api"
import BalancePanel, { type ListState } from "../components/BalancePanel"
import CatalogModal from "../components/CatalogModal"
import DeliveriesTable from "../components/DeliveriesTable"
import DeliveryFormModal from "../components/DeliveryFormModal"
import FactoriesModal from "../components/FactoriesModal"

type MaterialsTab = "deliveries" | "balance"

/** The deliveries from the switchgear and cable factories, and the balance of what every villa still waits for. */
export default function MaterialsPage() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const canCreate = can("materials:create")
  const canUpdate = can("materials:update")
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: MaterialsTab =
    searchParams.get("tab") === "balance" ? "balance" : "deliveries"
  const [factoriesOpen, setFactoriesOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [listState, setListState] = useState<ListState>({
    total: undefined,
    loading: true,
  })
  const qc = useQueryClient()

  // The file holds what the open tab lists, with its filters (no paging): the deliveries one row per material, or the balance.
  const onExport = useCallback(
    async (format: "xlsx" | "pdf", signal: AbortSignal) => {
      const base = parseListParams(searchParams, { limit: 20 })
      const type = searchParams.get("type") as FactoryType | null
      const filters = {
        page: 1,
        limit: 20,
        search: base.search || undefined,
        itemId: searchParams.get("itemId") || undefined,
        type: type && FACTORY_TYPES.includes(type) ? type : undefined,
      }
      const query =
        tab === "balance"
          ? buildBalanceQueryParams({
              ...filters,
              status:
                searchParams.get("status") === "all"
                  ? undefined
                  : BALANCE_STATUSES.includes(
                        searchParams.get("status") as BalanceStatus,
                      )
                    ? searchParams.get("status") as BalanceStatus
                    : "PENDING",
            })
          : buildDeliveriesQueryParams({
              ...filters,
              factoryId: searchParams.get("factoryId") || undefined,
              hasNote:
                searchParams.get("hasNote") === "true"
                  ? true
                  : searchParams.get("hasNote") === "false"
                    ? false
                    : undefined,
            })
      delete query.page
      delete query.limit
      await downloadExport({
        path:
          tab === "balance"
            ? "/material-balance/export"
            : "/material-deliveries/export",
        query,
        format,
        filenameStem:
          tab === "balance" ? "material-balance" : "material-deliveries",
        signal,
      })
    },
    [searchParams, tab],
  )

  const switchTab = (next: MaterialsTab) => {
    const params = new URLSearchParams()
    if (next === "balance") params.set("tab", "balance")
    setSearchParams(params)
  }

  return (
    <>
      <PageHeader
        title={t("materials.title")}
        subtitle={t("materials.subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ListPageHeaderActions
              showImport={canCreate && tab === "deliveries"}
              importLabel={t("materials.import")}
              importAction={
                canCreate && tab === "deliveries"
                  ? {
                      kind: "button",
                      label: t("materials.import"),
                      onClick: () => setImportOpen(true),
                    }
                  : undefined
              }
              exportAction={{
                kind: "menu",
                total: listState.total,
                listLoading: listState.loading,
                onExport,
              }}
            />
            <Button
              type="button"
              size="sm"
              icon="log"
              onClick={() => setCatalogOpen(true)}
            >
              {t("materials.catalog")}
            </Button>
            <Button
              type="button"
              size="sm"
              icon="hardhat"
              onClick={() => setFactoriesOpen(true)}
            >
              {t("materials.factories")}
            </Button>
            {canCreate && (
              <Button
                type="button"
                size="sm"
                variant="primary"
                icon="plus"
                onClick={() => setFormOpen(true)}
              >
                {t("materials.add")}
              </Button>
            )}
          </div>
        }
      />
      <div className="mb-4">
        <Tabs
          value={tab}
          onChange={switchTab}
          tabs={[
            { id: "deliveries" as const, label: t("materials.tabDeliveries") },
            { id: "balance" as const, label: t("materials.tabBalance") },
          ]}
        />
      </div>
      {tab === "deliveries" ? (
        <DeliveriesTab onListState={setListState} />
      ) : (
        <BalancePanel onListState={setListState} />
      )}
      <DeliveryFormModal open={formOpen} onClose={() => setFormOpen(false)} />
      <FactoriesModal
        open={factoriesOpen}
        canEdit={canUpdate}
        onClose={() => setFactoriesOpen(false)}
      />
      <ImportWizardModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        config={IMPORT_RESOURCES["material-deliveries"]}
        onSuccess={() =>
          void qc.invalidateQueries({ queryKey: materialsKeys.all })
        }
      />
      <CatalogModal
        open={catalogOpen}
        canEdit={canUpdate}
        onClose={() => setCatalogOpen(false)}
      />
    </>
  )
}

function DeliveriesTab({
  onListState,
}: {
  onListState?: (state: ListState) => void
}) {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const canUpdate = can("materials:update")
  const canDelete = can("materials:delete")
  const [searchParams, setSearchParams] = useSearchParams()
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(setListParam(searchParams, key, value))
  const params = useMemo<DeliveriesListParams>(() => {
    const base = parseListParams(searchParams, { limit: 20 })
    const type = searchParams.get("type")
    const hasNote = searchParams.get("hasNote")
    return {
      page: base.page,
      limit: base.limit,
      search: base.search || undefined,
      factoryId: searchParams.get("factoryId") || undefined,
      itemId: searchParams.get("itemId") || undefined,
      type: FACTORY_TYPES.includes(type as FactoryType)
        ? type as FactoryType
        : undefined,
      hasNote:
        hasNote === "true" ? true : hasNote === "false" ? false : undefined,
    }
  }, [searchParams])
  const { data, isLoading, isError, error, refetch } =
    useDeliveriesQuery(params)
  const factories = useFactoriesQuery()

  // The page's Export button needs the number of rows the filters match.
  useEffect(() => {
    onListState?.({ total: data?.meta.total, loading: isLoading })
  }, [onListState, data?.meta.total, isLoading])
  const catalog = useItemsQuery()
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    normalizeSearchInput,
  )
  const remove = useDeleteDeliveryMutation()
  const [editing, setEditing] = useState<MaterialDelivery | undefined>()
  const [deleting, setDeleting] = useState<MaterialDelivery | null>(null)

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync({ id: deleting.id, version: deleting.version })
      toast.success(t("materials.deleted"))
    } catch (err) {
      toast.error(toApiError(err).message)
      void refetch()
    } finally {
      setDeleting(null)
    }
  }

  const rows = data?.data ?? []
  const meta = data?.meta
  const byType = <T extends { type: FactoryType }>(list: T[]) =>
    list.filter((x) => !params.type || x.type === params.type)

  return (
    <>
      <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_repeat(4,170px)] lg:items-end">
        <SearchInput
          value={searchDraft}
          onChange={setSearchDraft}
          placeholder={t("materials.searchPlaceholder")}
        />
        <FilterSelect
          label={t("materials.type")}
          value={params.type ?? ""}
          onChange={(v) => {
            const next = setListParam(searchParams, "type", v || undefined)
            next.delete("factoryId")
            next.delete("itemId")
            setSearchParams(next)
          }}
          options={FACTORY_TYPES.map((type) => ({
            value: type,
            label: t(`materials.types.${type}`),
          }))}
        />
        <FilterSelect
          label={t("materials.material")}
          value={params.itemId ?? ""}
          onChange={(v) => setParam("itemId", v || undefined)}
          options={byType(catalog.data ?? []).map((i) => ({
            value: i.id,
            label: i.name,
          }))}
        />
        <FilterSelect
          label={t("materials.factory")}
          value={params.factoryId ?? ""}
          onChange={(v) => setParam("factoryId", v || undefined)}
          options={byType(factories.data ?? []).map((f) => ({
            value: f.id,
            label: f.name,
          }))}
        />
        <FilterSelect
          label={t("materials.deliveryNote")}
          value={params.hasNote === undefined ? "" : String(params.hasNote)}
          onChange={(v) => setParam("hasNote", v || undefined)}
          options={[
            { value: "true", label: t("materials.withNote") },
            { value: "false", label: t("materials.withoutNote") },
          ]}
        />
      </div>
      {isError && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {toApiError(error).message}
        </p>
      )}
      <DeliveriesTable
        rows={rows}
        isLoading={isLoading}
        showVilla
        canUpdate={canUpdate}
        canDelete={canDelete}
        emptyText={t("materials.empty")}
        onEdit={setEditing}
        onDelete={setDeleting}
      />
      {meta && (
        <VillasListFooter
          meta={meta}
          onPageChange={(page) =>
            setSearchParams(setListParam(searchParams, "page", page))
          }
          onPageSizeChange={(limit) =>
            setSearchParams(setListParam(searchParams, "limit", limit))
          }
          onGoLastPage={() =>
            setSearchParams(setListParam(searchParams, "page", meta.totalPages))
          }
        />
      )}
      {meta && (
        <p className="mt-3 text-sm text-muted-foreground">
          {t("materials.count", { count: meta.total })}
        </p>
      )}
      <DeliveryFormModal
        open={editing !== undefined}
        item={editing}
        onClose={() => setEditing(undefined)}
      />
      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={t("materials.deleteTitle")}
        message={t("materials.deleteBody", {
          date: deleting?.deliveryDate ?? "",
          villa: deleting?.villa.villaNumber ?? "",
        })}
        confirmLabel={t("common.delete")}
        confirmPending={remove.isPending}
      />
    </>
  )
}
