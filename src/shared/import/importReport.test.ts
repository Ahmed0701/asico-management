import { describe, expect, it } from "vitest"
import {
  importRowsToCreate,
  isImportReportClean,
  mapReportErrorsToTable,
  parseImportReport,
  reportHasMoreErrors,
} from "./importReport"
import type { ImportReport } from "./types"

describe("parseImportReport", () => {
  it("parses a valid report envelope", () => {
    const report = parseImportReport({
      ok: true,
      total: 3,
      imported: 0,
      skipped: 0,
      errors: [],
      truncated: false,
    })
    expect(report).toEqual({
      ok: true,
      total: 3,
      imported: 0,
      skipped: 0,
      errors: [],
      truncated: false,
    })
  })

  it("drops malformed error rows", () => {
    const report = parseImportReport({
      ok: false,
      total: 2,
      imported: 0,
      skipped: 0,
      truncated: false,
      errors: [
        {
          row: 5,
          column: "Name",
          code: "REQUIRED",
          message: "Required",
          value: null,
        },
        { row: "x" },
      ],
    })
    expect(report?.errors).toHaveLength(1)
    expect(report?.errors[0].row).toBe(5)
  })

  it("returns null for invalid payloads", () => {
    expect(parseImportReport(null)).toBeNull()
    expect(parseImportReport({ ok: true })).toBeNull()
  })
})

describe("import report helpers", () => {
  const clean: ImportReport = {
    ok: true,
    total: 10,
    imported: 0,
    skipped: 2,
    errors: [],
    truncated: false,
  }

  it("detects a clean dry run", () => {
    expect(isImportReportClean(clean)).toBe(true)
    expect(isImportReportClean({ ...clean, ok: false })).toBe(false)
    expect(
      isImportReportClean({
        ...clean,
        errors: [
          {
            row: 2,
            column: "A",
            code: "REQUIRED",
            message: "m",
            value: null,
          },
        ],
      }),
    ).toBe(false)
  })

  it("computes rows to create when ok", () => {
    expect(importRowsToCreate(clean)).toBe(8)
    expect(importRowsToCreate({ ...clean, ok: false })).toBe(0)
  })

  it("maps errors for the table", () => {
    const rows = mapReportErrorsToTable([
      {
        row: 4,
        column: "Phone",
        code: "INVALID_VALUE",
        message: "Bad phone",
        value: "abc",
      },
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      row: 4,
      column: "Phone",
      message: "Bad phone",
      value: "abc",
    })
  })

  it("flags truncated error lists", () => {
    expect(
      reportHasMoreErrors({
        ok: false,
        total: 1,
        imported: 0,
        skipped: 0,
        errors: [
          {
            row: 2,
            column: "A",
            code: "REQUIRED",
            message: "m",
            value: null,
          },
        ],
        truncated: true,
      }),
    ).toBe(true)
    expect(reportHasMoreErrors({ ...clean, truncated: false })).toBe(false)
  })
})
