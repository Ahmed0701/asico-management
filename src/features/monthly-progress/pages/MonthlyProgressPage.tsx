import { useTranslation } from "react-i18next"
import VillasListFooter from "@/features/villas/components/VillasListFooter"
import { toApiError } from "@/shared/api/errors"
import { useDebouncedSearchParam } from "@/shared/hooks/useDebouncedSearchParam"
import { normalizeSearchInput } from "@/shared/lib/phone/phoneNormalize"
import { Input, SearchInput } from "@/shared/ui/Field"
import PageHeader from "@/shared/ui/PageHeader"
import {
  useMonthlyProgressParams,
  useMonthlyProgressQuery,
  type MonthlyProgressSortField,
} from "../api"
import MonthlyProgressSummaryCards from "../components/MonthlyProgressSummaryCards"
import MonthlyProgressTable from "../components/MonthlyProgressTable"
import { monthLabel, thisMonth } from "../components/monthlyProgressFormat"

/** Every villa's progress at the end of last month and this month (or a month picked), and how far it moved. */
export default function MonthlyProgressPage() {
  const { t, i18n } = useTranslation()
  const { params, setParam, setPage, setLimit } = useMonthlyProgressParams()
  const { data, isLoading, isError, error } = useMonthlyProgressQuery(params)
  const { searchDraft, setSearchDraft } = useDebouncedSearchParam(
    params.search,
    setParam,
    normalizeSearchInput,
  )

  const rows = data?.data ?? []
  const meta = data?.meta
  const summary = data?.summary
  const apiError = isError ? toApiError(error) : null
  const maxMonth = thisMonth()

  // Each sortable header cycles ascending, descending; another header starts again ascending.
  const sortOf = (field: MonthlyProgressSortField): "asc" | "desc" | "none" => {
    const sort = params.sort ?? "villaNumber:asc"
    if (sort === `${field}:desc`) return "desc"
    if (sort === field || sort === `${field}:asc`) return "asc"
    return "none"
  }
  const onSort = (field: MonthlyProgressSortField) =>
    setParam("sort", sortOf(field) === "asc" ? `${field}:desc` : `${field}:asc`)

  const previousLabel = summary
    ? monthLabel(summary.previousMonth, i18n.language)
    : t("monthlyProgress.lastMonth")
  const currentLabel = summary
    ? summary.isCurrentMonth
      ? t("monthlyProgress.thisMonthNow", {
          month: monthLabel(summary.month, i18n.language),
        })
      : monthLabel(summary.month, i18n.language)
    : t("monthlyProgress.thisMonth")

  return (
    <>
      <PageHeader
        title={t("monthlyProgress.title")}
        subtitle={t("monthlyProgress.subtitle")}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px] sm:items-end">
        <SearchInput
          value={searchDraft}
          onChange={setSearchDraft}
          placeholder={t("monthlyProgress.searchPlaceholder")}
        />
        <Input
          label={t("monthlyProgress.month")}
          type="month"
          value={params.month ?? maxMonth}
          max={maxMonth}
          onChange={(e) => {
            const value = e.target.value
            setParam("month", value && value !== maxMonth ? value : undefined)
          }}
        />
      </div>

      {summary && <MonthlyProgressSummaryCards summary={summary} />}

      {apiError && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {apiError.message}
        </p>
      )}

      <MonthlyProgressTable
        rows={rows}
        loading={isLoading}
        previousLabel={previousLabel}
        currentLabel={currentLabel}
        sortOf={sortOf}
        onSort={onSort}
      />

      {meta && (
        <VillasListFooter
          meta={meta}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          onGoLastPage={() => setPage(meta.totalPages)}
        />
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        {t("monthlyProgress.howItWorks")}
      </p>
    </>
  )
}
