import type { ReactNode } from "react"
import {
  ListExportMenu,
  type ListExportMenuProps,
} from "@/shared/export/ListExportMenu"
import { cn } from "@/shared/lib/cn"
import Button from "@/shared/ui/Button"
import ExportPlaceholderButton from "./ExportPlaceholderButton"
import ImportPlaceholderButton from "./ImportPlaceholderButton"

/** Fixed width for import / export / add in page header (matches villas list). */
export const LIST_HEADER_ACTION_W = "10.25rem"
export const LIST_HEADER_ACTIONS_ROW_W = `calc(3 * ${LIST_HEADER_ACTION_W} + 2 * 0.5rem)`

export type ListPageHeaderAddAction = {
  label: string
  onClick?: () => void
  disabled?: boolean
}

export type ListPageHeaderExportAction = {
  kind: "menu"
  total?: number
  listLoading?: boolean
  onExport: ListExportMenuProps["onExport"]
} & Pick<ListExportMenuProps, "onForbidden" | "onContractorNotFound" | "extraHint"> | {
  kind: "placeholder"
}

export type ListPageHeaderImportAction = { kind: "placeholder" } | {
  kind: "button"
  label?: string
  onClick: () => void
  disabled?: boolean
}

export type ListPageHeaderActionsProps = {
  /** Visible import label; defaults to generic Excel import copy. */
  importLabel?: string
  /** When false, the import column is an empty spacer. Default true. */
  showImport?: boolean
  /** Live import button or placeholder; defaults to placeholder when showImport. */
  importAction?: ListPageHeaderImportAction
  /** Live export menu, placeholder, or omit for empty spacer. */
  exportAction?: ListPageHeaderExportAction
  /** Primary add button, or omit for empty spacer. */
  add?: ListPageHeaderAddAction
  /** `header` adds bottom padding for PageHeader; `inline` fits toolbars. */
  placement?: "header" | "inline"
  className?: string
}

function EmptySlot() {
  return <span aria-hidden className="block min-h-9" />
}

export default function ListPageHeaderActions({
  importLabel,
  showImport = true,
  importAction,
  exportAction,
  add,
  placement = "header",
  className,
}: ListPageHeaderActionsProps) {
  const showGrid = showImport || exportAction !== undefined || add !== undefined
  if (!showGrid) return null

  let exportNode: ReactNode = <EmptySlot />
  if (exportAction?.kind === "menu") {
    exportNode = (
      <ListExportMenu
        total={exportAction.total}
        listLoading={exportAction.listLoading}
        onExport={exportAction.onExport}
        onForbidden={exportAction.onForbidden}
        onContractorNotFound={exportAction.onContractorNotFound}
        extraHint={exportAction.extraHint}
        layout="toolbar"
        toolbarHintMaxWidth={LIST_HEADER_ACTIONS_ROW_W}
      />
    )
  } else if (exportAction?.kind === "placeholder") {
    exportNode = <ExportPlaceholderButton layout="toolbar" />
  }

  return (
    <div
      className={cn(
        "grid max-w-full items-start gap-x-2",
        placement === "header" && "pb-5",
        className,
      )}
      style={{
        gridTemplateColumns: `repeat(3, minmax(0, ${LIST_HEADER_ACTION_W}))`,
      }}
    >
      {showImport ? (
        importAction?.kind === "button" ? (
          <Button
            type="button"
            variant="secondary"
            icon="upload"
            className="h-9 w-full min-w-0 justify-center px-2 text-xs"
            onClick={importAction.onClick}
            disabled={importAction.disabled}
          >
            <span className="truncate">
              {importAction.label ?? importLabel}
            </span>
          </Button>
        ) : (
          <ImportPlaceholderButton label={importLabel} />
        )
      ) : (
        <EmptySlot />
      )}
      {exportNode}
      {add ? (
        <Button
          type="button"
          variant="primary"
          icon="plus"
          className="h-9 w-full min-w-0 justify-center px-2 text-xs"
          onClick={add.onClick}
          disabled={add.disabled || !add.onClick}
        >
          <span className="truncate">{add.label}</span>
        </Button>
      ) : (
        <EmptySlot />
      )}
    </div>
  )
}
