import { FileSpreadsheet } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import {
  buildVillasQueryParams,
  listVillas,
  villasKeys,
} from "@/features/villas/api"
import { downloadExport } from "@/shared/export/downloadExport"
import { useExportContext } from "@/shared/export/ExportProvider"
import Button from "@/shared/ui/Button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"
import { cn } from "@/shared/lib/cn"

const EXPORT_ICON_SIZE = 19
const EXPORT_ICON_STROKE = 1.75

function ExportIcon() {
  return (
    <FileSpreadsheet
      size={EXPORT_ICON_SIZE}
      strokeWidth={EXPORT_ICON_STROKE}
      className="shrink-0"
      aria-hidden
    />
  )
}

export default function SidebarVillasExportButton({
  collapsed,
}: {
  collapsed: boolean
}) {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const { isExporting, runExport } = useExportContext()
  const canExport = can("villas:export")

  const listParams = { page: 1, limit: 1 } as const
  const { data, isLoading } = useQuery({
    queryKey: villasKeys.list(listParams),
    queryFn: () => listVillas(listParams),
    enabled: canExport,
    staleTime: 60_000,
  })

  const total = data?.meta.total
  const noData = total === 0
  const totalPending = total === undefined
  const exportBlocked = isLoading || totalPending || noData

  const onExport = () => {
    void runExport("xlsx", (signal) =>
      downloadExport({
        path: "/villas/export",
        query: buildVillasQueryParams({ page: 1, limit: 20 }, {
          forExport: true,
        }),
        format: "xlsx",
        filenameStem: "villas",
        signal,
      }),
    )
  }

  const disabled = !canExport || isExporting || exportBlocked

  const button = (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        "w-full justify-start text-muted-foreground",
        collapsed && "lg:size-9 lg:justify-center lg:p-0",
      )}
      disabled={disabled}
      onClick={onExport}
    >
      <ExportIcon />
      <span className={cn(collapsed && "lg:hidden")}>
        {t("nav.exportAllVillas")}
      </span>
    </Button>
  )

  if (!canExport) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="block w-full">
            <Button
              type="button"
              variant="ghost"
              className={cn(
                "w-full justify-start text-muted-foreground",
                collapsed && "lg:size-9 lg:justify-center lg:p-0",
              )}
              disabled
            >
              <ExportIcon />
              <span className={cn(collapsed && "lg:hidden")}>
                {t("nav.exportAllVillas")}
              </span>
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          {t("nav.exportAllVillasForbidden")}
        </TooltipContent>
      </Tooltip>
    )
  }

  const hint = noData
    ? t("export.noDataToExport")
    : t("nav.exportAllVillasHint")

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="block w-full">{button}</span>
      </TooltipTrigger>
      <TooltipContent side="top">{hint}</TooltipContent>
    </Tooltip>
  )
}
