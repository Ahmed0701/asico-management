/** "November 2026" (or its Arabic) for YYYY-MM. */
export function monthLabel(month: string, language: string): string {
  const [year, m] = month.split("-").map(Number) as [number, number]
  return new Intl.DateTimeFormat(
    language === "ar" ? "ar-EG-u-nu-latn" : "en-GB",
    { month: "long", year: "numeric", timeZone: "UTC" },
  ).format(new Date(Date.UTC(year, m - 1, 1)))
}

/** "+12.5%", "0%" or "-5%". */
export function changeText(change: number): string {
  return `${change > 0 ? "+" : ""}${change}%`
}

/** This month on this computer, YYYY-MM. */
export function thisMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}
