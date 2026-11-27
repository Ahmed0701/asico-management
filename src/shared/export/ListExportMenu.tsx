import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import type { ApiError } from "@/shared/api/types"
import { toast } from "@/shared/lib/toast"
import Button from "@/shared/ui/Button"
import Icon from "@/shared/ui/Icon"
import Menu, { MenuItem } from "@/shared/ui/Menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"
import { cn } from "@/shared/lib/cn"
import { EXPORT_MAX_RECORDS, type ExportFormat } from "./constants"
import { useExportContext } from "./ExportProvider"
import ExportColumnsDialog from "./ExportColumnsDialog"
import {
  rememberColumns,
  rememberedColumns,
  withColumnChooser,
  type ColumnChooser,
} from "./columnChoice"

type ColumnRequest = Parameters<ColumnChooser>[0] & {
  resolve: (chosen: string[] | null) => void
}

export type ListExportMenuProps = {
  total: number | undefined
  /** When true, export stays disabled (e.g. list query still loading). */
  listLoading?: boolean
  onExport: (format: ExportFormat, signal: AbortSignal) => Promise<void>
  onForbidden?: () => void
  onContractorNotFound?: () => void
  extraHint?: ReactNode
  className?: string
  /** Equal-width toolbar slot: full-width trigger, hint overlays below without widening layout. */
  layout?: "default" | "toolbar"
  /** CSS length for toolbar hint max width (width of the whole action group). */
  toolbarHintMaxWidth?: string
}

function ExportSpinner() {
  return (
    <span
      className="size-4 shrink-0 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground"
      aria-hidden
    />
  )
}

const toolbarTriggerClass =
  "inline-flex h-9 w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-border bg-card px-2 text-xs font-medium text-foreground"

export function ListExportMenu({
  total,
  listLoading = false,
  onExport,
  onForbidden,
  onContractorNotFound,
  extraHint,
  className,
  layout = "default",
  toolbarHintMaxWidth,
}: ListExportMenuProps) {
  const { t } = useTranslation()
  const {
    isExporting,
    activeFormat,
    isCooldown,
    runExport,
    cancelExport,
    markRateLimited,
  } = useExportContext()
  const [liveMessage, setLiveMessage] = useState("")
  const [columnRequest, setColumnRequest] = useState<ColumnRequest | null>(null)
  // The open question, so it can be answered "cancelled" if the menu goes away first (the export then ends).
  const pendingRef = useRef<ColumnRequest | null>(null)
  // Opens the column dialog and waits for the person's choice (null when they cancel).
  const chooseColumns = useCallback<ColumnChooser>(
    (request) =>
      new Promise((resolve) => {
        const pending = { ...request, resolve }
        pendingRef.current = pending
        setColumnRequest(pending)
      }),
    [],
  )
  const answer = (chosen: string[] | null) => {
    pendingRef.current?.resolve(chosen)
    pendingRef.current = null
    setColumnRequest(null)
  }
  useEffect(() => () => pendingRef.current?.resolve(null), [])

  const tooMany = total !== undefined && total > EXPORT_MAX_RECORDS
  const noData = total === 0
  const totalPending = total === undefined
  const exportBlocked = listLoading || totalPending || noData
  const disabled = isExporting || isCooldown || tooMany || exportBlocked

  const handleExport = async (
    format: ExportFormat,
    close: () => void,
    pickColumns = false,
  ) => {
    close()
    setLiveMessage(t("export.inProgress"))
    try {
      await runExport(format, (signal) =>
        pickColumns
          ? withColumnChooser(chooseColumns, () => onExport(format, signal))
          : onExport(format, signal),
      )
      toast.success(t("export.downloaded"))
      setLiveMessage(t("export.downloaded"))
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setLiveMessage("")
        return
      }
      const apiErr = err as ApiError
      if (apiErr && typeof apiErr === "object" && "status" in apiErr) {
        if (apiErr.status === 429 || apiErr.code === "TOO_MANY_REQUESTS") {
          markRateLimited()
          toast.error(apiErr.message)
          setLiveMessage(apiErr.message)
          return
        }
        if (apiErr.status === 403) {
          toast.error(apiErr.message)
          onForbidden?.()
          setLiveMessage(apiErr.message)
          return
        }
        if (apiErr.code === "CONTRACTOR_NOT_FOUND") {
          toast.error(apiErr.message)
          onContractorNotFound?.()
          setLiveMessage(apiErr.message)
          return
        }
        if (
          apiErr.code === "EXPORT_TOO_LARGE" ||
          apiErr.code === "EXPORT_COLUMNS_UNAVAILABLE" ||
          apiErr.code === "EXPORT_COLUMNS_UNKNOWN"
        ) {
          toast.error(apiErr.message)
          setLiveMessage(apiErr.message)
          return
        }
        if (apiErr.status === 400) {
          console.error("Export validation error", apiErr)
          toast.error(apiErr.message)
          setLiveMessage(apiErr.message)
          return
        }
      }
      toast.error(t("export.failedGeneric"))
      setLiveMessage(t("export.failedGeneric"))
    } finally {
      // However the export ended (cancelled while the dialog was open, too), the dialog closes.
      pendingRef.current = null
      setColumnRequest(null)
    }
  }

  const showNoDataHint = noData && !listLoading && !totalPending

  const hintBlock = (
    <>
      {showNoDataHint && (
        <p className="text-xs text-muted-foreground">
          {t("export.noDataToExport")}
        </p>
      )}
      {total !== undefined && !tooMany && !noData && (
        <p className="text-xs text-muted-foreground">
          {t("export.matchingRecords", { count: total })}
        </p>
      )}
      {tooMany && (
        <p id="export-too-many-hint" className="text-xs text-muted-foreground">
          {t("export.tooManyRecords")}
        </p>
      )}
      {extraHint}
    </>
  )

  const toolbarHintClass =
    "pointer-events-none absolute left-1/2 top-full z-10 mt-0.5 w-max max-w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 text-center text-xs leading-snug text-muted-foreground"

  const menuTrigger = (
    <Menu
      label={t("export.menuLabel")}
      disabled={disabled}
      trigger={
        <span
          className={cn(
            layout === "toolbar"
              ? toolbarTriggerClass
              : "inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium",
          )}
          aria-describedby={
            tooMany
              ? "export-too-many-hint"
              : showNoDataHint
                ? "export-no-data-hint"
                : undefined
          }
        >
          <Icon name="download" size={14} />
          <span className="truncate">{t("common.export")}</span>
        </span>
      }
    >
      {(close) => (
        <>
          <MenuItem
            disabled={disabled}
            onClick={() => void handleExport("xlsx", close)}
          >
            <span className="flex items-center gap-2">
              {activeFormat === "xlsx" && isExporting ? (
                <ExportSpinner />
              ) : null}
              {t("export.excel")}
            </span>
          </MenuItem>
          <MenuItem
            disabled={disabled}
            onClick={() => void handleExport("pdf", close)}
          >
            <span className="flex items-center gap-2">
              {activeFormat === "pdf" && isExporting ? <ExportSpinner /> : null}
              {t("export.pdf")}
            </span>
          </MenuItem>
          <MenuItem
            disabled={disabled}
            onClick={() => void handleExport("xlsx", close, true)}
          >
            {t("export.columns.excel")}
          </MenuItem>
          <MenuItem
            disabled={disabled}
            onClick={() => void handleExport("pdf", close, true)}
          >
            {t("export.columns.pdf")}
          </MenuItem>
        </>
      )}
    </Menu>
  )

  const menuWithTooltip =
    showNoDataHint && disabled ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="block w-full">{menuTrigger}</span>
        </TooltipTrigger>
        <TooltipContent side="top">{t("export.noDataToExport")}</TooltipContent>
      </Tooltip>
    ) : (
      menuTrigger
    )

  const columnDialog = columnRequest && (
    <ExportColumnsDialog
      columns={columnRequest.columns}
      initial={(() => {
        const last = rememberedColumns(columnRequest.key)?.filter((title) =>
          columnRequest.columns.includes(title),
        )
        return last && last.length > 0 ? last : columnRequest.columns
      })()}
      format={columnRequest.format}
      onConfirm={(chosen) => {
        rememberColumns(columnRequest.key, chosen)
        answer(chosen)
      }}
      onCancel={() => answer(null)}
    />
  )

  return (
    <div
      className={cn(
        layout === "toolbar" ? "relative w-full" : "flex flex-col gap-1",
        className,
      )}
    >
      {columnDialog}
      <div
        className={cn(
          layout === "toolbar"
            ? "flex w-full items-center"
            : "flex flex-wrap items-center gap-2",
        )}
      >
        <div
          className={
            layout === "toolbar"
              ? "w-full min-w-0 [&_button]:flex [&_button]:w-full [&_button]:justify-center"
              : undefined
          }
        >
          {menuWithTooltip}
        </div>
        {isExporting && layout !== "toolbar" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={cancelExport}
          >
            {t("export.cancel")}
          </Button>
        )}
      </div>
      {isExporting && layout === "toolbar" && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute top-full left-1/2 z-20 mt-6 -translate-x-1/2 whitespace-nowrap"
          onClick={cancelExport}
        >
          {t("export.cancel")}
        </Button>
      )}
      {layout === "toolbar"
        ? (showNoDataHint ||
            (total !== undefined && !noData) ||
            tooMany ||
            extraHint) && (
            <div
              className={toolbarHintClass}
              style={
                toolbarHintMaxWidth
                  ? { maxWidth: toolbarHintMaxWidth }
                  : undefined
              }
            >
              {hintBlock}
            </div>
          )
        : hintBlock}
      {showNoDataHint && (
        <p id="export-no-data-hint" className="sr-only">
          {t("export.noDataToExport")}
        </p>
      )}
      <p className="sr-only" aria-live="polite">
        {liveMessage}
      </p>
    </div>
  )
}
