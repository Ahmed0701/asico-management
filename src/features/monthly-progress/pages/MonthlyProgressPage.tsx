import { useCallback, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import ContractorSelect from "@/features/contractors/components/ContractorSelect"
import { formatBudgetDisplay } from "@/features/villas/api/budget"
import VillasListFooter from "@/features/villas/components/VillasListFooter"
import { toApiError } from "@/shared/api/errors"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import { normalizeSearchInput } from "@/shared/lib/phone/phoneNormalize"
import { toast } from "@/shared/lib/toast"
import { ImportWizardModal, IMPORT_RESOURCES } from "@/shared/import"
import Button from "@/shared/ui/Button"
import ListToolbar, {
  clearedListParams,
  countActive,
} from "@/shared/list/ListToolbar"
import { Checkbox } from "@/shared/ui/checkbox"
import { ConfirmModal } from "@/shared/ui/Modal"
import PageHeader from "@/shared/ui/PageHeader"
import ListPageHeaderActions from "@/shared/list/ListPageHeaderActions"
import { downloadExport } from "@/shared/export/downloadExport"
import {
  buildMonthlyProgressQueryParams,
  monthlyProgressKeys,
  useMonthlyProgressParams,
  useMonthlyProgressQuery,
  usePayVillaMutation,
  useUndoPaymentMutation,
  type MonthlyProgressItem,
  type MonthlyProgressSortField,
} from "../api"
import ContractorDuesCard from "../components/ContractorDuesCard"
import MonthlyProgressTable from "../components/MonthlyProgressTable"

/**
 * Monthly Payments: what each villa's contractor is owed now, the progress since the villa's last payment times its
 * Work Order Value, with the villa's last update and last payment; paying it records the progress paid up to, so the
 * next amount starts from there. And each contractor's total.
 */
export default function MonthlyProgressPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB"
  const { can } = usePermissions()
  const canPay = can("payments:create")
  const canUndo = can("payments:delete")
  const canExport = can("villas:export")
  const [toolbarParams, setToolbarParams] = useSearchParams()
  const { params, setParam, setPage, setLimit } = useMonthlyProgressParams()
  const { data, isLoading, isError, error } = useMonthlyProgressQuery(params)
  // The villas of the current filters and sort, with the totals: Excel or PDF, every column or the ones chosen.
  const onExport = useCallback(
    async (format: "xlsx" | "pdf", signal: AbortSignal) => {
      await downloadExport({
        path: "/monthly-progress/export",
        query: buildMonthlyProgressQueryParams(params, { forExport: true }),
        format,
        filenameStem: "monthly-payments",
        signal,
      })
    },
    [params],
  )
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    normalizeSearchInput,
  )
  const pay = usePayVillaMutation()
  const undo = useUndoPaymentMutation()
  const [paying, setPaying] = useState<MonthlyProgressItem | null>(null)
  const [undoing, setUndoing] = useState<MonthlyProgressItem | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const qc = useQueryClient()
  const busyId = pay.isPending
    ? (paying?.villa.id ?? null)
    : undo.isPending
      ? (undoing?.villa.id ?? null)
      : null

  const rows = data?.data ?? []
  const meta = data?.meta
  const summary = data?.summary
  const apiError = isError ? toApiError(error) : null
  const kwd = (minor: number) => formatBudgetDisplay(minor, "KWD", locale)

  // Each sortable header cycles ascending, descending; another header starts again ascending.
  const sortOf = (field: MonthlyProgressSortField): "asc" | "desc" | "none" => {
    const sort = params.sort ?? "villaNumber:asc"
    if (sort === `${field}:desc`) return "desc"
    if (sort === field || sort === `${field}:asc`) return "asc"
    return "none"
  }
  const onSort = (field: MonthlyProgressSortField) =>
    setParam("sort", sortOf(field) === "asc" ? `${field}:desc` : `${field}:asc`)

  const confirmPay = async () => {
    if (!paying) return
    try {
      const payment = await pay.mutateAsync(paying.villa.id)
      toast.success(
        t("monthlyProgress.paid", {
          amount: kwd(payment.amountMinor),
          name: paying.villa.villaNumber,
        }),
      )
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setPaying(null)
    }
  }

  const confirmUndo = async () => {
    if (!undoing?.lastPayment) return
    try {
      await undo.mutateAsync(undoing.lastPayment.id)
      toast.success(
        t("monthlyProgress.undone", { name: undoing.villa.villaNumber }),
      )
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setUndoing(null)
    }
  }

  return (
    <>
      <PageHeader
        title={t("monthlyProgress.title")}
        subtitle={t("monthlyProgress.subtitle")}
        actions={
          canPay || canExport ? (
            <>
              {canPay && (
                <Button
                  type="button"
                  size="sm"
                  icon="upload"
                  onClick={() => setImportOpen(true)}
                >
                  {t("monthlyProgress.importPrevious")}
                </Button>
              )}
              {canExport && (
                <ListPageHeaderActions
                  showImport={false}
                  exportAction={{
                    kind: "menu",
                    total: data?.meta.total,
                    listLoading: isLoading,
                    onExport,
                  }}
                />
              )}
            </>
          ) : undefined
        }
      />

      <ListToolbar
        search={{
          value: searchDraft,
          onChange: setSearchDraft,
          placeholder: t("monthlyProgress.searchPlaceholder"),
        }}
        count={meta?.total}
        activeCount={countActive(
          params.search,
          params.contractorId,
          !params.owed,
        )}
        onClear={() => setToolbarParams(clearedListParams(toolbarParams))}
        columns={2}
      >
        <ContractorSelect
          label={t("monthlyProgress.contractor")}
          value={params.contractorId ?? ""}
          onChange={(v) => setParam("contractorId", v || undefined)}
        />
        <label className="flex h-9 items-center gap-2 text-sm">
          <Checkbox
            checked={params.owed === true}
            onCheckedChange={(checked) =>
              setParam("all", checked === true ? undefined : "true")
            }
          />
          {t("monthlyProgress.onlyOwed")}
        </label>
      </ListToolbar>

      {summary && (
        <ContractorDuesCard
          summary={summary}
          selectedId={params.contractorId}
          onSelect={(id) => setParam("contractorId", id)}
        />
      )}

      {apiError && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {apiError.message}
        </p>
      )}

      <MonthlyProgressTable
        rows={rows}
        loading={isLoading}
        sortOf={sortOf}
        onSort={onSort}
        canPay={canPay}
        canUndo={canUndo}
        busyId={busyId}
        onPay={setPaying}
        onUndo={setUndoing}
      />

      {meta && (
        <VillasListFooter
          meta={meta}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          onGoLastPage={() => setPage(meta.totalPages)}
        />
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        {t("monthlyProgress.howItWorks")}
      </p>

      <ConfirmModal
        open={paying !== null}
        onClose={() => setPaying(null)}
        onConfirm={confirmPay}
        closeOnConfirm={false}
        title={t("monthlyProgress.payTitle")}
        confirmLabel={t("monthlyProgress.pay")}
        confirmVariant="primary"
        message={
          paying
            ? t("monthlyProgress.payBody", {
                amount: kwd(paying.dueMinor),
                contractor:
                  paying.contractor?.name ??
                  t("monthlyProgress.duesNoContractor"),
                name: paying.villa.villaNumber,
                from: paying.paidProgress,
                to: paying.currentProgress,
              })
            : ""
        }
        confirmPending={pay.isPending}
      />
      <ConfirmModal
        open={undoing !== null}
        onClose={() => setUndoing(null)}
        onConfirm={confirmUndo}
        closeOnConfirm={false}
        title={t("monthlyProgress.undoTitle")}
        confirmLabel={t("monthlyProgress.undo")}
        message={
          undoing?.lastPayment
            ? t("monthlyProgress.undoBody", {
                amount: kwd(undoing.lastPayment.amountMinor),
                name: undoing.villa.villaNumber,
              })
            : ""
        }
        confirmPending={undo.isPending}
      />
      <ImportWizardModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        config={IMPORT_RESOURCES["previous-payments"]}
        villaRowTargetNote
        onSuccess={() =>
          void qc.invalidateQueries({ queryKey: monthlyProgressKeys.all })
        }
      />
    </>
  )
}
