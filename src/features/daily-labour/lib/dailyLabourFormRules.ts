import { isUtcCalendarDayTooFarAhead } from "@/shared/lib/utcCalendarDay"
import {
  MAX_LABOUR_COUNT,
  MAX_LABOUR_NOTES_LENGTH,
} from "../api/daily-labour.types"

export function isValidLabourDateYmd(ymd: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false
  return !isUtcCalendarDayTooFarAhead(ymd, now)
}

export function isValidLabourCount(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= MAX_LABOUR_COUNT
}

export function isValidLabourNotesLength(
  value: string | null | undefined,
): boolean {
  if (value == null || value === "") return true
  return value.length <= MAX_LABOUR_NOTES_LENGTH
}
