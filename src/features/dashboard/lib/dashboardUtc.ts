const DAY_MS = 24 * 60 * 60 * 1000

export type UtcDayRange = {
  from: string
  to: string
}

export function utcCalendarDayYmd(now = new Date()): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
    .toISOString()
    .slice(0, 10)
}

export function addUtcDays(ymd: string, days: number): string {
  const ms = new Date(`${ymd}T00:00:00.000Z`).getTime()
  return new Date(ms + days * DAY_MS).toISOString().slice(0, 10)
}

/** Target dates strictly before today (overdue villas). */
export function villaOverdueListSearch(now = new Date()): string {
  const today = utcCalendarDayYmd(now)
  const yesterday = addUtcDays(today, -1)
  return `targetTo=${yesterday}`
}

/** Target dates from today through the next 29 UTC days (matches dashboard upcoming window). */
export function villaUpcomingListSearch(now = new Date()): string {
  const today = utcCalendarDayYmd(now)
  const last = addUtcDays(today, 29)
  return `targetFrom=${today}&targetTo=${last}`
}

/** Today and the six UTC days before it (7-day window). */
export function utcLast7DaysRange(now = new Date()): UtcDayRange {
  const to = utcCalendarDayYmd(now)
  const from = addUtcDays(to, -6)
  return { from, to }
}

export function utcTodayOnlyRange(now = new Date()): UtcDayRange {
  const day = utcCalendarDayYmd(now)
  return { from: day, to: day }
}
