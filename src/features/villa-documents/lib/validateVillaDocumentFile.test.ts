import { describe, expect, it } from "vitest"
import { MAX_UPLOAD_BYTES } from "../api/villa-documents.constants"
import {
  validateVillaDocumentFile,
  validateVillaDocumentPdfSignature,
} from "./validateVillaDocumentFile"

describe("validateVillaDocumentFile", () => {
  it("rejects missing and oversized files", () => {
    expect(validateVillaDocumentFile(null).ok).toBe(false)
    expect(validateVillaDocumentFile(undefined).ok).toBe(false)
    const big = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "big.pdf", {
      type: "application/pdf",
    })
    expect(validateVillaDocumentFile(big)).toEqual({
      ok: false,
      code: "FILE_TOO_LARGE",
    })
  })

  it("accepts a small file", () => {
    const file = new File(["x"], "a.pdf", { type: "application/pdf" })
    expect(validateVillaDocumentFile(file)).toEqual({ ok: true })
  })
})

describe("validateVillaDocumentPdfSignature", () => {
  it("requires PDF magic bytes", async () => {
    const bad = new File(["hello"], "x.pdf", { type: "application/pdf" })
    expect(await validateVillaDocumentPdfSignature(bad)).toEqual({
      ok: false,
      code: "INVALID_FILE_TYPE",
    })
    const good = new File(["%PDF-1.4"], "ok.pdf", { type: "application/pdf" })
    expect(await validateVillaDocumentPdfSignature(good)).toEqual({ ok: true })
  })
})
