import { useTranslation } from "react-i18next"
import Button from "@/shared/ui/Button"

export default function ClientListFooter({
  total,
  page,
  pageSize,
  onPageChange,
}: {
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  const { t } = useTranslation()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <p>{t("listToolbar.recordCount", { count: total })}</p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          {t("common.previous")}
        </Button>
        <span className="tabular-nums">
          {t("common.pageOf", { page: safePage, total: totalPages })}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          {t("common.next")}
        </Button>
      </div>
    </div>
  )
}
