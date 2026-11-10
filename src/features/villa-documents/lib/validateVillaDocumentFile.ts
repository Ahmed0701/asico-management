import {
  MAX_UPLOAD_BYTES,
  PDF_SIGNATURE,
} from "../api/villa-documents.constants"

export type VillaDocumentValidationCode = "FILE_TOO_LARGE" | "INVALID_FILE_TYPE" | "NO_FILE_PROVIDED"

export type VillaDocumentValidationResult = { ok: true } | {
  ok: false
  code: VillaDocumentValidationCode
}

export function validateVillaDocumentFile(
  file: File | null | undefined,
): VillaDocumentValidationResult {
  if (!file || file.size === 0) {
    return { ok: false, code: "NO_FILE_PROVIDED" }
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, code: "FILE_TOO_LARGE" }
  }
  return { ok: true }
}

/** Sync check on the file name/type hint; magic bytes checked async before upload. */
export async function validateVillaDocumentPdfSignature(
  file: File,
): Promise<VillaDocumentValidationResult> {
  const head = new Uint8Array(
    await file.slice(0, PDF_SIGNATURE.length).arrayBuffer(),
  )
  const sig = String.fromCharCode(...head)
  if (sig !== PDF_SIGNATURE) {
    return { ok: false, code: "INVALID_FILE_TYPE" }
  }
  return { ok: true }
}
