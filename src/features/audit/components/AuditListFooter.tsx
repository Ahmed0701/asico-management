import { useTranslation } from "react-i18next"
import Button from "@/shared/ui/Button"
import { PageSizeSelect } from "@/shared/ui/filter-select"
import type { PaginatedMeta } from "@/shared/api/types"

const PAGE_SIZES = [20, 50, 100, 200] as const

export default function AuditListFooter({
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
  const page = meta.page
  const limit = meta.limit
  const total = meta.total
  const totalPages = Math.max(1, meta.totalPages)
  const start = total === 0 ? 0 : (page - 1) * limit + 1
  const end = total === 0 ? 0 : Math.min(page * limit, total)
  const pastEnd = page > totalPages && total > 0

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
          {t("audit.showingRange", { start, end, total })}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {pastEnd && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onGoLastPage}
          >
            {t("audit.goToLastPage")}
          </Button>
        )}
        <span className="tabular-nums">
          {t("common.pageOf", { page, total: totalPages })}
        </span>
        <Button
          size="sm"
          icon="chevronLeft"
          aria-label={t("common.previous")}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rtl:[&_svg]:-scale-x-100"
        />
        <Button
          size="sm"
          icon="chevronRight"
          aria-label={t("common.next")}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rtl:[&_svg]:-scale-x-100"
        />
      </div>
    </div>
  )
}
