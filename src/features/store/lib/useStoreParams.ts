import { useMemo } from "react"
import { useSearchParams } from "react-router"
import { parseListParams, setListParam } from "@/shared/query/listParams"
import {
  STORE_CATEGORIES,
  STORE_MOVEMENT_KINDS,
  type StoreCategory,
  type StoreItemsParams,
  type StoreMovementKind,
  type StoreMovementsParams,
} from "../api"

export type StoreTab = "stock" | "movements"
/** Which items the stock list shows: all of them (default), the active ones, the low ones, or the inactive ones. */
export type StoreView = "active" | "low" | "inactive" | "all"

const SORT = /^(name|category|quantity|createdAt)(:(asc|desc))?$/
const VIEWS: StoreView[] = ["all", "active", "low", "inactive"]

const pick = <T extends string,>(
  list: readonly T[],
  value: string | null,
): T | undefined => (list.includes(value as T) ? value as T : undefined)

/** The store page's tab, filters, page and sort, from the URL. Each tab has its own filters; switching clears them. */
export function useStoreParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  // The store the page shows (a store's id); missing: the first store.
  const store = searchParams.get("store") || undefined
  const tab: StoreTab =
    searchParams.get("tab") === "movements" ? "movements" : "stock"
  const view: StoreView = pick(VIEWS, searchParams.get("view")) ?? "all"

  const items = useMemo<StoreItemsParams>(() => {
    const base = parseListParams(searchParams, { limit: 20 })
    const sort = searchParams.get("sort") ?? ""
    return {
      page: base.page,
      limit: base.limit,
      search: base.search || undefined,
      sort: SORT.test(sort) ? sort : undefined,
      category: pick<StoreCategory>(
        STORE_CATEGORIES,
        searchParams.get("category"),
      ),
      warehouseId: store,
      ...(view === "low" && { low: true }),
      ...(view === "active" && { active: true }),
      ...(view === "inactive" && { active: false }),
    }
  }, [searchParams, view, store])

  const movements = useMemo<StoreMovementsParams>(() => {
    const base = parseListParams(searchParams, { limit: 20 })
    return {
      page: base.page,
      limit: base.limit,
      search: base.search || undefined,
      kind: pick<StoreMovementKind>(
        STORE_MOVEMENT_KINDS,
        searchParams.get("kind"),
      ),
      itemId: searchParams.get("itemId") || undefined,
      warehouseId: store,
    }
  }, [searchParams, store])

  const setParam = (key: string, value: string | number | undefined) =>
    setSearchParams(setListParam(searchParams, key, value))
  // Switching tabs (or stores) clears the filters; the store and the tab stay.
  const setTab = (
    next: StoreTab,
    extra: Record<string, string> = {},
    nextStore = store,
  ) => {
    const params = new URLSearchParams(extra)
    if (nextStore) params.set("store", nextStore)
    if (next === "movements") params.set("tab", "movements")
    setSearchParams(params)
  }
  const setStore = (next: string) => setTab(tab, {}, next)
  const clearFilters = () => setTab(tab)

  return {
    tab,
    view,
    store,
    items,
    movements,
    setParam,
    setTab,
    setStore,
    clearFilters,
  }
}
