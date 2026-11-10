import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo, useState } from "react"
import { invalidateOpenWorksAfterWrite } from "@/features/open-works/lib/openWorksQueryCache"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import { toApiError } from "@/shared/api/errors"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import { normalizeSearchInput } from "@/shared/lib/phone/phoneNormalize"
import { ConfirmModal } from "@/shared/ui/Modal"
import PageHeader from "@/shared/ui/PageHeader"
import { SearchInput } from "@/shared/ui/Field"
import { downloadExport } from "@/shared/export/downloadExport"
import { ImportWizardModal, IMPORT_RESOURCES } from "@/shared/import"
import ListPageHeaderActions from "@/shared/list/ListPageHeaderActions"
import { toast } from "@/shared/lib/toast"
import {
  buildOpenWorksListQueryParams,
  hasActiveOpenWorksListFilters,
  useDeleteOpenWorkMutation,
  useOpenWorksListParams,
  useOpenWorksListQuery,
  type OpenWork,
} from "../api"
import DoneWorksButton from "@/features/done-works/components/DoneWorksButton"
import OpenWorkFormModal from "../components/OpenWorkFormModal"
import OpenWorksListErrorBanner from "../components/OpenWorksListErrorBanner"
import OpenWorksListFiltersBar from "../components/OpenWorksListFiltersBar"
import OpenWorksListFooter from "../components/OpenWorksListFooter"
import OpenWorksTable from "../components/OpenWorksTable"

export default function OpenWorksPage() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const qc = useQueryClient()
  const { params, setParam, setPage, setLimit, clearFilters, toggleSort } =
    useOpenWorksListParams()
  // A done work (100%) leaves this list: it is on the Done Works page.
  const listParams = useMemo(() => ({ ...params, done: false }), [params])
  const { data, isLoading, isError, error, refetch } =
    useOpenWorksListQuery(listParams)
  const remove = useDeleteOpenWorkMutation()
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    normalizeSearchInput,
  )

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | undefined>()
  const [deleting, setDeleting] = useState<OpenWork | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [savedBanner, setSavedBanner] = useState(false)

  const canCreate = can("open-works:create")
  const canUpdate = can("open-works:update")
  const canDelete = can("open-works:delete")
  const canExport = can("open-works:export")
  const canImport = can("open-works:import")

  const onExport = useCallback(
    async (format: "xlsx" | "pdf", signal: AbortSignal) => {
      await downloadExport({
        path: "/open-works/export",
        query: buildOpenWorksListQueryParams(listParams, { forExport: true }),
        format,
        filenameStem: "open-works",
        signal,
      })
    },
    [listParams],
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

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync({
        id: deleting.id,
        villaId: deleting.villa.id,
        write: { ifMatch: deleting.version },
      })
      setDeleting(null)
    } catch (err) {
      const parsed = toApiError(err)
      toast.error(parsed.message)
    }
  }

  return (
    <>
      <PageHeader
        title={t("openWorks.title")}
        subtitle={t("openWorks.subtitle")}
        actions={
          canCreate || canExport || canImport ? (
            <ListPageHeaderActions
              showImport={canImport}
              importLabel={t("openWorks.import")}
              importAction={
                canImport
                  ? {
                      kind: "button",
                      label: t("openWorks.import"),
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
                      extraHint: t("openWorks.exportColumnsNote"),
                    }
                  : undefined
              }
              add={
                canCreate
                  ? {
                      label: t("openWorks.addTitle"),
                      onClick: () => {
                        setEditId(undefined)
                        setFormOpen(true)
                      },
                    }
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
      {hasActiveOpenWorksListFilters(params) && (
        <p className="mb-3 text-sm text-muted-foreground">
          {t("openWorks.filteredListHint")}{" "}
          <button
            type="button"
            className="text-accent hover:underline"
            onClick={clearFilters}
          >
            {t("common.clearFilters")}
          </button>
        </p>
      )}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <SearchInput
            value={searchDraft}
            onChange={setSearchDraft}
            placeholder={t("openWorks.searchPlaceholder")}
          />
        </div>
        <DoneWorksButton />
      </div>
      <OpenWorksListFiltersBar params={params} setParam={setParam} />
      {showGlobalError && apiError && (
        <OpenWorksListErrorBanner
          error={apiError}
          onRetry={() => void refetch()}
        />
      )}
      {!showGlobalError && (
        <>
          <OpenWorksTable
            rows={rows}
            isLoading={isLoading}
            sort={params.sort ?? ""}
            onToggleSort={toggleSort}
            showVillaColumn
            canUpdate={canUpdate}
            canDelete={canDelete}
            onEdit={(row) => {
              setEditId(row.id)
              setFormOpen(true)
            }}
            onDelete={setDeleting}
            emptyMessage={t("openWorks.emptyTitle")}
          />
          {meta && meta.total > 0 && (
            <OpenWorksListFooter
              meta={meta}
              onPageChange={setPage}
              onPageSizeChange={setLimit}
              onGoLastPage={() => setPage(meta.totalPages)}
            />
          )}
        </>
      )}
      <OpenWorkFormModal
        open={formOpen}
        workId={editId}
        onClose={() => setFormOpen(false)}
        onSaved={() => setSavedBanner(true)}
      />
      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void handleDelete()}
        closeOnConfirm={false}
        confirmPending={remove.isPending}
        title={t("openWorks.deleteTitle")}
        message={t("openWorks.deleteBody", {
          phase: deleting?.elecPhase.name ?? "",
        })}
      />
      <ImportWizardModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        config={IMPORT_RESOURCES["open-works"]}
        onSuccess={() => invalidateOpenWorksAfterWrite(qc)}
      />
    </>
  )
}
