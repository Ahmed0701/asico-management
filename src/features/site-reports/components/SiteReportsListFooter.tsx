import { useTranslation } from "react-i18next"
import Button from "@/shared/ui/Button"
import { PageSizeSelect } from "@/shared/ui/filter-select"
import type { PaginatedMeta } from "@/shared/api/types"

const PAGE_SIZES = [10, 20, 50, 100] as const

export default function SiteReportsListFooter({
  meta,
  onPageChange,
  onPageSizeChange,
  onGoLastPage,
}: {
  meta: PaginatedMeta
  onPageChange: (page: number) => void
  onPageSizeChange: (limit: number) => void
  onGoLastPage: () => void
}) {
  const { t } = useTranslation()
  const { page, limit, total, totalPages } = meta
  const safeTotalPages = Math.max(1, totalPages)
  const start = total === 0 ? 0 : (page - 1) * limit + 1
  const end = total === 0 ? 0 : Math.min(page * limit, total)
  const pastEnd = page > safeTotalPages && total > 0

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-t-0 border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-2">
        <span>{t("common.rowsPerPage")}</span>
        <PageSizeSelect
          aria-label={t("common.rowsPerPage")}
          value={limit}
          onChange={onPageSizeChange}
          options={PAGE_SIZES}
        />
        <span className="tabular-nums">
          {t("siteReports.showingRange", { start, end, total })}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {t("common.previous")}
        </Button>
        <span className="tabular-nums">
          {t("common.pageOf", { page, total: safeTotalPages })}
        </span>
        <Button
          type="button"
          variant="secondary"
          disabled={page >= safeTotalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t("common.next")}
        </Button>
        {pastEnd && (
          <Button type="button" variant="secondary" onClick={onGoLastPage}>
            {t("siteReports.goToLastPage")}
          </Button>
        )}
      </div>
    </div>
  )
}
