import { describe, expect, it } from "vitest"
import {
  currencyMinorDigits,
  formatBudgetDisplay,
  majorStringToMinorUnits,
  majorUnitsText,
  minorUnitsOf,
  minorUnitsToMajorString,
} from "./budget"

describe("currencyMinorDigits", () => {
  it("uses 3 for KWD, 2 for EGP and USD, 0 for JPY", () => {
    expect(currencyMinorDigits("KWD")).toBe(3)
    expect(currencyMinorDigits("EGP")).toBe(2)
    expect(currencyMinorDigits("USD")).toBe(2)
    expect(currencyMinorDigits("JPY")).toBe(0)
  })
})

describe("minorUnitsOf / majorUnitsText round-trip", () => {
  it("KWD: 0.001 -> 1 minor, 1250000.5 -> 1250000500 minor", () => {
    expect(minorUnitsOf("0.001", 3)).toBe(1)
    expect(majorUnitsText(1, 3)).toBe("0.001")
    expect(minorUnitsOf("1250000.5", 3)).toBe(1250000500)
    expect(majorUnitsText(1250000500, 3)).toBe("1250000.500")
  })

  it("EGP: 0.29 -> 29 minor", () => {
    expect(minorUnitsOf("0.29", 2)).toBe(29)
    expect(majorUnitsText(29, 2)).toBe("0.29")
  })

  it("USD: 0.29 -> 29 minor and zero", () => {
    expect(minorUnitsOf("0.29", 2)).toBe(29)
    expect(minorUnitsOf("0", 2)).toBe(0)
    expect(majorUnitsText(0, 2)).toBe("0.00")
  })

  it("rejects too many decimals for the currency scale", () => {
    expect(minorUnitsOf("0.0001", 3)).toBeUndefined()
    expect(minorUnitsOf("0.291", 2)).toBeUndefined()
  })
})

describe("majorStringToMinorUnits / minorUnitsToMajorString", () => {
  it("converts using each currency's scale", () => {
    expect(majorStringToMinorUnits("0.001", "KWD")).toBe(1)
    expect(majorStringToMinorUnits("0.29", "EGP")).toBe(29)
    expect(majorStringToMinorUnits("1250000.5", "KWD")).toBe(1250000500)
    expect(minorUnitsToMajorString(1, "KWD")).toBe("0.001")
    expect(minorUnitsToMajorString(null, "KWD")).toBe("")
  })

  it("returns null for empty or invalid input", () => {
    expect(majorStringToMinorUnits("", "KWD")).toBeNull()
    expect(majorStringToMinorUnits("0.0001", "KWD")).toBeNull()
  })
})

describe("formatBudgetDisplay", () => {
  it("returns empty when there is no budget", () => {
    expect(formatBudgetDisplay(null, "KWD")).toBe("")
    expect(formatBudgetDisplay(100, null)).toBe("")
  })

  it("formats KWD with three fraction digits", () => {
    const text = formatBudgetDisplay(1250500, "KWD", "en-GB")
    expect(text).toMatch(/1,250\.500/)
    expect(text).toMatch(/KWD|KD/)
  })

  it("formats EGP with two fraction digits", () => {
    const text = formatBudgetDisplay(29, "EGP", "en-GB")
    expect(text).toMatch(/0\.29/)
  })
})
