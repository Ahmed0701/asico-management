import { useTranslation } from "react-i18next"
import Icon from "@/shared/ui/Icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"

export default function DashboardUtcHint() {
  const { t } = useTranslation()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="ms-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={t("dashboard.utcTodayHint")}
        >
          <Icon name="alert" size={14} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        {t("dashboard.utcTodayHint")}
      </TooltipContent>
    </Tooltip>
  )
}
