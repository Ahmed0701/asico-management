import type { VillaListItem } from "../api"

/**
 * Where a villa on MEW follow up stands: still waiting for a MEW approval (AC or electricity), both approved and ready to be
 * sent for MEW inspection, or already on the inspection list.
 */
export type MewStage = "waiting" | "ready" | "inspection"

export function mewStageOf(row: VillaListItem): MewStage {
  if (row.mewInspection) return "inspection"
  return row.mewAcState === "APPROVED" && row.mewElecState === "APPROVED"
    ? "ready"
    : "waiting"
}

/** Whole days from an ISO instant to now (0 today). */
export function daysSince(iso: string, now: Date = new Date()): number {
  return Math.max(
    0,
    Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000),
  )
}

/** Whole days from today to a day (YYYY-MM-DD): 0 today, negative once it has passed. */
export function daysUntil(day: string, now: Date = new Date()): number {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const [y, m, d] = day.split("-").map(Number) as [number, number, number]
  return Math.round((Date.UTC(y, m - 1, d) - today) / 86_400_000)
}
