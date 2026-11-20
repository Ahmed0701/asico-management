import { useMemo, useState } from "react"
import { useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"
import { Receipt, Wallet } from "lucide-react"
import { usePermissions } from "@/features/auth/api"
import VillaOptionSelect from "@/features/open-works/components/VillaOptionSelect"
import { formatBudgetDisplay } from "@/features/villas/api/budget"
import VillasListFooter from "@/features/villas/components/VillasListFooter"
import { toApiError } from "@/shared/api/errors"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import { toast } from "@/shared/lib/toast"
import { normalizeSearchInput } from "@/shared/lib/phone/phoneNormalize"
import { parseListParams, setListParam } from "@/shared/query/listParams"
import Button from "@/shared/ui/Button"
import { FilterSelect } from "@/shared/ui/Field"
import ListToolbar, {
  clearedListParams,
  countActive,
} from "@/shared/list/ListToolbar"
import { ConfirmModal } from "@/shared/ui/Modal"
import { Card } from "@/shared/ui/PageHeader"
import {
  EXPENSE_SORT_PATTERN,
  EXPENSE_TYPES,
  useDeleteExpenseMutation,
  useOverheadExpensesQuery,
  type ExpenseType,
  type OverheadExpense,
  type OverheadExpenseListParams,
} from "../api"
import ExpenseFilesModal from "./ExpenseFilesModal"
import ExpenseFormModal from "./ExpenseFormModal"
import ExpensesTable from "./ExpensesTable"

/** null: closed; no expense: adding one. */
type FormState = { expense?: OverheadExpense } | null

const isType = (value: string | null): value is ExpenseType =>
  (EXPENSE_TYPES as readonly string[]).includes(value ?? "")

/**
 * The additional expenses (invoices, purchases, transport and others), each for one villa: they add to that villa's
 * budget as its Additional Expenses.
 */
export default function ExpensesPanel({ locale }: { locale: string }) {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo<OverheadExpenseListParams>(() => {
    const base = parseListParams(searchParams, { limit: 20 })
    const sort = searchParams.get("sort") ?? ""
    const type = searchParams.get("type")
    return {
      page: base.page,
      limit: base.limit,
      search: base.search || undefined,
      villaId: searchParams.get("villaId") || undefined,
      type: isType(type) ? type : undefined,
      sort: EXPENSE_SORT_PATTERN.test(sort) ? sort : undefined,
    }
  }, [searchParams])
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(setListParam(searchParams, key, value))
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    normalizeSearchInput,
  )
  const query = useOverheadExpensesQuery(params)
  const remove = useDeleteExpenseMutation()
  const [form, setForm] = useState<FormState>(null)
  const [deleting, setDeleting] = useState<OverheadExpense | null>(null)
  // The id, so the modal shows the expense as the list reads it again after an upload.
  const [filesOf, setFilesOf] = useState<string | null>(null)

  const rows = query.data?.data ?? []
  const meta = query.data?.meta
  const totals = query.data?.totals
  const filesExpense = rows.find((row) => row.id === filesOf)

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync({ id: deleting.id, version: deleting.version })
      toast.success(t("overhead.expenses.deleted"))
      setDeleting(null)
    } catch (err) {
      const parsed = toApiError(err)
      if (parsed.status === 404) {
        setDeleting(null)
        void query.refetch()
      }
      toast.error(parsed.message)
    }
  }

  return (
    <>
      {totals && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <Card className="flex items-center gap-3 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
              <Receipt size={18} strokeWidth={1.9} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">
                {t("overhead.expenses.summaryCount")}
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {totals.count}
              </p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
              <Wallet size={18} strokeWidth={1.9} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">
                {t("overhead.expenses.summaryTotal")}
              </p>
              <p className="text-lg font-semibold tabular-nums" dir="ltr">
                {formatBudgetDisplay(totals.amountMinor, "KWD", locale)}
              </p>
            </div>
          </Card>
        </div>
      )}

      <ListToolbar
        search={{
          value: searchDraft,
          onChange: setSearchDraft,
          placeholder: t("overhead.expenses.searchPlaceholder"),
        }}
        count={meta?.total}
        activeCount={countActive(params.search, params.villaId, params.type)}
        onClear={() => setSearchParams(clearedListParams(searchParams))}
        columns={2}
        actions={
          can("overhead:create") && (
            <Button
              type="button"
              size="sm"
              variant="primary"
              icon="plus"
              onClick={() => setForm({})}
            >
              {t("overhead.expenses.add")}
            </Button>
          )
        }
      >
        <VillaOptionSelect
          label={t("overhead.expenses.villa")}
          value={params.villaId ?? ""}
          onChange={(villaId) => setParam("villaId", villaId || undefined)}
        />
        <FilterSelect
          label={t("overhead.expenses.type")}
          value={params.type ?? ""}
          onChange={(type) => setParam("type", type || undefined)}
          options={EXPENSE_TYPES.map((type) => ({
            value: type,
            label: t(`overhead.expenses.types.${type}`),
          }))}
        />
      </ListToolbar>

      {query.isError && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {toApiError(query.error).message}
        </p>
      )}

      <ExpensesTable
        rows={rows}
        loading={query.isLoading}
        sort={params.sort}
        onSort={(next) => setParam("sort", next)}
        locale={locale}
        canEdit={can("overhead:update")}
        canDelete={can("overhead:delete")}
        onEdit={(expense) => setForm({ expense })}
        onDelete={setDeleting}
        onFiles={(expense) => setFilesOf(expense.id)}
      />

      {meta && (
        <VillasListFooter
          meta={meta}
          onPageChange={(page) => setParam("page", String(page))}
          onPageSizeChange={(limit) => setParam("limit", String(limit))}
          onGoLastPage={() => setParam("page", String(meta.totalPages))}
        />
      )}

      {form && (
        <ExpenseFormModal
          expense={form.expense}
          onClose={() => setForm(null)}
        />
      )}

      {filesExpense && (
        <ExpenseFilesModal
          expense={filesExpense}
          canEdit={can("overhead:update")}
          onClose={() => setFilesOf(null)}
        />
      )}

      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        closeOnConfirm={false}
        title={t("overhead.expenses.deleteTitle")}
        message={t("overhead.expenses.deleteBody", {
          name: deleting?.description ?? "",
        })}
        confirmPending={remove.isPending}
      />
    </>
  )
}
