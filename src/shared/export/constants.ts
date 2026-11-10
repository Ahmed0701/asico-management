export const EXPORT_MAX_RECORDS = 10_000
export const EXPORT_RATE_LIMIT_COOLDOWN_MS = 30_000
export const EXPORT_FETCH_TIMEOUT_MS = 60_000

export type ExportFormat = "xlsx" | "pdf"

export type ExportFilenameStem = "villas" | "contractors" | "civil-engineers" | "electrical-engineers" | "contractor-summary" | "audit-logs" | "areas" | "open-works" | "daily-reports" | "small-works" | "site-reports" | "daily-labour" | "material-deliveries" | "material-balance"

export function fallbackExportFilename(
  stem: ExportFilenameStem,
  format: ExportFormat,
): string {
  const day = new Date().toISOString().slice(0, 10)
  return `elecico-${stem}-${day}.${format}`
}
