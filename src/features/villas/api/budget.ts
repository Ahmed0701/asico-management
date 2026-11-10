const PLAIN_DECIMAL = /^(\d+)(?:\.(\d+))?$/

export function currencyMinorDigits(currency: string): number {
  return (
    new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  )
}

export function majorUnitsText(minor: number, digits: number): string {
  const factor = 10n ** BigInt(digits)
  const value = BigInt(minor)
  const fraction =
    digits === 0 ? "" : `.${String(value % factor).padStart(digits, "0")}`
  return `${value / factor}${fraction}`
}

/** Major-unit amount text with at most `scale` decimals, as minor units (integer math). */
export function minorUnitsOf(
  input: unknown,
  scale: number,
): number | undefined {
  const text =
    typeof input === "number" && Number.isFinite(input) ? String(input) : input
  if (typeof text !== "string") {
    return undefined
  }
  const match = PLAIN_DECIMAL.exec(text.trim())
  if (!match) {
    return undefined
  }
  const decimals = (match[2] ?? "").replace(/0+$/, "")
  if (decimals.length > scale) {
    return undefined
  }
  const minor = Number(`${match[1]}${decimals.padEnd(scale, "0")}`)
  return Number.isSafeInteger(minor) ? minor : undefined
}

export function minorUnitsToMajorString(
  minor: number | null | undefined,
  currency: string,
): string {
  if (minor == null) return ""
  return majorUnitsText(minor, currencyMinorDigits(currency))
}

export function majorStringToMinorUnits(
  major: string,
  currency: string,
): number | null {
  const trimmed = major.trim()
  if (!trimmed) return null
  const minor = minorUnitsOf(trimmed, currencyMinorDigits(currency))
  return minor === undefined ? null : minor
}

export function formatBudgetDisplay(
  budgetMinor: number | null,
  currency: string | null,
  locale = "en-GB",
): string {
  if (budgetMinor == null || !currency) return ""
  const digits = currencyMinorDigits(currency)
  const majorText = majorUnitsText(budgetMinor, digits)
  const majorNum = Number(majorText)
  if (!Number.isFinite(majorNum)) {
    return `${majorText} ${currency}`
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(majorNum)
}
