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
