import { useTranslation } from "react-i18next"
import ContractorSelect from "@/features/contractors/components/ContractorSelect"
import { useElectricalEngineerOptions } from "@/features/electrical-engineers/api"
import { FilterField } from "@/shared/ui/filter-field"
import { FilterSelect } from "@/shared/ui/filter-select"
import { SearchFilterSelect } from "@/shared/ui/search-select"
import { Input } from "@/shared/ui/input"
import type { DailyReportsListParams } from "../api"
import { WEATHERS } from "../api/daily-reports.types"

export default function DailyReportsListFiltersBar({
  params,
  setParam,
}: {
  params: DailyReportsListParams
  setParam: (key: string, value: string | undefined) => void
}) {
  const { t } = useTranslation()
  const { data: engineers } = useElectricalEngineerOptions()
  const engineerOptions = (engineers ?? []).map((e) => ({
    value: e.id,
    label: e.name,
  }))

  return (
    <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col gap-1.5">
        <ContractorSelect
          label={t("dailyReports.filters.contractor")}
          value={params.contractorId ?? ""}
          onChange={(v) => setParam("contractorId", v || undefined)}
        />
      </div>
      <SearchFilterSelect
        label={t("dailyReports.filters.preparedByEngineer")}
        value={params.preparedByEngineerId ?? ""}
        onChange={(v) => setParam("preparedByEngineerId", v || undefined)}
        options={engineerOptions}
      />
      <FilterSelect
        label={t("dailyReports.filters.weather")}
        value={params.weather ?? ""}
        onChange={(v) => setParam("weather", v || undefined)}
        options={WEATHERS.map((w) => ({
          value: w,
          label: t(`dailyReports.weather.${w}`),
        }))}
      />
      <FilterField label={t("dailyReports.filters.reportFrom")}>
        <Input
          type="date"
          className="h-9"
          value={params.reportFrom ?? ""}
          onChange={(e) =>
            setParam("reportFrom", e.target.value.trim() || undefined)
          }
        />
      </FilterField>
      <FilterField label={t("dailyReports.filters.reportTo")}>
        <Input
          type="date"
          className="h-9"
          value={params.reportTo ?? ""}
          onChange={(e) =>
            setParam("reportTo", e.target.value.trim() || undefined)
          }
        />
      </FilterField>
    </div>
  )
}
