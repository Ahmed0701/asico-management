const DAY_MS = 24 * 60 * 60 * 1000

/** Latest allowed calendar day (UTC): tomorrow relative to `now`. */
export function maxAllowedUtcCalendarDay(now = new Date()): string {
  const start = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  )
  return new Date(start + DAY_MS).toISOString().slice(0, 10)
}

export function isUtcCalendarDayTooFarAhead(
  ymd: string,
  now = new Date(),
): boolean {
  const dayMs = new Date(`${ymd}T00:00:00.000Z`).getTime()
  const tomorrowMs =
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) + DAY_MS
  return dayMs > tomorrowMs
}
