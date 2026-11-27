import { useTranslation } from "react-i18next"
import VillasListFooter from "@/features/villas/components/VillasListFooter"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import ListToolbar, { countActive } from "@/shared/list/ListToolbar"
import { FilterSelect } from "@/shared/ui/Field"
import { SearchFilterSelect } from "@/shared/ui/search-select"
import {
  STORE_MOVEMENT_KINDS,
  useStoreItemOptionsQuery,
  type StoreMovement,
  type StoreMovementsParams,
  type StoreMovementsResponse,
} from "../api"
import { formatQuantity, unitLabel } from "../lib/storeFormat"
import StoreMovementsTable from "./StoreMovementsTable"
import ColoredItemName from "./ColoredItemName"
import { itemTextStyle } from "../lib/itemColor"

type Props = {
  params: StoreMovementsParams
  data?: StoreMovementsResponse
  loading: boolean
  setParam: (key: string, value: string | number | undefined) => void
  onClear: () => void
  canUndo: boolean
  onUndo: (movement: StoreMovement) => void
}

/** The movements tab: search, item and kind, then every movement, newest first. */
export default function StoreMovementsPanel({
  params,
  data,
  loading,
  setParam,
  onClear,
  canUndo,
  onUndo,
}: Props) {
  const { t } = useTranslation()
  const items = useStoreItemOptionsQuery()
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
          placeholder: t("store.searchMovements"),
        }}
        count={meta?.total}
        activeCount={countActive(params.search, params.kind, params.itemId)}
        onClear={onClear}
        columns={2}
      >
        <SearchFilterSelect
          label={t("store.item")}
          value={params.itemId ?? ""}
          onChange={(value) => setParam("itemId", value || undefined)}
          options={(items.data ?? []).map((item) => ({
            value: item.id,
            label: item.factory
              ? `${item.name} · ${item.factory.name}`
              : item.name,
          }))}
          renderOption={(option) => {
            const entry = items.data?.find((item) => item.id === option.value)
            return entry ? (
              <ColoredItemName
                name={entry.name}
                factory={entry.factory?.name}
              />
            ) : (
              option.label
            )
          }}
          selectedStyle={itemTextStyle(
            items.data?.find((item) => item.id === params.itemId)?.name ?? "",
          )}
        />
        <FilterSelect
          label={t("store.kind")}
          value={params.kind ?? ""}
          onChange={(value) => setParam("kind", value || undefined)}
          options={STORE_MOVEMENT_KINDS.map((value) => ({
            value,
            label: t(`store.kinds.${value}`),
          }))}
        />
      </ListToolbar>
      <StoreMovementsTable
        rows={data?.data ?? []}
        loading={loading}
        canUndo={canUndo}
        onUndo={onUndo}
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
