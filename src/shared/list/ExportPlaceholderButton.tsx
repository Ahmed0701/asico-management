import { useTranslation } from "react-i18next"
import { cn } from "@/shared/lib/cn"
import Button from "@/shared/ui/Button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"

type ExportPlaceholderButtonProps = {
  layout?: "default" | "toolbar"
  className?: string
}

export default function ExportPlaceholderButton({
  layout = "default",
  className,
}: ExportPlaceholderButtonProps) {
  const { t } = useTranslation()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("inline-flex w-full", className)}>
          <Button
            type="button"
            variant="secondary"
            icon="download"
            disabled
            className={cn(
              layout === "toolbar" &&
                "h-9 w-full min-w-0 justify-center px-2 text-xs",
            )}
          >
            <span className={cn(layout === "toolbar" && "truncate")}>
              {t("common.export")}
            </span>
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{t("common.notAvailableYet")}</TooltipContent>
    </Tooltip>
  )
}
