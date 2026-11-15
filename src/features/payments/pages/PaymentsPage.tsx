import { useCallback, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import ContractorSelect from "@/features/contractors/components/ContractorSelect"
import VillaOptionSelect from "@/features/open-works/components/VillaOptionSelect"
import { formatBudgetDisplay } from "@/features/villas/api/budget"
import VillasListFooter from "@/features/villas/components/VillasListFooter"
import { toApiError } from "@/shared/api/errors"
import { downloadExport } from "@/shared/export/downloadExport"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import { ImportWizardModal, IMPORT_RESOURCES } from "@/shared/import"
import { formatCalendarDateUtc } from "@/shared/lib/formatCalendarDateUtc"
import { normalizeSearchInput } from "@/shared/lib/phone/phoneNormalize"
import { toast } from "@/shared/lib/toast"
import ListPageHeaderActions from "@/shared/list/ListPageHeaderActions"
import { Badge } from "@/shared/ui/Badge"
import Button, { IconButton } from "@/shared/ui/Button"
import { Checkbox } from "@/shared/ui/checkbox"
import { FilterSelect, SearchInput } from "@/shared/ui/Field"
import Icon from "@/shared/ui/Icon"
import { TableBodySkeleton } from "@/shared/ui/loading-skeletons"
import { ConfirmModal } from "@/shared/ui/Modal"
import PageHeader, { Card } from "@/shared/ui/PageHeader"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import {
  buildPaymentsQueryParams,
  paymentsKeys,
  PAYMENT_STATUSES,
  useDeletePaymentMutation,
  usePaymentsListParams,
  usePaymentsListQuery,
  useUpdatePaymentMutation,
  type Payment,
  type PaymentStatus,
} from "../api"
import PaymentFilesModal from "../components/PaymentFilesModal"
import PaymentFormModal from "../components/PaymentFormModal"

const day = (value: string | null) =>
  value ? formatCalendarDateUtc(`${value}T00:00:00.000Z`) : "-"

type SortField = "villaNumber" | "amount" | "dueDate"

type SortHeadProps = {
  field: SortField
  label: string
}

/** Payments to contractors: what is still to pay (overdue ones reminded daily), what was paid, their receipts and invoices. */
export default function PaymentsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB"
  const kwd = (minor: number) => formatBudgetDisplay(minor, "KWD", locale)
  const { can } = usePermissions()
  const canCreate = can("payments:create")
  const canUpdate = can("payments:update")
  const canDelete = can("payments:delete")
  const qc = useQueryClient()
  const { params, setParam, setPage, setLimit } = usePaymentsListParams()
  const { data, isLoading, isError, error, refetch } =
    usePaymentsListQuery(params)
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    normalizeSearchInput,
  )
  const update = useUpdatePaymentMutation()
  const remove = useDeletePaymentMutation()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editing, setEditing] = useState<Payment | undefined>()
  const [deleting, setDeleting] = useState<Payment | null>(null)
  const [filesOf, setFilesOf] = useState<string | null>(null)

  const rows = data?.data ?? []
  const meta = data?.meta
  const totals = data?.totals
  const apiError = isError ? toApiError(error) : null
  const filesPayment = rows.find((row) => row.id === filesOf) ?? null
  const showActions = canUpdate || canDelete
  const columnCount = 10 + (showActions ? 1 : 0)

  // Each sortable header cycles ascending, descending; another header starts again ascending.
  const sortOf = (field: SortField): "asc" | "desc" | "none" =>
    params.sort === `${field}:desc`
      ? "desc"
      : params.sort === field || params.sort === `${field}:asc`
        ? "asc"
        : "none"
  const toggleSort = (field: SortField) =>
    setParam("sort", sortOf(field) === "asc" ? `${field}:desc` : `${field}:asc`)

  const onExport = useCallback(
    async (format: "xlsx" | "pdf", signal: AbortSignal) => {
      const query = buildPaymentsQueryParams(params)
      delete query.page
      delete query.limit
      await downloadExport({
        path: "/payments/export",
        query,
        format,
        filenameStem: "payments",
        signal,
      })
    },
    [params],
  )

  // Paid: the paid date is today unless one was set; pending again clears it.
  const toggleStatus = async (row: Payment, next: PaymentStatus) => {
    setBusyId(row.id)
    try {
      await update.mutateAsync({
        id: row.id,
        input: { status: next },
        write: { ifMatch: row.version },
      })
      toast.success(
        t(next === "PAID" ? "payments.markedPaid" : "payments.markedPending", {
          name: row.contractor.name,
        }),
      )
    } catch (err) {
      toast.error(toApiError(err).message)
      void refetch()
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync({ id: deleting.id, version: deleting.version })
      toast.success(t("payments.deleted"))
    } catch (err) {
      toast.error(toApiError(err).message)
      void refetch()
    } finally {
      setDeleting(null)
    }
  }

  const SortHead = ({ field, label }: SortHeadProps) => {
    const mode = sortOf(field)
    return (
      <TableHead
        className="px-4 py-2.5"
        aria-sort={
          mode === "desc" ? "descending" : mode === "asc" ? "ascending" : "none"
        }
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto px-0 py-0 text-xs uppercase tracking-wide hover:bg-transparent"
          onClick={() => toggleSort(field)}
        >
          {label}
          <Icon
            name={
              mode === "desc" ? "sortDesc" : mode === "asc" ? "sortAsc" : "sort"
            }
            size={14}
          />
        </Button>
      </TableHead>
    )
  }

  return (
    <>
      <PageHeader
        title={t("payments.title")}
        subtitle={t("payments.subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ListPageHeaderActions
              showImport={canCreate}
              importLabel={t("payments.import")}
              importAction={
                canCreate
                  ? {
                      kind: "button",
                      label: t("payments.import"),
                      onClick: () => setImportOpen(true),
                    }
                  : undefined
              }
              exportAction={{
                kind: "menu",
                total: meta?.total,
                listLoading: isLoading,
                onExport,
              }}
            />
            {canCreate && (
              <Button
                type="button"
                size="sm"
                variant="primary"
                icon="plus"
                onClick={() => {
                  setEditing(undefined)
                  setFormOpen(true)
                }}
              >
                {t("payments.add")}
              </Button>
            )}
          </div>
        }
      />

      {totals && (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">
              {t("payments.totalPending")}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {kwd(totals.pendingMinor)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">
              {t("payments.totalOverdue")}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-danger">
              {kwd(totals.overdueMinor)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">
              {t("payments.totalPaid")}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-success">
              {kwd(totals.paidMinor)}
            </p>
          </Card>
        </div>
      )}

      <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_170px_220px_200px_auto] lg:items-end">
        <SearchInput
          value={searchDraft}
          onChange={setSearchDraft}
          placeholder={t("payments.searchPlaceholder")}
        />
        <FilterSelect
          label={t("payments.status")}
          value={params.status ?? ""}
          onChange={(v) => setParam("status", v || undefined)}
          options={PAYMENT_STATUSES.map((status) => ({
            value: status,
            label: t(`payments.statuses.${status}`),
          }))}
        />
        <ContractorSelect
          label={t("payments.contractor")}
          value={params.contractorId ?? ""}
          onChange={(v) => setParam("contractorId", v || undefined)}
        />
        <VillaOptionSelect
          label={t("payments.villaNumber")}
          value={params.villaId ?? ""}
          onChange={(v) => setParam("villaId", v || undefined)}
        />
        <label className="flex h-9 items-center gap-2 text-sm">
          <Checkbox
            checked={params.overdue === true}
            onCheckedChange={(checked) =>
              setParam("overdue", checked === true ? "true" : undefined)
            }
          />
          {t("payments.overdueOnly")}
        </label>
      </div>

      {apiError && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {apiError.message}
        </p>
      )}

      <div className="list-surface overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="list-head-row">
              <TableHead className="px-4 py-2.5">
                {t("payments.contractor")}
              </TableHead>
              <SortHead field="villaNumber" label={t("payments.villaNumber")} />
              <SortHead field="amount" label={t("payments.amount")} />
              <TableHead className="px-4 py-2.5">
                {t("payments.status")}
              </TableHead>
              <SortHead field="dueDate" label={t("payments.dueDate")} />
              <TableHead className="px-4 py-2.5">
                {t("payments.paidDate")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("payments.method")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("payments.reference")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("payments.files")}
              </TableHead>
              <TableHead className="px-4 py-2.5">
                {t("payments.paid")}
              </TableHead>
              {showActions && (
                <TableHead className="px-4 py-2.5">
                  <span className="sr-only">{t("common.actions")}</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              <TableBodySkeleton columns={columnCount} rows={8} />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  {t("payments.empty")}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/40">
                  <TableCell className="px-4 py-3 font-medium" dir="auto">
                    {row.contractor.name}
                  </TableCell>
                  <TableCell className="px-4 py-3 tabular-nums">
                    {row.villa ? (
                      <Link
                        to={`/villas/${row.villa.id}`}
                        className="hover:underline"
                      >
                        {row.villa.villaNumber}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">
                        {t("payments.general")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm font-medium tabular-nums">
                    {kwd(row.amountMinor)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {row.overdue ? (
                      <Badge tone="danger">{t("payments.overdue")}</Badge>
                    ) : row.status === "PAID" ? (
                      <Badge tone="success">
                        {t("payments.statuses.PAID")}
                      </Badge>
                    ) : (
                      <Badge tone="warn">
                        {t("payments.statuses.PENDING")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm tabular-nums">
                    {day(row.dueDate)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm tabular-nums">
                    {day(row.paidDate)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm">
                    {row.method ? t(`payments.methods.${row.method}`) : "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm" dir="auto">
                    {row.reference ?? "-"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Button
                      type="button"
                      size="sm"
                      icon="file"
                      onClick={() => setFilesOf(row.id)}
                    >
                      {row.files.length}
                    </Button>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Checkbox
                      checked={row.status === "PAID"}
                      disabled={!canUpdate || busyId === row.id}
                      aria-label={t("payments.markPaidOf", {
                        name: row.contractor.name,
                      })}
                      onCheckedChange={(checked) =>
                        void toggleStatus(
                          row,
                          checked === true ? "PAID" : "PENDING",
                        )
                      }
                    />
                  </TableCell>
                  {showActions && (
                    <TableCell className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {canUpdate && (
                          <IconButton
                            icon="edit"
                            label={t("common.edit")}
                            onClick={() => {
                              setEditing(row)
                              setFormOpen(true)
                            }}
                          />
                        )}
                        {canDelete && (
                          <IconButton
                            icon="trash"
                            label={t("common.delete")}
                            variant="danger"
                            onClick={() => setDeleting(row)}
                          />
                        )}
                      </div>
                    </TableCell>
                  )}
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
          {t("payments.count", { count: meta.total })}
        </p>
      )}

      <PaymentFormModal
        open={formOpen}
        item={editing}
        onClose={() => setFormOpen(false)}
      />
      <PaymentFilesModal
        payment={filesPayment}
        canEdit={canUpdate}
        onClose={() => setFilesOf(null)}
      />
      <ImportWizardModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        config={IMPORT_RESOURCES.payments}
        onSuccess={() =>
          void qc.invalidateQueries({ queryKey: paymentsKeys.all })
        }
      />
      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={t("payments.deleteTitle")}
        message={t("payments.deleteBody", {
          name: deleting?.contractor.name ?? "",
          amount: deleting ? kwd(deleting.amountMinor) : "",
        })}
        confirmLabel={t("common.delete")}
        confirmPending={remove.isPending}
      />
    </>
  )
}
