import { useCallback, useState } from "react"
import { SearchSelect } from "@/shared/ui/search-select"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import { normalizeSearchInput } from "@/shared/lib/phone/phoneNormalize"
import PageHeader from "@/shared/ui/PageHeader"
import ListPageHeaderActions from "@/shared/list/ListPageHeaderActions"
import { downloadExport } from "@/shared/export/downloadExport"
import { toApiError } from "@/shared/api/errors"
import {
  buildVillasQueryParams,
  useMewFollowUpListParams,
  useMewFollowUpListQuery,
  useSetVillaMewStatesMutation,
  useVillaMewFollowUpMutation,
  useVillaMewInspectionMutation,
  useVillaOptionsQuery,
  type MewStatesInput,
  type VillaListItem,
} from "../api"
import MewFollowUpSummary from "../components/MewFollowUpSummary"
import MewFollowUpTable from "../components/MewFollowUpTable"
import VariationOrdersPendingModal, {
  type PendingVariationOrders,
} from "@/features/variation-orders/components/VariationOrdersPendingModal"
import VillasListErrorBanner from "../components/VillasListErrorBanner"
import VillasListFooter from "../components/VillasListFooter"
import Button from "@/shared/ui/Button"
import { toast } from "@/shared/lib/toast"
import { useSearchParams } from "react-router"
import ListToolbar, {
  clearedListParams,
  countActive,
} from "@/shared/list/ListToolbar"

// The villas on MEW follow up. Villas are added and removed here (not on the villa page); each row carries the
// villa's MEW states, its MEW inspection day, and the button that adds it for MEW inspection.
export default function MewFollowUpPage() {
  const { t } = useTranslation()
  const [toolbarParams, setToolbarParams] = useSearchParams()
  const { can } = usePermissions()
  const canExport = can("villas:export")
  const { params, setParam, setPage, setLimit } = useMewFollowUpListParams()
  const { data, isLoading, isError, error, refetch } = useMewFollowUpListQuery()
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    normalizeSearchInput,
  )

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

  // The MEW states and the MEW inspection mark are changed by someone with villas:inspection.
  const canEdit = can("villas:inspection")
  const setStates = useSetVillaMewStatesMutation()
  const inspection = useVillaMewInspectionMutation()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingVos, setPendingVos] = useState<PendingVariationOrders | null>(
    null,
  )

  // A write that someone else got to first: say so and show the villa as it is now.
  const onWriteError = (err: unknown) => {
    toast.error(toApiError(err).message)
    void refetch()
  }

  // Adding a villa to the list, and taking one off it.
  const { data: villaOptions } = useVillaOptionsQuery()
  const followUp = useVillaMewFollowUpMutation()
  const [villaToAdd, setVillaToAdd] = useState("")

  const addToFollowUp = async () => {
    const option = villaOptions?.find((v) => v.id === villaToAdd)
    if (!option) return
    try {
      await followUp.mutateAsync({ id: option.id, marked: true, write: {} })
      toast.success(t("mewFollowUp.added", { name: option.villaNumber }))
      setVillaToAdd("")
    } catch (err) {
      onWriteError(err)
    }
  }

  const removeFromFollowUp = async (row: VillaListItem) => {
    setBusyId(row.id)
    try {
      await followUp.mutateAsync({
        id: row.id,
        marked: false,
        write: { ifMatch: row.version },
      })
      toast.success(t("mewFollowUp.removed", { name: row.villaNumber }))
    } catch (err) {
      onWriteError(err)
    } finally {
      setBusyId(null)
    }
  }

  // The MEW states and the inspection day, saved as soon as they are picked.
  const saveMew = async (row: VillaListItem, input: MewStatesInput) => {
    setBusyId(row.id)
    try {
      await setStates.mutateAsync({
        id: row.id,
        input,
        write: { ifMatch: row.version },
      })
    } catch (err) {
      onWriteError(err)
    } finally {
      setBusyId(null)
    }
  }

  const toggleInspection = async (row: VillaListItem) => {
    const adding = row.mewInspection === null
    setBusyId(row.id)
    try {
      await inspection.mutateAsync({
        id: row.id,
        marked: adding,
        write: { ifMatch: row.version },
      })
      toast.success(
        adding
          ? t("mewFollowUp.addedToInspection", { name: row.villaNumber })
          : t("mewFollowUp.removedFromInspection", { name: row.villaNumber }),
      )
    } catch (err) {
      const apiErr = toApiError(err)
      // Some variation orders of the villa are not paid: a dialog that leads to them, not a toast.
      if (apiErr.code === "VILLA_VARIATION_ORDERS_PENDING") {
        const count = apiErr.details?.[0]?.value
        setPendingVos({
          villaId: row.id,
          villaNumber: row.villaNumber,
          count: typeof count === "number" ? count : null,
        })
      } else {
        onWriteError(err)
      }
    } finally {
      setBusyId(null)
    }
  }

  const rows = data?.data ?? []
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
        title={t("mewFollowUp.title")}
        subtitle={t("mewFollowUp.subtitle")}
        actions={
          canExport ? (
            <ListPageHeaderActions
              showImport={false}
              exportAction={{
                kind: "menu",
                total: meta?.total,
                listLoading: isLoading,
                onExport,
              }}
            />
          ) : undefined
        }
      />
      <MewFollowUpSummary rows={rows} total={meta?.total} />
      <ListToolbar
        search={{
          value: searchDraft,
          onChange: setSearchDraft,
          placeholder: t("villas.searchPlaceholder"),
        }}
        count={meta?.total}
        activeCount={countActive(params.search)}
        onClear={() => setToolbarParams(clearedListParams(toolbarParams))}
        actions={
          <>
            {canEdit && (
              <div className="flex items-center gap-2">
                <SearchSelect
                  className="w-56"
                  aria-label={t("mewFollowUp.pickVilla")}
                  value={villaToAdd}
                  onChange={setVillaToAdd}
                  options={(villaOptions ?? []).map((villa) => ({
                    value: villa.id,
                    label: villa.villaNumber,
                  }))}
                  placeholder={t("mewFollowUp.pickVilla")}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  icon="plus"
                  disabled={!villaToAdd || followUp.isPending}
                  onClick={() => void addToFollowUp()}
                >
                  {t("mewFollowUp.add")}
                </Button>
              </div>
            )}
          </>
        }
      />
      <VillasListErrorBanner
        error={showErrorBanner ? apiError : null}
        onRetry={() => void refetch()}
      />
      <MewFollowUpTable
        rows={rows}
        loading={isLoading}
        sort={params.sort}
        onSort={(next) => setParam("sort", next)}
        canEdit={canEdit}
        busyId={busyId}
        onSaveMew={(row, input) => void saveMew(row, input)}
        onToggleInspection={(row) => void toggleInspection(row)}
        onRemove={(row) => void removeFromFollowUp(row)}
      />
      {meta && (
        <VillasListFooter
          meta={meta}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          onGoLastPage={() => setPage(meta.totalPages)}
        />
      )}
      <VariationOrdersPendingModal
        pending={pendingVos}
        onClose={() => setPendingVos(null)}
      />
    </>
  )
}
