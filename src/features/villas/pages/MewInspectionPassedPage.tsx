import { useState } from "react"
import { useSearchParams, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import { normalizeSearchInput } from "@/shared/lib/phone/phoneNormalize"
import { toast } from "@/shared/lib/toast"
import PageHeader from "@/shared/ui/PageHeader"
import Button from "@/shared/ui/Button"
import { toApiError } from "@/shared/api/errors"
import {
  useMewInspectionPassedListParams,
  useMewInspectionPassedListQuery,
  useMewReportsQuery,
  useVillaMewInspectionPassedMutation,
  type VillaListItem,
} from "../api"
import MewPassedSummary from "../components/MewPassedSummary"
import MewPassedTable from "../components/MewPassedTable"
import VillasListErrorBanner from "../components/VillasListErrorBanner"
import VillasListFooter from "../components/VillasListFooter"
import ListToolbar, {
  clearedListParams,
  countActive,
} from "@/shared/list/ListToolbar"

// Villas that passed the MEW inspection. Moving one back sends it to the MEW inspection list again.
export default function MewInspectionPassedPage() {
  const { t } = useTranslation()
  const [toolbarParams, setToolbarParams] = useSearchParams()
  const navigate = useNavigate()
  const { can } = usePermissions()
  const canEdit = can("villas:inspection")
  const { params, setParam, setPage, setLimit } =
    useMewInspectionPassedListParams()
  const { data, isLoading, isError, error, refetch } =
    useMewInspectionPassedListQuery()
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    normalizeSearchInput,
  )
  const passing = useVillaMewInspectionPassedMutation()
  const [busyId, setBusyId] = useState<string | null>(null)

  const takeBack = async (row: VillaListItem) => {
    setBusyId(row.id)
    try {
      await passing.mutateAsync({
        id: row.id,
        passed: false,
        write: { ifMatch: row.version },
      })
      toast.success(
        t("mewInspectionPassed.movedBack", { name: row.villaNumber }),
      )
    } catch (err) {
      toast.error(toApiError(err).message)
      void refetch()
    } finally {
      setBusyId(null)
    }
  }

  const rows = data?.data ?? []
  const meta = data?.meta
  // The inspection reports of the villas on this page, in one request.
  const reports = useMewReportsQuery(rows.map((row) => row.id))
  const reportOf = (villaId: string) =>
    reports.data?.find((report) => report.villaId === villaId)
  const apiError = isError ? toApiError(error) : null
  const showErrorBanner =
    apiError !== null &&
    (apiError.status === 403 ||
      apiError.status >= 500 ||
      apiError.code === "NETWORK_ERROR")

  return (
    <>
      <PageHeader
        title={t("mewInspectionPassed.title")}
        subtitle={t("mewInspectionPassed.subtitle")}
        actions={
          <Button
            type="button"
            size="sm"
            icon="chevronLeft"
            onClick={() => navigate("/villas/mew-inspection")}
          >
            {t("mewInspectionPassed.backToInspection")}
          </Button>
        }
      />
      <MewPassedSummary
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
      <MewPassedTable
        rows={rows}
        loading={isLoading}
        sort={params.sort}
        onSort={(next) => setParam("sort", next)}
        canEdit={canEdit}
        busyId={busyId}
        reportOf={reportOf}
        onTakeBack={(row) => void takeBack(row)}
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
