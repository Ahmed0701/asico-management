import type { VillaRecord } from "../mock/types"

export type VillaListFilters = {
  civilEngineerId?: string
  electricalEngineerId?: string
  contractorId?: string
  area?: string
}

export function parseVillaListFilters(
  searchParams: URLSearchParams,
): VillaListFilters {
  const pick = (key: string) => {
    const v = searchParams.get(key)?.trim()
    return v || undefined
  }
  return {
    civilEngineerId: pick("civilEngineerId"),
    electricalEngineerId: pick("electricalEngineerId"),
    contractorId: pick("contractorId"),
    area: pick("area"),
  }
}

export function matchesVillaFilters(
  villa: VillaRecord,
  filters: VillaListFilters,
): boolean {
  if (
    filters.civilEngineerId &&
    villa.civilEngineerId !== filters.civilEngineerId
  ) {
    return false
  }
  if (
    filters.electricalEngineerId &&
    villa.electricalEngineerId !== filters.electricalEngineerId
  ) {
    return false
  }
  if (filters.contractorId && villa.contractorId !== filters.contractorId) {
    return false
  }
  if (filters.area) {
    const decoded = filters.area
    if (villa.area.name !== decoded && villa.area.id !== decoded) return false
  }
  return true
}

export function hasActiveVillaFilters(filters: VillaListFilters): boolean {
  return Boolean(
    filters.civilEngineerId ||
      filters.electricalEngineerId ||
      filters.contractorId ||
      filters.area,
  )
}
