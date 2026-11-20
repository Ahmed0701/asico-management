import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import {
  useDailyLabourListParams,
  useDailyLabourListQuery,
  useDeleteDailyLabourMutation,
  type DailyLabour,
} from "@/features/daily-labour/api"
import DailyLabourFormModal from "@/features/daily-labour/components/DailyLabourFormModal"
import DailyLabourListErrorBanner from "@/features/daily-labour/components/DailyLabourListErrorBanner"
import DailyLabourListFiltersBar from "@/features/daily-labour/components/DailyLabourListFiltersBar"
import DailyLabourListFooter from "@/features/daily-labour/components/DailyLabourListFooter"
import DailyLabourTable from "@/features/daily-labour/components/DailyLabourTable"
import { toApiError } from "@/shared/api/errors"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import { normalizeSearchInput } from "@/shared/lib/phone/phoneNormalize"
import { formatCalendarDateUtc } from "@/shared/lib/formatCalendarDateUtc"
import { ConfirmModal } from "@/shared/ui/Modal"
import { toast } from "@/shared/lib/toast"
import ListToolbar, { countActive } from "@/shared/list/ListToolbar"

export default function DailyLabourTabPanel({
  onSavedBanner,
  openCreateSignal,
}: {
  onSavedBanner: () => void
  openCreateSignal: number
}) {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const {
    params,
    setLabourParam,
    setPage,
    setLimit,
    clearFilters,
    toggleSort,
    setSearch,
  } = useDailyLabourListParams()
  const { data, isLoading, isError, error, refetch } = useDailyLabourListQuery()
  const remove = useDeleteDailyLabourMutation()
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setSearch,
    normalizeSearchInput,
  )

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | undefined>()
  const [deleting, setDeleting] = useState<DailyLabour | null>(null)

  useEffect(() => {
    if (openCreateSignal > 0) {
      setEditId(undefined)
      setFormOpen(true)
    }
  }, [openCreateSignal])

  const canUpdate = can("daily-labour:update")
  const canDelete = can("daily-labour:delete")

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
    ? formatCalendarDateUtc(`${deleting.labourDate}T00:00:00.000Z`)
    : ""

  return (
    <>
      <ListToolbar
        search={{
          value: searchDraft,
          onChange: setSearchDraft,
          placeholder: t("dailyLabour.searchPlaceholder"),
        }}
        count={meta?.total}
        activeCount={countActive(
          params.contractorId,
          params.labourFrom,
          params.labourTo,
          params.villaId,
        )}
        onClear={clearFilters}
        filters={
          <DailyLabourListFiltersBar
            params={params}
            setLabourParam={setLabourParam}
          />
        }
      />
      {showGlobalError && apiError && (
        <DailyLabourListErrorBanner
          error={apiError}
          onRetry={() => void refetch()}
        />
      )}
      {!showGlobalError && (
        <>
          <DailyLabourTable
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
            emptyMessage={t("dailyLabour.emptyTitle")}
          />
          {meta && meta.total > 0 && (
            <DailyLabourListFooter
              meta={meta}
              onPageChange={setPage}
              onPageSizeChange={setLimit}
              onGoLastPage={() => setPage(meta.totalPages)}
            />
          )}
        </>
      )}
      <DailyLabourFormModal
        open={formOpen}
        labourId={editId}
        onClose={() => setFormOpen(false)}
        onSaved={onSavedBanner}
      />
      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => void handleDelete()}
        closeOnConfirm={false}
        confirmPending={remove.isPending}
        title={t("dailyLabour.deleteTitle")}
        message={t("dailyLabour.deleteBody", {
          date: deleteDateLabel,
          villa: deleting?.villa.villaNumber ?? "",
        })}
      />
    </>
  )
}

export function useDailyLabourTabListMeta() {
  const { data, isLoading } = useDailyLabourListQuery()
  return { total: data?.meta.total, isLoading }
}
