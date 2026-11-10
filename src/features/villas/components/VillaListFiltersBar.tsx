import { useTranslation } from "react-i18next"
import { FilterField } from "@/shared/ui/filter-field"
import { FilterSelect } from "@/shared/ui/filter-select"
import { SearchFilterSelect } from "@/shared/ui/search-select"
import { Input } from "@/shared/ui/input"
import {
  VILLA_TYPES,
  useVillaFiltersQuery,
  type VillasListParams,
} from "../api"

export default function VillaListFiltersBar({
  params,
  setParam,
}: {
  params: VillasListParams
  setParam: (key: string, value: string | undefined) => void
}) {
  const { t } = useTranslation()
  const { data: filters } = useVillaFiltersQuery()

  const areaOptions = (filters?.areas ?? []).map((name) => ({
    value: name,
    label: name,
  }))
  const blockOptions = (filters?.blocks ?? []).map((name) => ({
    value: name,
    label: name,
  }))
  const civilEngineerOptions = (filters?.civilEngineers ?? []).map(
    (engineer) => ({ value: engineer.id, label: engineer.name }),
  )
  const electricalEngineerOptions = (filters?.electricalEngineers ?? []).map(
    (engineer) => ({ value: engineer.id, label: engineer.name }),
  )
  const villaTypeOptions = VILLA_TYPES.map((type) => ({
    value: type,
    label: t(`villas.villaTypes.${type}`),
  }))

  return (
    <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <SearchFilterSelect
        label={t("villas.area")}
        value={params.area ?? ""}
        onChange={(v) => setParam("area", v || undefined)}
        options={areaOptions}
      />
      <FilterSelect
        label={t("villas.block")}
        value={params.block ?? ""}
        onChange={(v) => setParam("block", v || undefined)}
        options={blockOptions}
      />
      <FilterField label={t("villas.plot")}>
        <Input
          value={params.plot ?? ""}
          onChange={(e) => setParam("plot", e.target.value.trim() || undefined)}
          className="h-9"
        />
      </FilterField>
      <SearchFilterSelect
        label={t("villas.civilEngineer")}
        value={params.civilEngineerId ?? ""}
        onChange={(v) => setParam("civilEngineerId", v || undefined)}
        options={civilEngineerOptions}
      />
      <SearchFilterSelect
        label={t("villas.electricalEngineer")}
        value={params.electricalEngineerId ?? ""}
        onChange={(v) => setParam("electricalEngineerId", v || undefined)}
        options={electricalEngineerOptions}
      />
      <FilterSelect
        label={t("villas.villaType")}
        value={params.villaType ?? ""}
        onChange={(v) => setParam("villaType", v || undefined)}
        options={villaTypeOptions}
      />
    </div>
  )
}
