import { describe, expect, it } from "vitest"
import {
  normalizeAsciiDigits,
  normalizePhoneInput,
  normalizeSearchInput,
} from "./phoneNormalize"

describe("phoneNormalize", () => {
  it("converts Arabic-Indic and Persian digits to ASCII", () => {
    expect(normalizeAsciiDigits("٠١٢")).toBe("012")
    expect(normalizeAsciiDigits("۰۱۲")).toBe("012")
  })

  it("leaves other characters unchanged", () => {
    expect(normalizePhoneInput("  +20 100-4567  ")).toBe("+20 100-4567")
    expect(normalizeSearchInput("abc")).toBe("abc")
  })
})
