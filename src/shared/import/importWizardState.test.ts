import { describe, expect, it } from "vitest"
import {
  canConfirmImport,
  importWizardReducer,
  initialImportWizardState,
} from "./importWizardState"
import type { ImportReport } from "./types"

const file = new File(["x"], "test.xlsx", {
  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
})

const cleanReport: ImportReport = {
  ok: true,
  total: 2,
  imported: 0,
  skipped: 0,
  errors: [],
  truncated: false,
}

const errorReport: ImportReport = {
  ok: false,
  total: 2,
  imported: 0,
  skipped: 0,
  truncated: false,
  errors: [
    {
      row: 3,
      column: "Name",
      code: "REQUIRED",
      message: "Required",
      value: null,
    },
  ],
}

describe("importWizardReducer", () => {
  it("starts on upload with no file", () => {
    const s = initialImportWizardState()
    expect(s.step).toBe("upload")
    expect(s.file).toBeNull()
  })

  it("selects a file and clears prior dry run", () => {
    let s = importWizardReducer(initialImportWizardState(), {
      type: "DRY_RUN_OK",
      report: cleanReport,
    })
    s = importWizardReducer(s, { type: "SET_FILE", file })
    expect(s.file).toBe(file)
    expect(s.dryRunReport).toBeNull()
    expect(s.step).toBe("upload")
  })

  it("moves to review on dry run success", () => {
    let s = importWizardReducer(initialImportWizardState(), {
      type: "SET_FILE",
      file,
    })
    s = importWizardReducer(s, { type: "DRY_RUN_OK", report: cleanReport })
    expect(s.step).toBe("review")
    expect(s.dryRunPassed).toBe(true)
  })

  it("stays on review with row errors and no confirm", () => {
    let s = importWizardReducer(initialImportWizardState(), {
      type: "SET_FILE",
      file,
    })
    s = importWizardReducer(s, {
      type: "DRY_RUN_ROW_ERRORS",
      report: errorReport,
    })
    expect(s.step).toBe("review")
    expect(s.dryRunPassed).toBe(false)
    expect(canConfirmImport(s)).toBe(false)
  })

  it("keeps the file on header mismatch", () => {
    let s = importWizardReducer(initialImportWizardState(), {
      type: "SET_FILE",
      file,
    })
    s = importWizardReducer(s, {
      type: "DRY_RUN_BLOCKED",
      error: {
        status: 400,
        code: "IMPORT_HEADER_MISMATCH",
        message: "Header mismatch",
        details: [{ path: "Email", message: "Missing" }],
      },
    })
    expect(s.file).toBe(file)
    expect(s.headerMismatchDetails).toHaveLength(1)
    expect(s.step).toBe("upload")
  })

  it("completes confirm and clears dry run gate on 422", () => {
    let s = importWizardReducer(initialImportWizardState(), {
      type: "SET_FILE",
      file,
    })
    s = importWizardReducer(s, { type: "DRY_RUN_OK", report: cleanReport })
    s = importWizardReducer(s, {
      type: "CONFIRM_ROW_ERRORS",
      report: errorReport,
    })
    expect(s.step).toBe("review")
    expect(s.dryRunPassed).toBe(false)
    expect(s.file).toBe(file)
  })

  it("reaches success on confirm ok", () => {
    let s = importWizardReducer(initialImportWizardState(), {
      type: "SET_FILE",
      file,
    })
    s = importWizardReducer(s, { type: "DRY_RUN_OK", report: cleanReport })
    s = importWizardReducer(s, {
      type: "CONFIRM_OK",
      report: { ...cleanReport, imported: 2 },
    })
    expect(s.step).toBe("success")
    expect(s.confirmReport?.imported).toBe(2)
  })

  it("invalidates dry run pass on IMPORT_DATA_CHANGED", () => {
    let s = importWizardReducer(initialImportWizardState(), {
      type: "SET_FILE",
      file,
    })
    s = importWizardReducer(s, { type: "DRY_RUN_OK", report: cleanReport })
    s = importWizardReducer(s, {
      type: "CONFIRM_BLOCKED",
      error: {
        status: 409,
        code: "IMPORT_DATA_CHANGED",
        message: "Changed",
      },
    })
    expect(s.dryRunPassed).toBe(false)
    expect(s.file).toBe(file)
  })
})

describe("canConfirmImport", () => {
  it("is true only after a clean dry run", () => {
    let s = importWizardReducer(initialImportWizardState(), {
      type: "SET_FILE",
      file,
    })
    expect(canConfirmImport(s)).toBe(false)
    s = importWizardReducer(s, { type: "DRY_RUN_OK", report: cleanReport })
    expect(canConfirmImport(s)).toBe(true)
  })
})
