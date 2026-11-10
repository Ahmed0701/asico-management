import type { PaginatedMeta } from "@/shared/api/types"

export type VillaParty = {
  id: string
  name: string
}

/** When a mark (MEW follow up, MEW inspection, passed) was put on a villa, and by whom. */
export type VillaMarkDto = {
  at: string
  by: VillaParty | null
}

export type VillaPhaseProgress = {
  elecPhaseId: string
  name: string
  progress: number
  order: number
  state: "NOT_STARTED" | "IN_PROGRESS" | "DONE"
  version: number
}

export type PhaseProgressUpdateDto = VillaPhaseProgress & {
  villaProgress: number
  phaseCount: number
}

export const VILLA_TYPES = ["ACICO_SYSTEM", "CONVENTIONAL"] as const
export type VillaType = typeof VILLA_TYPES[number]

/** Where a villa's file stands with MEW, for the AC and for the electricity. */
export const MEW_STATES = ["NOT_SUBMITTED", "RUNNING", "APPROVED"] as const
export type MewState = typeof MEW_STATES[number]

export type VillaListItem = {
  id: string
  villaNumber: string
  ownerName: string | null
  villaType: VillaType | null
  area: string
  areaId: string
  block: string
  plot: string
  location: string
  civilEngineer: VillaParty
  electricalEngineer: VillaParty | null
  contractor: VillaParty | null
  startDate: string | null
  targetDate: string | null
  budgetMinor: number | null
  currency: string | null
  progress: number
  mewFollowUp: VillaMarkDto | null
  mewInspection: VillaMarkDto | null
  mewInspectionPassed: VillaMarkDto | null
  mewAcState: MewState
  mewElecState: MewState
  /** The day MEW is to inspect the villa, YYYY-MM-DD; null until it is picked. */
  mewInspectionDate: string | null
  version: number
  createdAt: string
  updatedAt: string
}

export type VillaDetail = Omit<VillaListItem, "civilEngineer" | "electricalEngineer" | "contractor"> & {
  civilEngineer: VillaParty & { phone: string }
  electricalEngineer: VillaParty & { phone: string } | null
  contractor: VillaParty & { phone: string } | null
  createdBy: {
    id: string
    name: string
  }
  phaseCount: number
  phases: VillaPhaseProgress[]
}

export type VillaOption = {
  id: string
  villaNumber: string
}

export type VillaFiltersDto = {
  areas: string[]
  blocks: string[]
  /** Engineers with at least one villa, active or not. */
  civilEngineers: VillaParty[]
  electricalEngineers: VillaParty[]
}

export type AreaOption = {
  id: string
  name: string
  city: string
}

export type VillasListParams = {
  page: number
  limit: number
  sort?: string
  search?: string
  area?: string
  areaId?: string
  block?: string
  plot?: string
  civilEngineerId?: string
  electricalEngineerId?: string
  contractorId?: string
  startFrom?: string
  startTo?: string
  targetFrom?: string
  targetTo?: string
  mewFollowUp?: boolean
  mewInspection?: boolean
  mewInspectionPassed?: boolean
  villaType?: VillaType
}

export type CreateVillaInput = {
  villaNumber: string
  ownerName?: string | null
  villaType?: VillaType | null
  areaId: string
  block: string
  plot: string
  civilEngineerId: string
  electricalEngineerId?: string | null
  contractorId?: string | null
  startDate?: string | null
  targetDate?: string | null
  budgetMinor?: number | null
  currency?: string
}

export type UpdateVillaInput = {
  villaNumber?: string
  ownerName?: string | null
  villaType?: VillaType | null
  areaId?: string
  block?: string
  plot?: string
  civilEngineerId?: string
  electricalEngineerId?: string | null
  contractorId?: string | null
  startDate?: string | null
  targetDate?: string | null
  budgetMinor?: number | null
  currency?: string
}

export type VillasListResponse = {
  data: VillaListItem[]
  meta: PaginatedMeta
}
