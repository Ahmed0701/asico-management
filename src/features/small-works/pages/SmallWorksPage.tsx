import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo, useState } from "react"
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
import { formatCalendarDateUtc } from "@/shared/lib/formatCalendarDateUtc"
import { invalidateSmallWorksAfterWrite } from "../lib/smallWorksQueryCache"
import {
  buildSmallWorksListQueryParams,
  hasActiveSmallWorksListFilters,
  useDeleteSmallWorkMutation,
  useSmallWorksListParams,
  useSmallWorksListQuery,
  type SmallWork,
} from "../api"
import DoneWorksButton from "@/features/done-works/components/DoneWorksButton"
import SmallWorkFormModal from "../components/SmallWorkFormModal"
import SmallWorksListErrorBanner from "../components/SmallWorksListErrorBanner"
import SmallWorksListFiltersBar from "../components/SmallWorksListFiltersBar"
import SmallWorksListFooter from "../components/SmallWorksListFooter"
import SmallWorksTable from "../components/SmallWorksTable"

export default function SmallWorksPage() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const qc = useQueryClient()
  const { params, setParam, setPage, setLimit, clearFilters, toggleSort } =
    useSmallWorksListParams()
  // A done work leaves this list: it is on the Done Works page.
  const listParams = useMemo(
    () => ({ ...params, status: "PENDING" as const }),
    [params],
  )
  const { data, isLoading, isError, error, refetch } =
    useSmallWorksListQuery(listParams)
  const remove = useDeleteSmallWorkMutation()
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    normalizeSearchInput,
  )

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | undefined>()
  const [deleting, setDeleting] = useState<SmallWork | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [savedBanner, setSavedBanner] = useState(false)

  const canCreate = can("small-works:create")
  const canUpdate = can("small-works:update")
  const canDelete = can("small-works:delete")
  const canExport = can("small-works:export")
  const canImport = can("small-works:import")

  const onExport = useCallback(
    async (format: "xlsx" | "pdf", signal: AbortSignal) => {
      await downloadExport({
        path: "/small-works/export",
        query: buildSmallWorksListQueryParams(listParams, { forExport: true }),
        format,
        filenameStem: "small-works",
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
      toast.error(toApiError(err).message)
    }
  }

  const deleteDateLabel = deleting
    ? formatCalendarDateUtc(`${deleting.endDate}T00:00:00.000Z`)
    : ""

  return (
    <>
      <PageHeader
        title={t("smallWorks.title")}
        subtitle={t("smallWorks.subtitle")}
        actions={
          canCreate || canExport || canImport ? (
            <ListPageHeaderActions
              showImport={canImport}
              importLabel={t("smallWorks.import")}
              importAction={
                canImport
                  ? {
                      kind: "button",
                      label: t("smallWorks.import"),
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
                  ? {
                      label: t("smallWorks.addTitle"),
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
      {hasActiveSmallWorksListFilters(params) && (
        <p className="mb-3 text-sm text-muted-foreground">
          {t("smallWorks.filteredListHint")}{" "}
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
            placeholder={t("smallWorks.searchPlaceholder")}
          />
        </div>
        <DoneWorksButton />
      </div>
      <SmallWorksListFiltersBar
        params={params}
        setParam={setParam}
        hideStatusFilter
      />
      {showGlobalError && apiError && (
        <SmallWorksListErrorBanner
          error={apiError}
          onRetry={() => void refetch()}
        />
      )}
      {!showGlobalError && (
        <>
          <SmallWorksTable
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
            emptyMessage={t("smallWorks.emptyTitle")}
          />
          {meta && meta.total > 0 && (
            <SmallWorksListFooter
              meta={meta}
              onPageChange={setPage}
              onPageSizeChange={setLimit}
              onGoLastPage={() => setPage(meta.totalPages)}
            />
          )}
        </>
      )}
      <SmallWorkFormModal
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
        title={t("smallWorks.deleteTitle")}
        message={t("smallWorks.deleteBody", {
          date: deleteDateLabel,
          description: deleting?.description ?? "",
        })}
      />
      <ImportWizardModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        config={IMPORT_RESOURCES["small-works"]}
        onSuccess={() => invalidateSmallWorksAfterWrite(qc)}
      />
    </>
  )
}
