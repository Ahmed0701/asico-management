import type { TFunction } from "i18next"
import type { ApiError } from "@/shared/api/types"
import {
  MAX_DOCUMENTS_PER_VILLA,
  MAX_UPLOAD_BYTES,
} from "./villa-documents.constants"
import type { VillaDocumentValidationCode } from "../lib/validateVillaDocumentFile"

export function villaDocumentValidationMessage(
  t: TFunction,
  code: VillaDocumentValidationCode,
): string {
  switch (code) {
    case "FILE_TOO_LARGE":
      return t("villaDocuments.errors.fileTooLarge", {
        maxMb: Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024)),
      })
    case "INVALID_FILE_TYPE":
      return t("villaDocuments.errors.invalidFileType")
    case "NO_FILE_PROVIDED":
      return t("villaDocuments.errors.noFile")
    default:
      return t("villaDocuments.errors.uploadFailed")
  }
}

export function villaDocumentApiErrorMessage(
  t: TFunction,
  error: ApiError,
): string {
  switch (error.code) {
    case "VILLA_DOCUMENT_LIMIT":
      return t("villaDocuments.errors.documentLimit", {
        max: MAX_DOCUMENTS_PER_VILLA,
      })
    case "FILE_TOO_LARGE":
      return t("villaDocuments.errors.fileTooLarge", {
        maxMb: Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024)),
      })
    case "INVALID_FILE_TYPE":
      return t("villaDocuments.errors.invalidFileType")
    case "NO_FILE_PROVIDED":
      return t("villaDocuments.errors.noFile")
    case "TOO_MANY_FILES":
      return t("villaDocuments.errors.tooManyFiles")
    case "VILLA_NOT_FOUND":
      return t("villaDocuments.errors.villaNotFound")
    case "FILE_NOT_FOUND":
      return t("villaDocuments.errors.fileNotFound")
    default:
      if (error.status === 403) {
        return t("villaDocuments.errors.forbidden")
      }
      if (error.status >= 500) {
        return t("villaDocuments.errors.serverError")
      }
      if (error.status === 0 || error.code === "NETWORK_ERROR") {
        return t("villaDocuments.errors.networkError")
      }
      if (error.message && error.code !== "UNKNOWN") {
        return error.message
      }
      return t("villaDocuments.errors.loadFailed")
  }
}
