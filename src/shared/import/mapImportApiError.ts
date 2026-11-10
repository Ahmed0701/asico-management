import type { TFunction } from "i18next"
import type { ApiError } from "@/shared/api/types"

export function localizedImportApiError(t: TFunction, error: ApiError): string {
  if (error.status === 403) {
    return t("import.errors.forbidden")
  }
  switch (error.code) {
    case "FILE_TOO_LARGE":
    case "IMPORT_FILE_TOO_LARGE":
      return t("import.errors.fileTooLarge")
    case "UNSUPPORTED_FILE_TYPE":
    case "INVALID_FILE_TYPE":
      return t("import.errors.unsupportedType")
    case "IMPORT_HEADER_MISMATCH":
      return t("import.errors.headerMismatch")
    case "FILE_ALREADY_IMPORTED":
      return t("import.errors.fileAlreadyImported")
    case "IMPORT_DATA_CHANGED":
      return t("import.errors.dataChanged")
    case "NO_FILE_PROVIDED":
      return t("import.errors.noFile")
    case "TOO_MANY_REQUESTS":
      return t("import.errors.rateLimit")
    case "FORBIDDEN":
      return t("import.errors.forbidden")
    case "NETWORK_ERROR":
      return t("import.errors.network")
    default:
      return error.message || t("import.failedGeneric")
  }
}

export function importRateLimitHint(
  t: TFunction,
  error: ApiError,
): string | null {
  if (error.status !== 429 && error.code !== "TOO_MANY_REQUESTS") return null
  return t("import.errors.rateLimitWait")
}
