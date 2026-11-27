import type { ExportFormat } from "./constants"

/**
 * Asks the person which columns to export. Gets the titles the file would have and answers the ones to keep, or null when
 * they cancel. `key` names the export (its path and format), to remember the last choice.
 */
export type ColumnChooser = (request: {
  columns: string[]
  format: ExportFormat
  key: string
}) => Promise<string[] | null>

// Only one export runs at a time (ExportProvider), so the chooser of the running one is kept here, for the time of that
// export: every page's own export callback goes through downloadExport and picks it up, without passing it along.
let active: ColumnChooser | null = null

export async function withColumnChooser<T>(
  chooser: ColumnChooser,
  task: () => Promise<T>,
): Promise<T> {
  active = chooser
  try {
    return await task()
  } finally {
    active = null
  }
}

export const activeColumnChooser = (): ColumnChooser | null => active

const STORAGE_PREFIX = "export-columns:"

/** The columns chosen last time for this export, if any (kept in this browser only). */
export function rememberedColumns(key: string): string[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) &&
      parsed.every((item) => typeof item === "string")
      ? parsed
      : null
  } catch {
    return null
  }
}

export function rememberColumns(key: string, columns: string[]): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(columns))
  } catch {
    // Private windows and full storage: the choice is simply not remembered.
  }
}
