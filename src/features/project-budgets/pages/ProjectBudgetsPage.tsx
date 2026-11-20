import { useMemo, useState } from "react"
import { useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"
import {
  CircleAlert,
  Coins,
  FilePlus2,
  Landmark,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { usePermissions } from "@/features/auth/api"
import { formatBudgetDisplay } from "@/features/villas/api/budget"
import {
  FINANCE_FIELDS,
  formatSharePercent,
  useVillaFinanceListQuery,
  type VillaFinanceListItem,
  type VillaFinanceListParams,
} from "@/features/villas/api/villa-finance"
import VillaFinanceForm, {
  FINANCE_LABEL_KEYS,
} from "@/features/villas/components/VillaFinanceForm"
import VillasListFooter from "@/features/villas/components/VillasListFooter"
import SalaryAllocationCard from "../components/SalaryAllocationCard"
import { toApiError } from "@/shared/api/errors"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import { cn } from "@/shared/lib/cn"
import { normalizeSearchInput } from "@/shared/lib/phone/phoneNormalize"
import { VillaCell } from "@/shared/list/cells"
import SortableHead from "@/shared/list/SortableHead"
import { parseListParams, setListParam } from "@/shared/query/listParams"
import { IconButton } from "@/shared/ui/Button"
import { RowActions } from "@/shared/ui/DataTable"
import { TableBodySkeleton } from "@/shared/ui/loading-skeletons"
import Modal from "@/shared/ui/Modal"
import PageHeader, { Card } from "@/shared/ui/PageHeader"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import ListToolbar, {
  clearedListParams,
  countActive,
} from "@/shared/list/ListToolbar"

const SORT_PATTERN =
  /^(villaNumber|totalBudget|totalCosts|remaining)(:(asc|desc))?$/

type TileProps = {
  icon: LucideIcon
  label: string
  value: string
  tone?: "accent" | "danger" | "success" | "neutral"
}

const TONES = {
  accent: "bg-accent/10 text-accent",
  danger: "bg-danger-soft text-danger",
  success: "bg-success-soft text-success",
  neutral: "bg-muted text-muted-foreground",
} as const

function Tile({ icon: TileIcon, label, value, tone = "neutral" }: TileProps) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          TONES[tone],
        )}
      >
        <TileIcon size={18} strokeWidth={1.9} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-lg font-semibold tabular-nums" dir="ltr">
          {value}
        </p>
      </div>
    </Card>
  )
}

/**
 * Every villa's budget figures in one list: budget, variation orders and the total, the four costs, and what remains.
 * Reads and writes the same figures as each villa's Villa Budget card.
 */
export default function ProjectBudgetsPage() {
  const { t, i18n } = useTranslation()
  const [toolbarParams, setToolbarParams] = useSearchParams()
  const locale = i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB"
  const { can } = usePermissions()
  const canEdit = can("villas:update")
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo<VillaFinanceListParams>(() => {
    const base = parseListParams(searchParams, { limit: 20 })
    const sort = searchParams.get("sort") ?? ""
    return {
      page: base.page,
      limit: base.limit,
      search: base.search || undefined,
      sort: SORT_PATTERN.test(sort) ? sort : undefined,
    }
  }, [searchParams])
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(setListParam(searchParams, key, value))
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    normalizeSearchInput,
  )
  const query = useVillaFinanceListQuery(params)
  const [editing, setEditing] = useState<VillaFinanceListItem | null>(null)

  const rows = query.data?.data ?? []
  const meta = query.data?.meta
  const summary = query.data?.summary
  const kwd = (minor: number | null) =>
    minor === null ? "-" : formatBudgetDisplay(minor, "KWD", locale)
  const columnCount = 11 + (canEdit ? 1 : 0)

  return (
    <>
      <PageHeader
        title={t("projectBudgets.title")}
        subtitle={t("projectBudgets.subtitle")}
      />

      {summary && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Tile
            icon={Landmark}
            label={t("projectBudgets.summaryBudgets")}
            value={kwd(summary.budgetMinor)}
          />
          <Tile
            icon={FilePlus2}
            label={t("villas.finance.variationOrders")}
            value={kwd(summary.variationOrdersMinor)}
          />
          <Tile
            icon={Wallet}
            label={t("villas.finance.totalBudget")}
            value={kwd(summary.totalBudgetMinor)}
            tone="accent"
          />
          <Tile
            icon={Coins}
            label={t("villas.finance.totalCosts")}
            value={kwd(summary.totalCostsMinor)}
          />
          <Tile
            icon={CircleAlert}
            label={t("projectBudgets.overBudget")}
            value={String(summary.overBudgetCount)}
            tone={summary.overBudgetCount > 0 ? "danger" : "success"}
          />
        </div>
      )}

      {summary && (
        <SalaryAllocationCard
          overheadSalariesMinor={summary.overheadSalariesMinor}
          allocatedShareBp={summary.allocatedShareBp}
          locale={locale}
        />
      )}

      <ListToolbar
        search={{
          value: searchDraft,
          onChange: setSearchDraft,
          placeholder: t("projectBudgets.searchPlaceholder"),
        }}
        count={meta?.total}
        activeCount={countActive(params.search)}
        onClear={() => setToolbarParams(clearedListParams(toolbarParams))}
      />

      {query.isError && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {toApiError(query.error).message}
        </p>
      )}

      <div className="list-surface overflow-x-auto">
        <Table className="min-w-300">
          <TableHeader>
            <TableRow className="list-head-row">
              <SortableHead
                label={t("villas.villaNumber")}
                field="villaNumber"
                sort={params.sort}
                onSort={(next) => setParam("sort", next)}
              />
              <TableHead className="px-4 py-2.5 text-end">
                {t("villas.finance.budget")}
              </TableHead>
              <TableHead className="px-4 py-2.5 text-end">
                {t("villas.finance.variationOrders")}
              </TableHead>
              <SortableHead
                label={t("villas.finance.totalBudget")}
                field="totalBudget"
                sort={params.sort}
                onSort={(next) => setParam("sort", next)}
                className="text-end"
              />
              {FINANCE_FIELDS.map((field) => (
                <TableHead key={field} className="px-4 py-2.5 text-end">
                  {t(FINANCE_LABEL_KEYS[field])}
                </TableHead>
              ))}
              <SortableHead
                label={t("villas.finance.totalCosts")}
                field="totalCosts"
                sort={params.sort}
                onSort={(next) => setParam("sort", next)}
                className="text-end"
              />
              <SortableHead
                label={t("villas.finance.remaining")}
                field="remaining"
                sort={params.sort}
                onSort={(next) => setParam("sort", next)}
                className="text-end"
              />
              {canEdit && (
                <TableHead className="px-4 py-2.5">
                  <span className="sr-only">{t("common.actions")}</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && rows.length === 0 ? (
              <TableBodySkeleton columns={columnCount} rows={8} />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  {t("projectBudgets.empty")}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const over =
                  row.remainingMinor !== null && row.remainingMinor < 0
                const used =
                  row.totalBudgetMinor && row.totalBudgetMinor > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (row.totalCostsMinor / row.totalBudgetMinor) * 100,
                        ),
                      )
                    : null
                return (
                  <TableRow
                    key={row.villaId}
                    tone={over ? "danger" : undefined}
                  >
                    <TableCell className="px-4 py-3">
                      <VillaCell
                        id={row.villa.id}
                        villaNumber={row.villa.villaNumber}
                        sub={row.villa.location}
                      />
                    </TableCell>
                    <TableCell
                      className="px-4 py-3 text-end tabular-nums"
                      dir="ltr"
                    >
                      {row.budgetMinor === null
                        ? "-"
                        : formatBudgetDisplay(
                            row.budgetMinor,
                            row.currency ?? "KWD",
                            locale,
                          )}
                    </TableCell>
                    <TableCell
                      className="px-4 py-3 text-end tabular-nums text-muted-foreground"
                      dir="ltr"
                    >
                      {row.variationOrdersMinor > 0
                        ? `+ ${kwd(row.variationOrdersMinor)}`
                        : "-"}
                    </TableCell>
                    <TableCell
                      className="px-4 py-3 text-end font-semibold tabular-nums"
                      dir="ltr"
                    >
                      {kwd(row.totalBudgetMinor)}
                    </TableCell>
                    {FINANCE_FIELDS.map((field) => (
                      <TableCell
                        key={field}
                        className="px-4 py-3 text-end tabular-nums"
                        dir="ltr"
                      >
                        {kwd(row[field])}
                        {field === "salariesMinor" &&
                          row.salaryShareBp !== null && (
                            <span className="block text-xs text-muted-foreground">
                              {formatSharePercent(row.salaryShareBp)}%
                            </span>
                          )}
                      </TableCell>
                    ))}
                    <TableCell
                      className="px-4 py-3 text-end font-semibold tabular-nums"
                      dir="ltr"
                    >
                      {kwd(row.totalCostsMinor)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-end">
                      <span
                        className={cn(
                          "font-semibold tabular-nums",
                          row.remainingMinor !== null &&
                            (over ? "text-danger" : "text-success"),
                        )}
                        dir="ltr"
                      >
                        {kwd(row.remainingMinor)}
                      </span>
                      {used !== null && (
                        <div
                          className="ms-auto mt-1 h-1 w-24 overflow-hidden rounded-full bg-progress-track"
                          title={`${used}%`}
                        >
                          <div
                            className={cn(
                              "h-full rounded-full",
                              over ? "bg-danger" : "bg-accent",
                            )}
                            style={{ width: `${used}%` }}
                          />
                        </div>
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="px-4 py-3">
                        <RowActions>
                          <IconButton
                            icon="edit"
                            label={t("projectBudgets.editOf", {
                              name: row.villa.villaNumber,
                            })}
                            onClick={() => setEditing(row)}
                          />
                        </RowActions>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {meta && (
        <VillasListFooter
          meta={meta}
          onPageChange={(page) => setParam("page", String(page))}
          onPageSizeChange={(limit) => setParam("limit", String(limit))}
          onGoLastPage={() => setParam("page", String(meta.totalPages))}
        />
      )}

      {editing && (
        <Modal
          open
          onClose={() => setEditing(null)}
          title={t("projectBudgets.editTitle", {
            name: editing.villa.villaNumber,
          })}
        >
          <VillaFinanceForm finance={editing} onDone={() => setEditing(null)} />
        </Modal>
      )}
    </>
  )
}
