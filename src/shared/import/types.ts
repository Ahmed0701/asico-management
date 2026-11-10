export type ImportReportRowError = {
  row: number
  column: string
  code: string
  message: string
  value: string | null
}

export type ImportReport = {
  ok: boolean
  total: number
  imported: number
  skipped: number
  errors: ImportReportRowError[]
  truncated: boolean
}

export type ImportResourceId = "villas" | "contractors" | "open-works" | "daily-reports" | "small-works" | "site-reports" | "daily-labour" | "material-deliveries"

export type ImportResourceConfig = {
  id: ImportResourceId
  templatePath: string
  importPath: string
  listPath: string
  templateFallbackFilename: string
}

export const IMPORT_RESOURCES: Record<ImportResourceId, ImportResourceConfig> =
  {
    villas: {
      id: "villas",
      templatePath: "/villas/import/template",
      importPath: "/villas/import",
      listPath: "/villas",
      templateFallbackFilename: "villas-import-template.xlsx",
    },
    contractors: {
      id: "contractors",
      templatePath: "/contractors/import/template",
      importPath: "/contractors/import",
      listPath: "/contractors",
      templateFallbackFilename: "contractors-import-template.xlsx",
    },
    "open-works": {
      id: "open-works",
      templatePath: "/open-works/import/template",
      importPath: "/open-works/import",
      listPath: "/villas/open-works",
      templateFallbackFilename: "open-works-import-template.xlsx",
    },
    "daily-reports": {
      id: "daily-reports",
      templatePath: "/daily-reports/import/template",
      importPath: "/daily-reports/import",
      listPath: "/daily-reports",
      templateFallbackFilename: "daily-reports-import-template.xlsx",
    },
    "small-works": {
      id: "small-works",
      templatePath: "/small-works/import/template",
      importPath: "/small-works/import",
      listPath: "/small-works",
      templateFallbackFilename: "small-works-import-template.xlsx",
    },
    "site-reports": {
      id: "site-reports",
      templatePath: "/site-reports/import/template",
      importPath: "/site-reports/import",
      listPath: "/site-reports",
      templateFallbackFilename: "site-reports-import-template.xlsx",
    },
    "daily-labour": {
      id: "daily-labour",
      templatePath: "/daily-labour/import/template",
      importPath: "/daily-labour/import",
      listPath: "/site-reports",
      templateFallbackFilename: "daily-labour-import-template.xlsx",
    },
    "material-deliveries": {
      id: "material-deliveries",
      templatePath: "/material-deliveries/import/template",
      importPath: "/material-deliveries/import",
      listPath: "/materials",
      templateFallbackFilename: "material-deliveries-import-template.xlsx",
    },
  }
