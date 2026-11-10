import { useTranslation } from "react-i18next"
import ContractorSelect from "@/features/contractors/components/ContractorSelect"
import VillaOptionSelect from "@/features/open-works/components/VillaOptionSelect"
import { cn } from "@/shared/lib/cn"
import { FilterField } from "@/shared/ui/filter-field"
import { FilterSelect } from "@/shared/ui/filter-select"
import { Input } from "@/shared/ui/input"
import type { SmallWorksListParams } from "../api"
import { SMALL_WORK_STATUSES } from "../api/small-works.types"

function QuickToggle({
  label,
  active,
  onClick,
  tone,
}: {
  label: string
  active: boolean
  onClick: () => void
  tone: "danger" | "warn"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-md border px-3 text-xs font-medium transition",
        active
          ? tone === "danger"
            ? "border-danger bg-danger-soft text-danger"
            : "border-accent bg-accent/15 text-accent"
          : "border-border bg-card text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  )
}

export default function SmallWorksListFiltersBar({
  params,
  setParam,
  hideVillaFilter,
  hideStatusFilter,
  /** The page fixes the status (pending works only), so there is nothing to pick. */
}: {
  params: SmallWorksListParams
  setParam: (key: string, value: string | undefined) => void
  hideVillaFilter?: boolean
  hideStatusFilter?: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className="mb-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        <QuickToggle
          label={t("smallWorks.filters.overdueToggle")}
          active={params.overdue === true}
          tone="danger"
          onClick={() =>
            setParam("overdue", params.overdue === true ? undefined : "true")
          }
        />
        <QuickToggle
          label={t("smallWorks.filters.dueSoonToggle")}
          active={params.dueSoon === true}
          tone="warn"
          onClick={() =>
            setParam("dueSoon", params.dueSoon === true ? undefined : "true")
          }
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {!hideVillaFilter && (
          <VillaOptionSelect
            label={t("listToolbar.villaFilter")}
            value={params.villaId ?? ""}
            onChange={(v) => setParam("villaId", v || undefined)}
          />
        )}
        <div className="flex flex-col gap-1.5">
          <ContractorSelect
            label={t("smallWorks.filters.contractor")}
            value={params.contractorId ?? ""}
            onChange={(v) => setParam("contractorId", v || undefined)}
          />
        </div>
        {!hideStatusFilter && (
          <FilterSelect
            label={t("smallWorks.filters.status")}
            value={params.status ?? ""}
            onChange={(v) => setParam("status", v || undefined)}
            options={SMALL_WORK_STATUSES.map((s) => ({
              value: s,
              label: t(`smallWorks.status.${s}`),
            }))}
          />
        )}
        <FilterField label={t("smallWorks.filters.startFrom")}>
          <Input
            type="date"
            className="h-9"
            value={params.startFrom ?? ""}
            onChange={(e) =>
              setParam("startFrom", e.target.value.trim() || undefined)
            }
          />
        </FilterField>
        <FilterField label={t("smallWorks.filters.startTo")}>
          <Input
            type="date"
            className="h-9"
            value={params.startTo ?? ""}
            onChange={(e) =>
              setParam("startTo", e.target.value.trim() || undefined)
            }
          />
        </FilterField>
        <FilterField label={t("smallWorks.filters.endFrom")}>
          <Input
            type="date"
            className="h-9"
            value={params.endFrom ?? ""}
            onChange={(e) =>
              setParam("endFrom", e.target.value.trim() || undefined)
            }
          />
        </FilterField>
        <FilterField label={t("smallWorks.filters.endTo")}>
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
    </div>
  )
}
