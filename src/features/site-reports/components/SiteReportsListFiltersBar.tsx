import { useTranslation } from "react-i18next"
import VillaOptionSelect from "@/features/open-works/components/VillaOptionSelect"
import { FilterField } from "@/shared/ui/filter-field"
import { FilterSelect } from "@/shared/ui/filter-select"
import { Input } from "@/shared/ui/input"
import type { SiteReportsListParams } from "../api"
import {
  MAX_RATING,
  MIN_RATING,
  SITE_REPORT_TYPES,
} from "../api/site-reports.types"

const RATING_OPTIONS = Array.from(
  { length: MAX_RATING - MIN_RATING + 1 },
  (_, i) => MIN_RATING + i,
)

export default function SiteReportsListFiltersBar({
  params,
  setParam,
  hideVillaFilter,
}: {
  params: SiteReportsListParams
  setParam: (key: string, value: string | undefined) => void
  hideVillaFilter?: boolean
}) {
  const { t } = useTranslation()

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
        label={t("siteReports.filters.type")}
        value={params.type ?? ""}
        onChange={(v) => setParam("type", v || undefined)}
        options={SITE_REPORT_TYPES.map((type) => ({
          value: type,
          label: t(`siteReports.type.${type}`),
        }))}
      />
      <FilterSelect
        label={t("siteReports.filters.rating")}
        value={params.rating !== undefined ? String(params.rating) : ""}
        onChange={(v) => setParam("rating", v || undefined)}
        options={RATING_OPTIONS.map((r) => ({
          value: String(r),
          label: t("siteReports.filters.ratingValue", { count: r }),
        }))}
      />
      <FilterField label={t("siteReports.filters.visitFrom")}>
        <Input
          type="date"
          className="h-9"
          value={params.visitFrom ?? ""}
          onChange={(e) =>
            setParam("visitFrom", e.target.value.trim() || undefined)
          }
        />
      </FilterField>
      <FilterField label={t("siteReports.filters.visitTo")}>
        <Input
          type="date"
          className="h-9"
          value={params.visitTo ?? ""}
          onChange={(e) =>
            setParam("visitTo", e.target.value.trim() || undefined)
          }
        />
      </FilterField>
    </div>
  )
}
