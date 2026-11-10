import type { PaginatedMeta } from "@/shared/api/types"

export const DAILY_LABOUR_SORT_FIELDS = [
  "labourDate",
  "villaNumber",
  "contractorName",
  "labourCount",
  "createdAt",
] as const
export type DailyLabourSortField = typeof DAILY_LABOUR_SORT_FIELDS[number]

export const MAX_LABOUR_COUNT = 100_000
export const MAX_LABOUR_NOTES_LENGTH = 500

export type DailyLabourVillaRef = {
  id: string
  villaNumber: string
  location: string
}

export type DailyLabourContractorRef = {
  id: string
  name: string
}

export type DailyLabourCreatedByRef = {
  id: string
  name: string
}

export type DailyLabour = {
  id: string
  villa: DailyLabourVillaRef
  labourDate: string
  contractor: DailyLabourContractorRef
  labourCount: number
  notes: string | null
  createdBy: DailyLabourCreatedByRef | null
  version: number
  createdAt: string
  updatedAt: string
}

export type DailyLabourListParams = {
  page: number
  limit: number
  sort?: string
  villaId?: string
  contractorId?: string
  labourFrom?: string
  labourTo?: string
  search?: string
}

export type DailyLabourListResponse = {
  data: DailyLabour[]
  meta: PaginatedMeta
}

export type CreateDailyLabourInput = {
  villaId: string
  labourDate: string
  contractorId: string
  labourCount: number
  notes?: string | null
}

export type UpdateDailyLabourInput = {
  labourDate?: string
  contractorId?: string
  labourCount?: number
  notes?: string | null
}
