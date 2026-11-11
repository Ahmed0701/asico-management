import { useCallback, useState } from "react"
import { SearchSelect } from "@/shared/ui/search-select"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import { normalizeSearchInput } from "@/shared/lib/phone/phoneNormalize"
import { formatDateTime } from "@/shared/lib/format"
import PageHeader from "@/shared/ui/PageHeader"
import ListPageHeaderActions from "@/shared/list/ListPageHeaderActions"
import { SearchInput } from "@/shared/ui/Field"
import ProgressCell from "@/shared/list/ProgressCell"
import { Badge } from "@/shared/ui/Badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { TableBodySkeleton } from "@/shared/ui/loading-skeletons"
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
import MewStateSelect from "../components/MewStateSelect"
import VillasListErrorBanner from "../components/VillasListErrorBanner"
import VillasListFooter from "../components/VillasListFooter"
import Button, { IconButton } from "@/shared/ui/Button"
import { Input } from "@/shared/ui/input"
import { toast } from "@/shared/lib/toast"

const COLUMN_COUNT = 9

// The villas on MEW follow up. Villas are added and removed here (not on the villa page); each row carries the
// villa's MEW states, its MEW inspection day, and the button that adds it for MEW inspection.
export default function MewFollowUpPage() {
  const { t } = useTranslation()
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
      onWriteError(err)
    } finally {
      setBusyId(null)
    }
  }

  // MEW inspects a villa only after both files went in; the server refuses it otherwise.
  const filesSubmitted = (row: VillaListItem) =>
    row.mewAcState !== "NOT_SUBMITTED" && row.mewElecState !== "NOT_SUBMITTED"

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
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <SearchInput
            value={searchDraft}
            onChange={setSearchDraft}
            placeholder={t("villas.searchPlaceholder")}
          />
        </div>
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
      </div>
      <VillasListErrorBanner
        error={showErrorBanner ? apiError : null}
        onRetry={() => void refetch()}
      />
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <TableHead className="px-4 py-2.5">
                {t("villas.villaNumber")}
              </TableHead>
              <TableHead className="px-4 py-2.5">{t("villas.owner")}</TableHead>
              <TableHead className="px-4 py-2.5">
                {t("villas.location")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("villas.progress")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("mewFollowUp.acState")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("mewFollowUp.elecState")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("mewFollowUp.inspectionDate")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("mewFollowUp.since")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("mewFollowUp.inspection")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              <TableBodySkeleton columns={COLUMN_COUNT} rows={8} />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMN_COUNT}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  {t("mewFollowUp.empty")}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/40">
                  <TableCell className="px-4 py-3 font-medium">
                    <Link to={`/villas/${row.id}`} className="hover:underline">
                      {row.villaNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 py-3" dir="auto">
                    {row.ownerName ?? "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm" dir="auto">
                    {row.location}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <ProgressCell value={row.progress} />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <MewStateSelect
                      value={row.mewAcState}
                      label={t("mewFollowUp.acState")}
                      canEdit={canEdit}
                      disabled={busyId === row.id}
                      onChange={(next) =>
                        void saveMew(row, { mewAcState: next })
                      }
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <MewStateSelect
                      value={row.mewElecState}
                      label={t("mewFollowUp.elecState")}
                      canEdit={canEdit}
                      disabled={busyId === row.id}
                      onChange={(next) =>
                        void saveMew(row, { mewElecState: next })
                      }
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {canEdit ? (
                      <Input
                        type="date"
                        className="h-8 w-40 text-xs"
                        aria-label={t("mewFollowUp.inspectionDate")}
                        value={row.mewInspectionDate ?? ""}
                        disabled={busyId === row.id}
                        onChange={(e) =>
                          void saveMew(row, {
                            mewInspectionDate: e.target.value || null,
                          })
                        }
                      />
                    ) : (
                      <span className="text-sm tabular-nums">
                        {row.mewInspectionDate ?? t("common.none")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {row.mewFollowUp ? (
                      <Badge tone="info">
                        {formatDateTime(row.mewFollowUp.at)}
                      </Badge>
                    ) : (
                      t("common.none")
                    )}
                  </TableCell>
                  <TableCell className="flex items-center gap-1 px-4 py-3">
                    {canEdit ? (
                      <Button
                        type="button"
                        size="sm"
                        icon={row.mewInspection ? "x" : "check"}
                        variant={row.mewInspection ? "secondary" : "primary"}
                        disabled={
                          busyId === row.id ||
                          (!row.mewInspection && !filesSubmitted(row))
                        }
                        title={
                          !row.mewInspection && !filesSubmitted(row)
                            ? t("mewFollowUp.submitFirst")
                            : undefined
                        }
                        onClick={() => void toggleInspection(row)}
                      >
                        {row.mewInspection
                          ? t("mewFollowUp.removeFromInspection")
                          : t("mewFollowUp.addToInspection")}
                      </Button>
                    ) : row.mewInspection ? (
                      <Badge tone="success">
                        {t("mewFollowUp.onInspection")}
                      </Badge>
                    ) : (
                      t("common.none")
                    )}
                    {canEdit && (
                      <IconButton
                        icon="trash"
                        variant="danger"
                        label={t("mewFollowUp.remove")}
                        disabled={busyId === row.id}
                        onClick={() => void removeFromFollowUp(row)}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {meta && (
        <VillasListFooter
          meta={meta}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          onGoLastPage={() => setPage(meta.totalPages)}
        />
      )}
      {meta && (
        <p className="mt-3 text-sm text-muted-foreground">
          {t("mewFollowUp.count", { count: meta.total })}
        </p>
      )}
    </>
  )
}
