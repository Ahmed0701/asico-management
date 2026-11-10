import { useTranslation } from "react-i18next"
import ContractorSelect from "@/features/contractors/components/ContractorSelect"
import VillaOptionSelect from "@/features/open-works/components/VillaOptionSelect"
import { FilterField } from "@/shared/ui/filter-field"
import { Input } from "@/shared/ui/input"
import type { DailyLabourListParams } from "../api"

export default function DailyLabourListFiltersBar({
  params,
  setLabourParam,
  hideVillaFilter,
}: {
  params: DailyLabourListParams
  setLabourParam: (suffix: string, value: string | undefined) => void
  hideVillaFilter?: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {!hideVillaFilter && (
        <VillaOptionSelect
          label={t("listToolbar.villaFilter")}
          value={params.villaId ?? ""}
          onChange={(v) => setLabourParam("VillaId", v || undefined)}
        />
      )}
      <div className="flex flex-col gap-1.5">
        <ContractorSelect
          label={t("dailyLabour.filters.contractor")}
          value={params.contractorId ?? ""}
          onChange={(v) => setLabourParam("ContractorId", v || undefined)}
        />
      </div>
      <FilterField label={t("dailyLabour.filters.labourFrom")}>
        <Input
          type="date"
          className="h-9"
          value={params.labourFrom ?? ""}
          onChange={(e) =>
            setLabourParam("From", e.target.value.trim() || undefined)
          }
        />
      </FilterField>
      <FilterField label={t("dailyLabour.filters.labourTo")}>
        <Input
          type="date"
          className="h-9"
          value={params.labourTo ?? ""}
          onChange={(e) =>
            setLabourParam("To", e.target.value.trim() || undefined)
          }
        />
      </FilterField>
    </div>
  )
}
