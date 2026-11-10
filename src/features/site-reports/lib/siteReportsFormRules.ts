import { isUtcCalendarDayTooFarAhead } from "@/shared/lib/utcCalendarDay"
import { MAX_RATING, MIN_RATING } from "../api/site-reports.types"

export function isValidVisitDateYmd(ymd: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false
  return !isUtcCalendarDayTooFarAhead(ymd, now)
}

export function isValidSiteReportRating(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_RATING && value <= MAX_RATING
}
