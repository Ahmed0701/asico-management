import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import { toApiError } from "@/shared/api/errors"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import { normalizeSearchInput } from "@/shared/lib/phone/phoneNormalize"
import { ConfirmModal } from "@/shared/ui/Modal"
import { SearchInput } from "@/shared/ui/Field"
import { toast } from "@/shared/lib/toast"
import { formatCalendarDateUtc } from "@/shared/lib/formatCalendarDateUtc"
import {
  hasActiveSiteReportsListFilters,
  useDeleteSiteReportMutation,
  useSiteReportsListParams,
  useSiteReportsListQuery,
  type SiteReport,
} from "../api"
import SiteReportFormModal from "../components/SiteReportFormModal"
import SiteReportsListErrorBanner from "../components/SiteReportsListErrorBanner"
import SiteReportsListFiltersBar from "../components/SiteReportsListFiltersBar"
import SiteReportsListFooter from "../components/SiteReportsListFooter"
import SiteReportsTable from "../components/SiteReportsTable"

export default function SiteReportsTabPanel({
  onSavedBanner,
  openCreateSignal,
}: {
  onSavedBanner: () => void
  openCreateSignal: number
}) {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const { params, setParam, setPage, setLimit, clearFilters, toggleSort } =
    useSiteReportsListParams()
  const { data, isLoading, isError, error, refetch } = useSiteReportsListQuery()
  const remove = useDeleteSiteReportMutation()
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    normalizeSearchInput,
  )

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | undefined>()
  const [deleting, setDeleting] = useState<SiteReport | null>(null)

  useEffect(() => {
    if (openCreateSignal > 0) {
      setEditId(undefined)
      setFormOpen(true)
    }
  }, [openCreateSignal])

  const canUpdate = can("site-reports:update")
  const canDelete = can("site-reports:delete")

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
    ? formatCalendarDateUtc(`${deleting.visitDate}T00:00:00.000Z`)
    : ""

  return (
    <>
      {hasActiveSiteReportsListFilters(params) && (
        <p className="mb-3 text-sm text-muted-foreground">
          {t("siteReports.filteredListHint")}{" "}
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
          placeholder={t("siteReports.searchPlaceholder")}
        />
      </div>
      <SiteReportsListFiltersBar params={params} setParam={setParam} />
      {showGlobalError && apiError && (
        <SiteReportsListErrorBanner
          error={apiError}
          onRetry={() => void refetch()}
        />
      )}
      {!showGlobalError && (
        <>
          <SiteReportsTable
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
            emptyMessage={t("siteReports.emptyTitle")}
          />
          {meta && meta.total > 0 && (
            <SiteReportsListFooter
              meta={meta}
              onPageChange={setPage}
              onPageSizeChange={setLimit}
              onGoLastPage={() => setPage(meta.totalPages)}
            />
          )}
        </>
      )}
      <SiteReportFormModal
        open={formOpen}
        reportId={editId}
        onClose={() => setFormOpen(false)}
        onSaved={onSavedBanner}
      />
      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void handleDelete()}
        closeOnConfirm={false}
        confirmPending={remove.isPending}
        title={t("siteReports.deleteTitle")}
        message={t("siteReports.deleteBody", {
          date: deleteDateLabel,
          title: deleting?.title ?? "",
        })}
      />
    </>
  )
}

export function useSiteReportsTabListMeta() {
  const { data, isLoading } = useSiteReportsListQuery()
  return { total: data?.meta.total, isLoading }
}
