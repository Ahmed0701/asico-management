import { useTranslation } from "react-i18next"
import ContractorSelect from "@/features/contractors/components/ContractorSelect"
import { useElecPhaseOptionsQuery } from "@/features/elec-phases/api"
import { FilterField } from "@/shared/ui/filter-field"
import { FilterSelect } from "@/shared/ui/filter-select"
import { Input } from "@/shared/ui/input"
import type { OpenWorksListParams } from "../api"
import { PRIORITIES, WORK_STATUSES } from "../api/open-works.types"
import VillaOptionSelect from "./VillaOptionSelect"

export default function OpenWorksListFiltersBar({
  params,
  setParam,
  hideVillaFilter,
}: {
  params: OpenWorksListParams
  setParam: (key: string, value: string | undefined) => void
  hideVillaFilter?: boolean
}) {
  const { t } = useTranslation()
  const { data: elecPhases } = useElecPhaseOptionsQuery()
  const elecOptions = (elecPhases ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }))

  return (
    <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {!hideVillaFilter && (
        <VillaOptionSelect
          label={t("listToolbar.villaFilter")}
          value={params.villaId ?? ""}
          onChange={(v) => setParam("villaId", v || undefined)}
        />
      )}
      <FilterSelect
        label={t("openWorks.filters.elecPhase")}
        value={params.elecPhaseId ?? ""}
        onChange={(v) => setParam("elecPhaseId", v || undefined)}
        options={elecOptions}
      />
      <FilterSelect
        label={t("openWorks.filters.status")}
        value={params.status ?? ""}
        onChange={(v) => setParam("status", v || undefined)}
        options={WORK_STATUSES.map((s) => ({
          value: s,
          label: t(`openWorks.status.${s}`),
        }))}
      />
      <FilterSelect
        label={t("openWorks.filters.priority")}
        value={params.priority ?? ""}
        onChange={(v) => setParam("priority", v || undefined)}
        options={PRIORITIES.map((p) => ({
          value: p,
          label: t(`openWorks.priority.${p}`),
        }))}
      />
      <div className="flex flex-col gap-1.5">
        <ContractorSelect
          label={t("openWorks.filters.contractor")}
          value={params.contractorId ?? ""}
          onChange={(v) => setParam("contractorId", v || undefined)}
        />
      </div>
      <FilterSelect
        label={t("openWorks.filters.overdue")}
        value={
          params.overdue === undefined ? "" : params.overdue ? "true" : "false"
        }
        onChange={(v) => {
          if (!v) setParam("overdue", undefined)
          else setParam("overdue", v)
        }}
        options={[
          { value: "true", label: t("openWorks.filters.overdueYes") },
          { value: "false", label: t("openWorks.filters.overdueNo") },
        ]}
      />
      <FilterField label={t("openWorks.filters.startFrom")}>
        <Input
          type="date"
          className="h-9"
          value={params.startFrom ?? ""}
          onChange={(e) =>
            setParam("startFrom", e.target.value.trim() || undefined)
          }
        />
      </FilterField>
      <FilterField label={t("openWorks.filters.startTo")}>
        <Input
          type="date"
          className="h-9"
          value={params.startTo ?? ""}
          onChange={(e) =>
            setParam("startTo", e.target.value.trim() || undefined)
          }
        />
      </FilterField>
      <FilterField label={t("openWorks.filters.endFrom")}>
        <Input
          type="date"
          className="h-9"
          value={params.endFrom ?? ""}
          onChange={(e) =>
            setParam("endFrom", e.target.value.trim() || undefined)
          }
        />
      </FilterField>
      <FilterField label={t("openWorks.filters.endTo")}>
        <Input
          type="date"
          className="h-9"
          value={params.endTo ?? ""}
          onChange={(e) =>
            setParam("endTo", e.target.value.trim() || undefined)
          }
        />
      </FilterField>
    </div>
  )
}
