import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import { toApiError } from "@/shared/api/errors"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import { normalizeSearchInput } from "@/shared/lib/phone/phoneNormalize"
import { SearchInput } from "@/shared/ui/Field"
import { ConfirmModal } from "@/shared/ui/Modal"
import PageHeader from "@/shared/ui/PageHeader"
import { downloadExport } from "@/shared/export/downloadExport"
import { ImportWizardModal, IMPORT_RESOURCES } from "@/shared/import"
import ListPageHeaderActions from "@/shared/list/ListPageHeaderActions"
import { invalidateVillaListsAndDashboard } from "../lib/villaQueryCache"
import {
  buildVillasQueryParams,
  hasActiveVillaListFilters,
  useDeleteVillaMutation,
  useVillasListParams,
  useVillasListQuery,
  type VillaListItem,
} from "../api"
import VillaFormModal from "../components/VillaFormModal"
import VillaListFiltersBar from "../components/VillaListFiltersBar"
import VillasListErrorBanner from "../components/VillasListErrorBanner"
import VillasListFooter from "../components/VillasListFooter"
import VillasTable from "../components/VillasTable"

export default function VillasPage() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const { params, setParam, setPage, setLimit, clearFilters } =
    useVillasListParams()
  const { data, isLoading, isError, error, refetch } = useVillasListQuery()
  const remove = useDeleteVillaMutation()
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    normalizeSearchInput,
  )
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | undefined>()
  const [deleting, setDeleting] = useState<VillaListItem | null>(null)
  const [savedBanner, setSavedBanner] = useState(false)
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null)

  const canCreate = can("villas:create")
  const canUpdate = can("villas:update")
  const canDelete = can("villas:delete")
  const canLinkDetail = can("villas:detail")
  const canExport = can("villas:export")
  const canImport = can("villas:import")
  const qc = useQueryClient()
  const [importOpen, setImportOpen] = useState(false)

  const onExport = useCallback(
    async (format: "xlsx" | "pdf", signal: AbortSignal) => {
      await downloadExport({
        path: "/villas/export",
        query: buildVillasQueryParams(params, { forExport: true }),
        format,
        filenameStem: "villas",
        signal,
      })
    },
    [params],
  )

  const rows = data?.data ?? []
  const meta = data?.meta
  const apiError = isError ? toApiError(error) : null
  const showGlobalError = useMemo(
    () =>
      apiError &&
      (apiError.status === 403 ||
        apiError.status >= 500 ||
        apiError.code === "NETWORK_ERROR"),
    [apiError],
  )

  const openCreate = () => {
    setEditId(undefined)
    setFormOpen(true)
  }
  const openEdit = (row: VillaListItem) => {
    setEditId(row.id)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteNotice(null)
    try {
      await remove.mutateAsync({
        id: deleting.id,
        write: { ifMatch: deleting.version },
      })
      setDeleting(null)
    } catch (err) {
      const parsed = toApiError(err)
      if (parsed.code === "VILLA_NOT_FOUND" || parsed.status === 404) {
        setDeleteNotice(t("villas.deleteAlreadyGone"))
        setDeleting(null)
        void refetch()
        return
      }
      setDeleteNotice(parsed.message)
    }
  }

  const activeFilters = hasActiveVillaListFilters(params)

  return (
    <>
      <PageHeader
        title={t("villas.title")}
        subtitle={t("villas.subtitle")}
        actions={
          canCreate || canExport || canImport ? (
            <ListPageHeaderActions
              showImport={canImport}
              importLabel={t("villas.import")}
              importAction={
                canImport
                  ? {
                      kind: "button",
                      label: t("villas.import"),
                      onClick: () => setImportOpen(true),
                    }
                  : undefined
              }
              exportAction={
                canExport
                  ? {
                      kind: "menu",
                      total: meta?.total,
                      listLoading: isLoading,
                      onExport,
                    }
                  : undefined
              }
              add={
                canCreate
                  ? { label: t("villas.add"), onClick: openCreate }
                  : undefined
              }
            />
          ) : undefined
        }
      />
      {savedBanner && (
        <p className="mb-3 rounded-lg bg-closed-soft px-3 py-2 text-sm text-closed">
          {t("common.saved")}
        </p>
      )}
      {deleteNotice && (
        <p role="status" className="mb-3 rounded-lg bg-muted px-3 py-2 text-sm">
          {deleteNotice}
        </p>
      )}
      {activeFilters && (
        <p className="mb-3 text-sm text-muted-foreground">
          {t("villas.filteredListHint")}{" "}
          <button
            type="button"
            className="text-accent hover:underline"
            onClick={clearFilters}
          >
            {t("common.clearFilters")}
          </button>
        </p>
      )}
      <div className="mb-3">
        <SearchInput
          value={searchDraft}
          onChange={setSearchDraft}
          placeholder={t("villas.searchPlaceholder")}
        />
      </div>
      <VillaListFiltersBar params={params} setParam={setParam} />
      <VillasListErrorBanner
        error={showGlobalError ? apiError : null}
        onRetry={() => void refetch()}
      />
      <VillasTable
        rows={rows}
        isLoading={isLoading && !data}
        canUpdate={canUpdate}
        canDelete={canDelete}
        canLinkDetail={canLinkDetail}
        onEdit={openEdit}
        onDelete={setDeleting}
      />
      {meta && (
        <VillasListFooter
          meta={meta}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          onGoLastPage={() => setPage(meta.totalPages)}
        />
      )}
      <VillaFormModal
        open={formOpen}
        villaId={editId}
        onClose={() => setFormOpen(false)}
        onSaved={() => setSavedBanner(true)}
        onDeletedWhileEditing={() => {
          setFormOpen(false)
          void refetch()
        }}
      />
      <ConfirmModal
        open={!!deleting}
        title={t("villas.deleteTitle")}
        message={t("villas.deleteBody", { name: deleting?.villaNumber ?? "" })}
        confirmLabel={t("common.delete")}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleting(null)}
        confirmPending={remove.isPending}
      />
      <ImportWizardModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        config={IMPORT_RESOURCES.villas}
        onSuccess={() => invalidateVillaListsAndDashboard(qc)}
      />
    </>
  )
}
