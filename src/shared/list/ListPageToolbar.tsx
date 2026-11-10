import type { ReactNode } from "react"
import { SearchInput } from "@/shared/ui/Field"
import ImportPlaceholderButton from "./ImportPlaceholderButton"
import ExportPlaceholderButton from "./ExportPlaceholderButton"

export default function ListPageToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filter,
  primaryAction,
  showImportExport = false,
}: {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  filter?: ReactNode
  primaryAction?: ReactNode
  showImportExport?: boolean
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="min-w-0 flex-1 sm:max-w-md">
        <SearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
      </div>
      {filter && <div className="w-full sm:w-auto sm:min-w-40">{filter}</div>}
      <div className="flex flex-wrap items-center gap-2 sm:ms-auto">
        {showImportExport && (
          <>
            <ImportPlaceholderButton />
            <ExportPlaceholderButton />
          </>
        )}
        {primaryAction}
      </div>
    </div>
  )
}
