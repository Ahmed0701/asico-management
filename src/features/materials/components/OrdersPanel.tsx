import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import VillasListFooter from "@/features/villas/components/VillasListFooter"
import { toApiError } from "@/shared/api/errors"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import { normalizeSearchInput } from "@/shared/lib/phone/phoneNormalize"
import ListToolbar, {
  clearedListParams,
  countActive,
} from "@/shared/list/ListToolbar"
import { parseListParams, setListParam } from "@/shared/query/listParams"
import { Checkbox } from "@/shared/ui/checkbox"
import { FilterSelect } from "@/shared/ui/Field"
import {
  FACTORY_TYPES,
  MATERIAL_ORDER_STATUSES,
  useMaterialOrdersQuery,
  type FactoryType,
  type MaterialOrder,
  type MaterialOrderStatus,
  type MaterialOrdersParams,
} from "../api"
import type { ListState } from "./BalancePanel"
import OrderDatesModal from "./OrderDatesModal"
import OrdersTable from "./OrdersTable"

/**
 * The Orders tab: every villa's switchgear and cables with their material request (MR), purchase order (PO) and due
 * dates, and whether all of it, part of it or none of it came. Late ones (due date passed, not all here) stand out.
 */
export default function OrdersPanel({
  onListState,
}: {
  onListState?: (state: ListState) => void
}) {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const canEdit = can("materials:update")
  const [searchParams, setSearchParams] = useSearchParams()
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(setListParam(searchParams, key, value))
  const params = useMemo<MaterialOrdersParams>(() => {
    const base = parseListParams(searchParams, { limit: 50 })
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const sort = searchParams.get("sort")
    return {
      page: base.page,
      limit: base.limit,
      search: base.search || undefined,
      type: FACTORY_TYPES.includes(type as FactoryType)
        ? type as FactoryType
        : undefined,
      status: MATERIAL_ORDER_STATUSES.includes(status as MaterialOrderStatus)
        ? status as MaterialOrderStatus
        : undefined,
      overdue: searchParams.get("overdue") === "true" || undefined,
      sort:
        sort === "dueDate:asc" || sort === "dueDate:desc" ? sort : undefined,
    }
  }, [searchParams])
  const { data, isLoading, isError, error } = useMaterialOrdersQuery(params)
  const [editing, setEditing] = useState<MaterialOrder | null>(null)

  useEffect(() => {
    onListState?.({ total: data?.meta.total, loading: isLoading })
  }, [onListState, data?.meta.total, isLoading])
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    normalizeSearchInput,
  )
  const rows = data?.data ?? []
  const meta = data?.meta
  const summary = data?.summary
  const dueSort =
    params.sort === "dueDate:asc"
      ? "asc"
      : params.sort === "dueDate:desc"
        ? "desc"
        : "none"

  const chips = summary
    ? [
        {
          key: "DELIVERED",
          label: t("materials.orders.statuses.DELIVERED"),
          count: summary.delivered,
          tone: "text-success",
        },
        {
          key: "PARTIAL",
          label: t("materials.orders.statuses.PARTIAL"),
          count: summary.partial,
          tone: "text-amber-600 dark:text-amber-400",
        },
        {
          key: "NOT_DELIVERED",
          label: t("materials.orders.statuses.NOT_DELIVERED"),
          count: summary.notDelivered,
          tone: "text-danger",
        },
      ]
    : []

  return (
    <div className="grid gap-3">
      <ListToolbar
        search={{
          value: searchDraft,
          onChange: setSearchDraft,
          placeholder: t("materials.balanceSearch"),
        }}
        count={meta?.total}
        activeCount={countActive(
          params.search,
          params.type,
          params.status,
          params.overdue,
        )}
        onClear={() => setSearchParams(clearedListParams(searchParams))}
        columns={3}
      >
        <FilterSelect
          label={t("materials.type")}
          value={params.type ?? ""}
          onChange={(v) => setParam("type", v || undefined)}
          options={FACTORY_TYPES.map((type) => ({
            value: type,
            label: t(`materials.types.${type}`),
          }))}
        />
        <FilterSelect
          label={t("materials.status")}
          value={params.status ?? ""}
          onChange={(v) => setParam("status", v || undefined)}
          options={MATERIAL_ORDER_STATUSES.map((status) => ({
            value: status,
            label: t(`materials.orders.statuses.${status}`),
          }))}
        />
        <label className="flex h-9 items-center gap-2 self-end text-sm">
          <Checkbox
            checked={params.overdue === true}
            onCheckedChange={(checked) =>
              setParam("overdue", checked === true ? "true" : undefined)
            }
          />
          {t("materials.orders.onlyOverdue")}
        </label>
      </ListToolbar>

      {summary && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {chips.map((chip) => (
            <li key={chip.key}>
              <button
                type="button"
                onClick={() =>
                  setParam(
                    "status",
                    params.status === chip.key ? undefined : chip.key,
                  )
                }
                aria-pressed={params.status === chip.key}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-start hover:bg-muted/40 aria-pressed:border-accent"
              >
                <span className="text-xs text-muted-foreground">
                  {chip.label}
                </span>
                <span
                  className={`text-lg font-semibold tabular-nums ${chip.tone}`}
                >
                  {chip.count}
                </span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() =>
                setParam("overdue", params.overdue ? undefined : "true")
              }
              aria-pressed={params.overdue === true}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-start hover:opacity-90 aria-pressed:border-danger"
            >
              <span className="text-xs text-danger">
                {t("materials.orders.overdue")}
              </span>
              <span className="text-lg font-semibold tabular-nums text-danger">
                {summary.overdue}
              </span>
            </button>
          </li>
        </ul>
      )}

      {isError && (
        <p
          role="alert"
          className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {toApiError(error).message}
        </p>
      )}

      <OrdersTable
        rows={rows}
        loading={isLoading}
        canEdit={canEdit}
        dueSort={dueSort}
        onSortDue={() =>
          setParam("sort", dueSort === "asc" ? "dueDate:desc" : "dueDate:asc")
        }
        onEdit={setEditing}
      />

      {meta && (
        <VillasListFooter
          meta={meta}
          onPageChange={(page) => setParam("page", String(page))}
          onPageSizeChange={(limit) => setParam("limit", String(limit))}
          onGoLastPage={() => setParam("page", String(meta.totalPages))}
        />
      )}
      {editing && (
        <OrderDatesModal order={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}
