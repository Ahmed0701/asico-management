import i18n from "@/shared/i18n"
import { describe, expect, it } from "vitest"
import { localizedImportApiError } from "./mapImportApiError"

describe("localizedImportApiError", () => {
  const t = i18n.t.bind(i18n)

  it("maps header mismatch to import copy", () => {
    expect(
      localizedImportApiError(t, {
        status: 400,
        code: "IMPORT_HEADER_MISMATCH",
        message: "Server text",
      }),
    ).toBe(i18n.t("import.errors.headerMismatch"))
  })

  it("maps unsupported file type codes", () => {
    expect(
      localizedImportApiError(t, {
        status: 415,
        code: "UNSUPPORTED_FILE_TYPE",
        message: "x",
      }),
    ).toBe(i18n.t("import.errors.unsupportedType"))
  })

  it("falls back to server message", () => {
    expect(
      localizedImportApiError(t, {
        status: 500,
        code: "INTERNAL",
        message: "Custom failure",
      }),
    ).toBe("Custom failure")
  })
})
