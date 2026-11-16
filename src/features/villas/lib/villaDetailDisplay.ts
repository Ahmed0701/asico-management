import type { VillaDetail } from "../api"

export type VillaPhaseDisplay = {
  id: string
  name: string
  progress: number
  version: number
}

export function phasesFromApi(villa: VillaDetail): VillaPhaseDisplay[] {
  return [...villa.phases]
    .sort((a, b) => a.order - b.order)
    .map((p) => ({
      id: p.elecPhaseId,
      name: p.name,
      progress: p.progress,
      version: p.version,
    }))
}

export function buildVillaContextLine(
  villa: VillaDetail,
  blockPlotLine: string | null,
): string {
  return [villa.ownerName, villa.area, blockPlotLine]
    .filter(Boolean)
    .join(" · ")
}

const DAY_MS = 24 * 60 * 60 * 1000

// Whole days from today (this computer's calendar day) to `day` (YYYY-MM-DD): negative once it has passed.
export function daysUntil(day: string, now = new Date()): number {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((Date.parse(`${day}T00:00:00.000Z`) - today) / DAY_MS)
}
