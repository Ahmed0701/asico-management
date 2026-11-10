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
  useMewInspectionPassedListParams,
  useMewInspectionPassedListQuery,
  useVillaMewInspectionPassedMutation,
  type VillaListItem,
} from "../api"
import MewStateSelect from "../components/MewStateSelect"
import VillasListErrorBanner from "../components/VillasListErrorBanner"
import VillasListFooter from "../components/VillasListFooter"

const COLUMN_COUNT = 7

// Villas checked as having passed the MEW inspection. Unchecking one sends it back to the MEW inspection list.
export default function MewInspectionPassedPage() {
  const { t } = useTranslation()
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
            onClick={() => navigate("/villas/mew-inspection")}
          >
            {t("mewInspectionPassed.backToInspection")}
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
                {t("mewInspectionPassed.passedOn")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("mewInspection.passed")}
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
                  {t("mewInspectionPassed.empty")}
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
                    {row.mewInspectionPassed ? (
                      <Badge tone="success">
                        {formatDateTime(row.mewInspectionPassed.at)}
                      </Badge>
                    ) : (
                      t("common.none")
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Checkbox
                      checked
                      disabled={!canEdit || busyId === row.id}
                      aria-label={t("mewInspectionPassed.takeBack", {
                        name: row.villaNumber,
                      })}
                      onCheckedChange={(checked) => {
                        if (checked === false) void takeBack(row)
                      }}
                    />
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
          {t("mewInspectionPassed.count", { count: meta.total })}
        </p>
      )}
    </>
  )
}
