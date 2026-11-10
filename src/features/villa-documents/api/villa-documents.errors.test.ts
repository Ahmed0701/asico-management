import { describe, expect, it } from "vitest"
import i18n from "@/shared/i18n"
import {
  villaDocumentApiErrorMessage,
  villaDocumentValidationMessage,
} from "./villa-documents.errors"

describe("villaDocument error messages", () => {
  const t = i18n.getFixedT("en")

  it("maps validation codes", () => {
    expect(villaDocumentValidationMessage(t, "INVALID_FILE_TYPE")).toContain(
      "PDF",
    )
    expect(villaDocumentValidationMessage(t, "FILE_TOO_LARGE")).toContain("25")
  })

  it("maps API codes including document limit", () => {
    expect(
      villaDocumentApiErrorMessage(t, {
        status: 409,
        code: "VILLA_DOCUMENT_LIMIT",
        message: "x",
      }),
    ).toContain("10")
    expect(
      villaDocumentApiErrorMessage(t, {
        status: 403,
        code: "FORBIDDEN",
        message: "x",
      }),
    ).toContain("permission")
  })

  it("maps gateway errors without axios English text", () => {
    expect(
      villaDocumentApiErrorMessage(t, {
        status: 502,
        code: "NETWORK_ERROR",
        message: "Request failed with status code 502",
      }),
    ).toBe("The server is unavailable. Try again in a moment.")
    const tAr = i18n.getFixedT("ar")
    expect(
      villaDocumentApiErrorMessage(tAr, {
        status: 502,
        code: "NETWORK_ERROR",
        message: "Request failed with status code 502",
      }),
    ).toContain("الخادم")
  })
})
