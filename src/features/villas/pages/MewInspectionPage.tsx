import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import { normalizeSearchInput } from "@/shared/lib/phone/phoneNormalize"
import { formatDateTime } from "@/shared/lib/format"
import { toast } from "@/shared/lib/toast"
import PageHeader from "@/shared/ui/PageHeader"
import { SearchInput } from "@/shared/ui/Field"
import { Badge } from "@/shared/ui/Badge"
import Button from "@/shared/ui/Button"
import { Checkbox } from "@/shared/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { TableBodySkeleton } from "@/shared/ui/loading-skeletons"
import { toApiError } from "@/shared/api/errors"
import {
  useMewInspectionListParams,
  useMewInspectionListQuery,
  useVillaMewInspectionMutation,
  useVillaMewInspectionPassedMutation,
  type VillaListItem,
} from "../api"
import MewStateSelect from "../components/MewStateSelect"
import VillasListErrorBanner from "../components/VillasListErrorBanner"
import VillasListFooter from "../components/VillasListFooter"

const COLUMN_COUNT = 8

// Villas someone added for MEW inspection from the MEW follow-up page and that have not passed yet.
// Checking "Passed" moves a villa to the MEW Inspection Passed page.
export default function MewInspectionPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { can } = usePermissions()
  const canEdit = can("villas:inspection")
  const { params, setParam, setPage, setLimit } = useMewInspectionListParams()
  const { data, isLoading, isError, error, refetch } =
    useMewInspectionListQuery()
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    normalizeSearchInput,
  )
  const inspection = useVillaMewInspectionMutation()
  const passing = useVillaMewInspectionPassedMutation()
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
          <Button
            type="button"
            size="sm"
            icon="check"
            onClick={() => navigate("/villas/mew-inspection-passed")}
          >
            {t("mewInspectionPassed.title")}
          </Button>
        }
      />
      <div className="mb-3">
        <SearchInput
          value={searchDraft}
          onChange={setSearchDraft}
          placeholder={t("villas.searchPlaceholder")}
        />
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
                {t("mewFollowUp.acState")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("mewFollowUp.elecState")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("mewInspection.since")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("mewInspection.passed")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                <span className="sr-only">{t("common.actions")}</span>
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
                  {t("mewInspection.empty")}
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
                    {/* The states are changed on the MEW follow-up page. */}
                    <MewStateSelect
                      value={row.mewAcState}
                      label={t("mewFollowUp.acState")}
                      canEdit={false}
                      onChange={() => {}}
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <MewStateSelect
                      value={row.mewElecState}
                      label={t("mewFollowUp.elecState")}
                      canEdit={false}
                      onChange={() => {}}
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {row.mewInspection ? (
                      <Badge tone="success">
                        {formatDateTime(row.mewInspection.at)}
                      </Badge>
                    ) : (
                      t("common.none")
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Checkbox
                      checked={false}
                      disabled={!canEdit || busyId === row.id}
                      aria-label={t("mewInspection.markPassed", {
                        name: row.villaNumber,
                      })}
                      onCheckedChange={(checked) => {
                        if (checked === true) void markPassed(row)
                      }}
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-end">
                    {canEdit && (
                      <Button
                        type="button"
                        size="sm"
                        icon="x"
                        disabled={busyId === row.id}
                        onClick={() => void remove(row)}
                      >
                        {t("mewFollowUp.removeFromInspection")}
                      </Button>
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
          {t("mewInspection.count", { count: meta.total })}
        </p>
      )}
    </>
  )
}
