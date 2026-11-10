import type { ImportReport, ImportReportRowError } from "./types"

function isRowError(value: unknown): value is ImportReportRowError {
  if (!value || typeof value !== "object") return false
  const row = value as ImportReportRowError
  return (
    typeof row.row === "number" &&
    typeof row.column === "string" &&
    typeof row.code === "string" &&
    typeof row.message === "string" &&
    (row.value === null || typeof row.value === "string")
  )
}

export function parseImportReport(data: unknown): ImportReport | null {
  if (!data || typeof data !== "object") return null
  const raw = data as Record<string, unknown>
  if (
    typeof raw.ok !== "boolean" ||
    typeof raw.total !== "number" ||
    typeof raw.imported !== "number" ||
    typeof raw.skipped !== "number" ||
    typeof raw.truncated !== "boolean" ||
    !Array.isArray(raw.errors)
  ) {
    return null
  }
  const errors = raw.errors.filter(isRowError)
  return {
    ok: raw.ok,
    total: raw.total,
    imported: raw.imported,
    skipped: raw.skipped,
    errors,
    truncated: raw.truncated,
  }
}

/** Dry run or pre-save validation passed with no row errors. */
export function isImportReportClean(report: ImportReport): boolean {
  return report.ok && report.errors.length === 0
}

/** Rows that would be saved when the file is clean (villas/contractors do not skip rows). */
export function importRowsToCreate(report: ImportReport): number {
  if (!report.ok) return 0
  return Math.max(0, report.total - report.skipped)
}

export type ImportErrorTableRow = {
  id: string
  row: number
  column: string
  message: string
  value: string | null
}

export function mapReportErrorsToTable(
  errors: ImportReportRowError[],
): ImportErrorTableRow[] {
  return errors.map((err, index) => ({
    id: `${err.row}-${err.column}-${index}`,
    row: err.row,
    column: err.column,
    message: err.message,
    value: err.value,
  }))
}

export function reportHasMoreErrors(report: ImportReport): boolean {
  return report.truncated && report.errors.length >= 1
}
