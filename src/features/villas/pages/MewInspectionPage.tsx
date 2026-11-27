import { useCallback, useState } from "react"
import { useSearchParams, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import { normalizeSearchInput } from "@/shared/lib/phone/phoneNormalize"
import { toast } from "@/shared/lib/toast"
import PageHeader from "@/shared/ui/PageHeader"
import ListPageHeaderActions from "@/shared/list/ListPageHeaderActions"
import { downloadExport } from "@/shared/export/downloadExport"
import Button from "@/shared/ui/Button"
import { toApiError } from "@/shared/api/errors"
import {
  buildVillasQueryParams,
  useMewInspectionListParams,
  useMewInspectionListQuery,
  useMewReportsQuery,
  useSetVillaMewStatesMutation,
  useVillaMewInspectionMutation,
  useVillaMewInspectionPassedMutation,
  type VillaListItem,
} from "../api"
import MewInspectionSummary from "../components/MewInspectionSummary"
import MewInspectionTable from "../components/MewInspectionTable"
import VillasListErrorBanner from "../components/VillasListErrorBanner"
import VillasListFooter from "../components/VillasListFooter"
import ListToolbar, {
  clearedListParams,
  countActive,
} from "@/shared/list/ListToolbar"

// Villas someone added for MEW inspection from the MEW follow-up page and that have not passed yet.
// Checking "Passed" moves a villa to the MEW Inspection Passed page.
export default function MewInspectionPage() {
  const { t } = useTranslation()
  const [toolbarParams, setToolbarParams] = useSearchParams()
  const navigate = useNavigate()
  const { can } = usePermissions()
  const canEdit = can("villas:inspection")
  const { params, setParam, setPage, setLimit } = useMewInspectionListParams()
  const canExport = can("villas:export")
  // The villas of the current search: the server writes the MEW Inspection columns, with each villa's report, for this filter.
  const onExport = useCallback(
    async (format: "xlsx" | "pdf", signal: AbortSignal) => {
      await downloadExport({
        path: "/villas/export",
        query: buildVillasQueryParams(params, { forExport: true }),
        format,
        filenameStem: "mew-inspection",
        signal,
      })
    },
    [params],
  )
  const { data, isLoading, isError, error, refetch } =
    useMewInspectionListQuery()
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    normalizeSearchInput,
  )
  const inspection = useVillaMewInspectionMutation()
  const passing = useVillaMewInspectionPassedMutation()
  const setStates = useSetVillaMewStatesMutation()
  const [busyId, setBusyId] = useState<string | null>(null)

  // Checked: the villa passed the MEW inspection, so it leaves this list for the passed one.
  const markPassed = async (row: VillaListItem) => {
    setBusyId(row.id)
    try {
      await passing.mutateAsync({
        id: row.id,
        passed: true,
        write: { ifMatch: row.version },
      })
      toast.success(t("mewInspection.movedToPassed", { name: row.villaNumber }))
    } catch (err) {
      toast.error(toApiError(err).message)
      void refetch()
    } finally {
      setBusyId(null)
    }
  }

  // The villa's one MEW inspection day: the same value the MEW follow-up page shows and sets.
  const saveInspectionDate = async (row: VillaListItem, day: string) => {
    setBusyId(row.id)
    try {
      await setStates.mutateAsync({
        id: row.id,
        input: { mewInspectionDate: day || null },
        write: { ifMatch: row.version },
      })
    } catch (err) {
      toast.error(toApiError(err).message)
      void refetch()
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (row: VillaListItem) => {
    setBusyId(row.id)
    try {
      await inspection.mutateAsync({
        id: row.id,
        marked: false,
        write: { ifMatch: row.version },
      })
      toast.success(
        t("mewFollowUp.removedFromInspection", { name: row.villaNumber }),
      )
    } catch (err) {
      toast.error(toApiError(err).message)
      void refetch()
    } finally {
      setBusyId(null)
    }
  }

  const rows = data?.data ?? []
  // The inspection reports of the villas on this page, in one request.
  const reports = useMewReportsQuery(rows.map((row) => row.id))
  const reportOf = (villaId: string) =>
    reports.data?.find((report) => report.villaId === villaId)
  const meta = data?.meta
  const apiError = isError ? toApiError(error) : null
  const showErrorBanner =
    apiError !== null &&
    (apiError.status === 403 ||
      apiError.status >= 500 ||
      apiError.code === "NETWORK_ERROR")

  return (
    <>
      <PageHeader
        title={t("mewInspection.title")}
        subtitle={t("mewInspection.subtitle")}
        actions={
          <>
            <Button
              type="button"
              size="sm"
              icon="check"
              onClick={() => navigate("/villas/mew-inspection-passed")}
            >
              {t("mewInspectionPassed.title")}
            </Button>
            {canExport && (
              <ListPageHeaderActions
                showImport={false}
                exportAction={{
                  kind: "menu",
                  total: meta?.total,
                  listLoading: isLoading,
                  onExport,
                }}
              />
            )}
          </>
        }
      />
      <MewInspectionSummary
        rows={rows}
        total={meta?.total}
        reports={reports.data ?? []}
      />
      <ListToolbar
        search={{
          value: searchDraft,
          onChange: setSearchDraft,
          placeholder: t("villas.searchPlaceholder"),
        }}
        count={meta?.total}
        activeCount={countActive(params.search)}
        onClear={() => setToolbarParams(clearedListParams(toolbarParams))}
      />
      <VillasListErrorBanner
        error={showErrorBanner ? apiError : null}
        onRetry={() => void refetch()}
      />
      <MewInspectionTable
        rows={rows}
        loading={isLoading}
        sort={params.sort}
        onSort={(next) => setParam("sort", next)}
        canEdit={canEdit}
        busyId={busyId}
        reportOf={reportOf}
        onSaveDate={(row, day) => void saveInspectionDate(row, day)}
        onPassed={(row) => void markPassed(row)}
        onRemove={(row) => void remove(row)}
      />
      {meta && (
        <VillasListFooter
          meta={meta}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          onGoLastPage={() => setPage(meta.totalPages)}
        />
      )}
    </>
  )
}
