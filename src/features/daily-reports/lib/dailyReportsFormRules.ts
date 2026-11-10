import { isUtcCalendarDayTooFarAhead } from "@/shared/lib/utcCalendarDay"

export function isValidWorkersCount(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 100_000
}

export function isValidReportDateYmd(ymd: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false
  return !isUtcCalendarDayTooFarAhead(ymd, now)
}
