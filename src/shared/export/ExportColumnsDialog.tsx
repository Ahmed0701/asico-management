import { useState } from "react"
import { useTranslation } from "react-i18next"
import Modal from "@/shared/ui/Modal"
import Button from "@/shared/ui/Button"
import { Checkbox } from "@/shared/ui/checkbox"
import { cn } from "@/shared/lib/cn"
import type { ExportFormat } from "./constants"

type Props = {
  columns: string[]
  /** Ticked when the dialog opens (the last choice, or every column). */
  initial: string[]
  format: ExportFormat
  onConfirm: (chosen: string[]) => void
  onCancel: () => void
}

/**
 * Which columns go into the export: one checkbox per column of the file, all or none at once, and the export runs with the
 * ticked ones. The titles are the file's own, in English like the file.
 */
export default function ExportColumnsDialog({
  columns,
  initial,
  format,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation()
  const [chosen, setChosen] = useState<Set<string>>(() => new Set(initial))
  const toggle = (title: string, on: boolean) =>
    setChosen((current) => {
      const next = new Set(current)
      if (on) next.add(title)
      else next.delete(title)
      return next
    })
  // Kept in the file's own order.
  const ordered = columns.filter((title) => chosen.has(title))

  return (
    <Modal
      open
      onClose={onCancel}
      title={t("export.columns.title")}
      description={t(
        format === "pdf"
          ? "export.columns.subtitlePdf"
          : "export.columns.subtitleExcel",
      )}
      footer={
        <>
          <Button type="button" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            icon="download"
            disabled={ordered.length === 0}
            onClick={() => onConfirm(ordered)}
          >
            {t("export.columns.confirm", { count: ordered.length })}
          </Button>
        </>
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {t("export.columns.chosen", {
            chosen: ordered.length,
            total: columns.length,
          })}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setChosen(new Set(columns))}
          >
            {t("export.columns.all")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setChosen(new Set())}
          >
            {t("export.columns.none")}
          </Button>
        </div>
      </div>
      <ul
        aria-label={t("export.columns.title")}
        className="grid gap-1.5 sm:grid-cols-2"
      >
        {columns.map((title) => {
          const id = `export-column-${title.replace(/\W+/g, "-")}`
          const on = chosen.has(title)
          return (
            <li key={title}>
              <label
                htmlFor={id}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                  on
                    ? "border-accent/40 bg-accent/5"
                    : "border-border hover:bg-muted/50",
                )}
              >
                <Checkbox
                  id={id}
                  checked={on}
                  onCheckedChange={(value) => toggle(title, value === true)}
                />
                <span dir="ltr" className="min-w-0 truncate">
                  {title}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
      {format === "xlsx" && ordered.length < columns.length && (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("export.columns.importHint")}
        </p>
      )}
    </Modal>
  )
}
