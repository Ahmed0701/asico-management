import { useTranslation } from "react-i18next"
import { cn } from "@/shared/lib/cn"
import Button from "@/shared/ui/Button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"

type ImportPlaceholderButtonProps = {
  /** Visible label; defaults to generic Excel import copy. */
  label?: string
  className?: string
}

export default function ImportPlaceholderButton({
  label,
  className,
}: ImportPlaceholderButtonProps) {
  const { t } = useTranslation()
  const buttonLabel = label ?? t("listToolbar.importExcel")
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("inline-flex w-full", className)}>
          <Button
            type="button"
            variant="secondary"
            icon="upload"
            disabled
            className="h-9 w-full min-w-0 justify-center px-2 text-xs"
          >
            <span className="truncate">{buttonLabel}</span>
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{t("common.notAvailableYet")}</TooltipContent>
    </Tooltip>
  )
}
