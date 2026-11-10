const TEN_YEARS_MS = Math.round(10 * 365.25 * 24 * 60 * 60 * 1000)

/** Plain YYYY-MM-DD within 10 years of today (UTC calendar day). */
export function isPlannedDateWithinTenYears(
  ymd: string,
  now = new Date(),
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false
  const dayMs = new Date(`${ymd}T00:00:00.000Z`).getTime()
  if (Number.isNaN(dayMs)) return false
  const todayStart = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  )
  return (
    dayMs >= todayStart - TEN_YEARS_MS && dayMs <= todayStart + TEN_YEARS_MS
  )
}
