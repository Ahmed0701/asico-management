import { useEffect, useMemo } from "react"
import { Link, useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"
import VillasListFooter from "@/features/villas/components/VillasListFooter"
import { toApiError } from "@/shared/api/errors"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import { normalizeSearchInput } from "@/shared/lib/phone/phoneNormalize"
import { parseListParams, setListParam } from "@/shared/query/listParams"
import { FilterSelect, SearchInput } from "@/shared/ui/Field"
import { TableBodySkeleton } from "@/shared/ui/loading-skeletons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import {
  BALANCE_STATUSES,
  FACTORY_TYPES,
  useBalanceQuery,
  useItemsQuery,
  type BalanceListParams,
  type BalanceStatus,
  type FactoryType,
} from "../api"
import { formatQuantity } from "./DeliveriesTable"
import BalanceStatusBadge from "./BalanceStatusBadge"

const COLUMNS = 6

/**
 * The balance list: every villa and material it needs, against what its delivery notes brought. It opens on what is still
 * to come; the totals above add the missing quantities up per material, over every page.
 */
export type ListState = {
  total: number | undefined
  loading: boolean
}

export default function BalancePanel({
  onListState,
}: {
  onListState?: (state: ListState) => void
}) {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(setListParam(searchParams, key, value))
  const params = useMemo<BalanceListParams>(() => {
    const base = parseListParams(searchParams, { limit: 50 })
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    return {
      page: base.page,
      limit: base.limit,
      search: base.search || undefined,
      itemId: searchParams.get("itemId") || undefined,
      type: FACTORY_TYPES.includes(type as FactoryType)
        ? type as FactoryType
        : undefined,
      // "all" shows every status; nothing chosen shows what is still to come.
      status:
        status === "all"
          ? undefined
          : BALANCE_STATUSES.includes(status as BalanceStatus)
            ? status as BalanceStatus
            : "PENDING",
    }
  }, [searchParams])
  const { data, isLoading, isError, error } = useBalanceQuery(params)
  const catalog = useItemsQuery()

  // The page's Export button needs the number of rows the filters match.
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
  const totals = data?.totals ?? []
  const noRequirements =
    (catalog.data ?? []).length > 0 &&
    (catalog.data ?? []).every((i) => i.requiredPerVilla === 0)

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_repeat(3,180px)] lg:items-end">
        <SearchInput
          value={searchDraft}
          onChange={setSearchDraft}
          placeholder={t("materials.balanceSearch")}
        />
        <FilterSelect
          label={t("materials.type")}
          value={params.type ?? ""}
          onChange={(v) => {
            const next = setListParam(searchParams, "type", v || undefined)
            next.delete("itemId")
            setSearchParams(next)
          }}
          options={FACTORY_TYPES.map((type) => ({
            value: type,
            label: t(`materials.types.${type}`),
          }))}
        />
        <FilterSelect
          label={t("materials.material")}
          value={params.itemId ?? ""}
          onChange={(v) => setParam("itemId", v || undefined)}
          options={(catalog.data ?? [])
            .filter((i) => !params.type || i.type === params.type)
            .map((i) => ({ value: i.id, label: i.name }))}
        />
        <FilterSelect
          label={t("materials.status")}
          value={params.status ?? "all"}
          onChange={(v) => setParam("status", v || "all")}
          options={[
            ...BALANCE_STATUSES.map((status) => ({
              value: status,
              label: t(`materials.statuses.${status}`),
            })),
            { value: "all", label: t("materials.allStatuses") },
          ]}
        />
      </div>

      {noRequirements && (
        <p className="rounded-lg border border-progress/40 bg-progress-soft px-3 py-2 text-sm">
          {t("materials.setRequiredHint")}
        </p>
      )}

      {params.status === "PENDING" && totals.length > 0 && (
        <section aria-label={t("materials.stillToCome")} className="grid gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("materials.stillToCome")}
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {totals.map((row) => (
              <li key={row.item.id}>
                <button
                  type="button"
                  onClick={() => setParam("itemId", row.item.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-start hover:bg-muted/40"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm" dir="auto">
                      {row.item.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("materials.villasWaiting", { count: row.villas })}
                    </span>
                  </span>
                  <span className="shrink-0 text-lg font-semibold tabular-nums text-danger">
                    {formatQuantity(row.balance, row.item.unit)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {isError && (
        <p
          role="alert"
          className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {toApiError(error).message}
        </p>
      )}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <TableHead className="px-4 py-2.5">
                  {t("materials.villa")}
                </TableHead>
                <TableHead className="px-4 py-2.5">
                  {t("materials.material")}
                </TableHead>
                <TableHead className="px-4 py-2.5 text-end">
                  {t("materials.required")}
                </TableHead>
                <TableHead className="px-4 py-2.5 text-end">
                  {t("materials.delivered")}
                </TableHead>
                <TableHead className="px-4 py-2.5 text-end">
                  {t("materials.balance")}
                </TableHead>
                <TableHead className="px-4 py-2.5">
                  {t("materials.status")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && rows.length === 0 ? (
                <TableBodySkeleton columns={COLUMNS} rows={8} />
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={COLUMNS}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    {params.status === "PENDING"
                      ? t("materials.balanceEmptyPending")
                      : t("materials.balanceEmpty")}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow
                    key={`${row.villa.id}-${row.item.id}`}
                    className="hover:bg-muted/40"
                  >
                    <TableCell className="px-4 py-3 font-medium tabular-nums">
                      <Link
                        to={`/villas/${row.villa.id}?tab=materials`}
                        className="hover:underline"
                      >
                        {row.villa.villaNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm" dir="auto">
                      {row.item.name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-end text-sm tabular-nums">
                      {formatQuantity(row.required, row.item.unit)}
                      {row.custom && (
                        <span
                          className="ms-1 text-xs text-accent"
                          title={t("materials.customRequired")}
                        >
                          *
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-end text-sm tabular-nums">
                      {formatQuantity(row.delivered, row.item.unit)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-end text-sm font-semibold tabular-nums">
                      {formatQuantity(row.balance, row.item.unit)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <BalanceStatusBadge status={row.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {meta && (
        <VillasListFooter
          meta={meta}
          onPageChange={(page) =>
            setSearchParams(setListParam(searchParams, "page", page))
          }
          onPageSizeChange={(limit) =>
            setSearchParams(setListParam(searchParams, "limit", limit))
          }
          onGoLastPage={() =>
            setSearchParams(setListParam(searchParams, "page", meta.totalPages))
          }
        />
      )}
      <p className="text-xs text-muted-foreground">
        {t("materials.balanceFootnote")}
      </p>
    </div>
  )
}
