import { useTranslation } from "react-i18next"
import VillasListFooter from "@/features/villas/components/VillasListFooter"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import ListToolbar, { countActive } from "@/shared/list/ListToolbar"
import { FilterSelect } from "@/shared/ui/Field"
import {
  STORE_CATEGORIES,
  type StoreItem,
  type StoreItemsParams,
  type StoreItemsResponse,
  type StoreMovementKind,
} from "../api"
import type { StoreView } from "../lib/useStoreParams"
import StoreItemsTable from "./StoreItemsTable"

type Props = {
  params: StoreItemsParams
  view: StoreView
  data?: StoreItemsResponse
  loading: boolean
  storeId?: string
  setParam: (key: string, value: string | number | undefined) => void
  onClear: () => void
  canMove: boolean
  canEdit: boolean
  canDelete: boolean
  onMove: (item: StoreItem, kind: StoreMovementKind) => void
  onHistory: (item: StoreItem) => void
  onEdit: (item: StoreItem) => void
  onDelete: (item: StoreItem) => void
}

/** The stock tab: search, category and which items (all, active, low, inactive), then the items and their stock. */
export default function StoreItemsPanel({
  params,
  view,
  data,
  loading,
  setParam,
  onClear,
  ...table
}: Props) {
  const { t } = useTranslation()
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    (value) => value,
  )
  const meta = data?.meta

  return (
    <>
      <ListToolbar
        search={{
          value: searchDraft,
          onChange: setSearchDraft,
          placeholder: t("store.searchItems"),
        }}
        count={meta?.total}
        activeCount={countActive(
          params.search,
          params.category,
          view === "all" ? undefined : view,
        )}
        onClear={onClear}
        columns={2}
      >
        <FilterSelect
          label={t("store.category")}
          value={params.category ?? ""}
          onChange={(value) => setParam("category", value || undefined)}
          options={STORE_CATEGORIES.map((value) => ({
            value,
            label: t(`store.categories.${value}`),
          }))}
        />
        <FilterSelect
          label={t("store.show")}
          value={view === "all" ? "" : view}
          onChange={(value) => setParam("view", value || undefined)}
          options={(["active", "low", "inactive"] as const).map((value) => ({
            value,
            label: t(`store.views.${value}`),
          }))}
        />
      </ListToolbar>
      <StoreItemsTable
        rows={data?.data ?? []}
        loading={loading}
        sort={params.sort}
        onSort={(next) => setParam("sort", next)}
        {...table}
      />
      {meta && (
        <VillasListFooter
          meta={meta}
          onPageChange={(page) => setParam("page", page)}
          onPageSizeChange={(limit) => setParam("limit", limit)}
          onGoLastPage={() => setParam("page", meta.totalPages)}
        />
      )}
    </>
  )
}
