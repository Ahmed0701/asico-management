import { useState } from "react"
import { ImportWizardModal, type ImportResourceConfig } from "@/shared/import"
import ListPageHeaderActions, {
  type ListPageHeaderAddAction,
} from "@/shared/list/ListPageHeaderActions"
import type { ListExportMenuProps } from "@/shared/export/ListExportMenu"

export type VillaResourceTabToolbarProps = {
  canImport: boolean
  canExport: boolean
  importLabel: string
  importConfig: ImportResourceConfig
  onImportSuccess: () => void
  exportTotal?: number
  exportLoading?: boolean
  onExport: ListExportMenuProps["onExport"]
  add?: ListPageHeaderAddAction
}

export default function VillaResourceTabToolbar({
  canImport,
  canExport,
  importLabel,
  importConfig,
  onImportSuccess,
  exportTotal,
  exportLoading,
  onExport,
  add,
}: VillaResourceTabToolbarProps) {
  const [importOpen, setImportOpen] = useState(false)

  const showToolbar = canImport || canExport || add
  if (!showToolbar) return null

  return (
    <>
      <ListPageHeaderActions
        placement="inline"
        showImport={canImport}
        importLabel={importLabel}
        importAction={
          canImport
            ? {
                kind: "button",
                label: importLabel,
                onClick: () => setImportOpen(true),
              }
            : undefined
        }
        exportAction={
          canExport
            ? {
                kind: "menu",
                total: exportTotal,
                listLoading: exportLoading,
                onExport,
              }
            : undefined
        }
        add={add}
      />
      {canImport && (
        <ImportWizardModal
          open={importOpen}
          onClose={() => setImportOpen(false)}
          config={importConfig}
          onSuccess={() => {
            onImportSuccess()
            setImportOpen(false)
          }}
          villaRowTargetNote
        />
      )}
    </>
  )
}
