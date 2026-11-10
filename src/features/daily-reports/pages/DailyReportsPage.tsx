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
import { invalidateDailyReportsAfterWrite } from "../lib/dailyReportsQueryCache"
import {
  buildDailyReportsListQueryParams,
  hasActiveDailyReportsListFilters,
  useDeleteDailyReportMutation,
  useDailyReportsListParams,
  useDailyReportsListQuery,
  type DailyReport,
} from "../api"
import DailyReportFormModal from "../components/DailyReportFormModal"
import DailyReportsListErrorBanner from "../components/DailyReportsListErrorBanner"
import DailyReportsListFiltersBar from "../components/DailyReportsListFiltersBar"
import DailyReportsListFooter from "../components/DailyReportsListFooter"
import DailyReportsTable from "../components/DailyReportsTable"

export default function DailyReportsPage() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const qc = useQueryClient()
  const { params, setParam, setPage, setLimit, clearFilters, toggleSort } =
    useDailyReportsListParams()
  const { data, isLoading, isError, error, refetch } =
    useDailyReportsListQuery()
  const remove = useDeleteDailyReportMutation()
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    normalizeSearchInput,
  )

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | undefined>()
  const [deleting, setDeleting] = useState<DailyReport | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [savedBanner, setSavedBanner] = useState(false)

  const canCreate = can("daily-reports:create")
  const canUpdate = can("daily-reports:update")
  const canDelete = can("daily-reports:delete")
  const canExport = can("daily-reports:export")
  const canImport = can("daily-reports:import")

  const onExport = useCallback(
    async (format: "xlsx" | "pdf", signal: AbortSignal) => {
      await downloadExport({
        path: "/daily-reports/export",
        query: buildDailyReportsListQueryParams(params, { forExport: true }),
        format,
        filenameStem: "daily-reports",
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

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync({
        id: deleting.id,
        write: { ifMatch: deleting.version },
      })
      setDeleting(null)
    } catch (err) {
      toast.error(toApiError(err).message)
    }
  }

  const deleteDateLabel = deleting
    ? formatCalendarDateUtc(`${deleting.reportDate}T00:00:00.000Z`)
    : ""

  return (
    <>
      <PageHeader
        title={t("dailyReports.title")}
        subtitle={t("dailyReports.subtitle")}
        actions={
          canCreate || canExport || canImport ? (
            <ListPageHeaderActions
              showImport={canImport}
              importLabel={t("dailyReports.import")}
              importAction={
                canImport
                  ? {
                      kind: "button",
                      label: t("dailyReports.import"),
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
                      label: t("dailyReports.addTitle"),
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
      {hasActiveDailyReportsListFilters(params) && (
        <p className="mb-3 text-sm text-muted-foreground">
          {t("dailyReports.filteredListHint")}{" "}
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
          placeholder={t("dailyReports.searchPlaceholder")}
        />
      </div>
      <DailyReportsListFiltersBar params={params} setParam={setParam} />
      {showGlobalError && apiError && (
        <DailyReportsListErrorBanner
          error={apiError}
          onRetry={() => void refetch()}
        />
      )}
      {!showGlobalError && (
        <>
          <DailyReportsTable
            rows={rows}
            isLoading={isLoading}
            sort={params.sort ?? ""}
            onToggleSort={toggleSort}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onEdit={(row) => {
              setEditId(row.id)
              setFormOpen(true)
            }}
            onDelete={setDeleting}
            emptyMessage={t("dailyReports.emptyTitle")}
          />
          {meta && meta.total > 0 && (
            <DailyReportsListFooter
              meta={meta}
              onPageChange={setPage}
              onPageSizeChange={setLimit}
              onGoLastPage={() => setPage(meta.totalPages)}
            />
          )}
        </>
      )}
      <DailyReportFormModal
        open={formOpen}
        reportId={editId}
        onClose={() => setFormOpen(false)}
        onSaved={() => setSavedBanner(true)}
      />
      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void handleDelete()}
        closeOnConfirm={false}
        confirmPending={remove.isPending}
        title={t("dailyReports.deleteTitle")}
        message={t("dailyReports.deleteBody", {
          date: deleteDateLabel,
        })}
      />
      <ImportWizardModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        config={IMPORT_RESOURCES["daily-reports"]}
        onSuccess={() => invalidateDailyReportsAfterWrite(qc)}
      />
    </>
  )
}
