import {
  IMPORT_MAX_FILE_BYTES,
  IMPORT_XLSX_EXTENSION,
  IMPORT_XLSX_MIME,
} from "./constants"

export type ClientImportFileErrorCode = "IMPORT_FILE_TOO_LARGE" | "IMPORT_FILE_TYPE" | "IMPORT_FILE_EMPTY"

export type ClientImportFileError = {
  code: ClientImportFileErrorCode
}

function hasXlsxExtension(name: string): boolean {
  return name.toLowerCase().endsWith(IMPORT_XLSX_EXTENSION)
}

export function validateImportFileClient(
  file: File | null | undefined,
): ClientImportFileError | null {
  if (!file || file.size === 0) {
    return { code: "IMPORT_FILE_EMPTY" }
  }
  if (file.size > IMPORT_MAX_FILE_BYTES) {
    return { code: "IMPORT_FILE_TOO_LARGE" }
  }
  if (!hasXlsxExtension(file.name)) {
    return { code: "IMPORT_FILE_TYPE" }
  }
  if (file.type && file.type !== IMPORT_XLSX_MIME) {
    return { code: "IMPORT_FILE_TYPE" }
  }
  return null
}
