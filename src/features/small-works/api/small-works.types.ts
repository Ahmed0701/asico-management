import type { PaginatedMeta } from "@/shared/api/types"

export const SMALL_WORK_STATUSES = ["PENDING", "DONE"] as const
export type SmallWorkStatusValue = typeof SMALL_WORK_STATUSES[number]

export const SMALL_WORK_SORT_FIELDS = [
  "startDate",
  "endDate",
  "villaNumber",
  "contractorName",
  "status",
  "createdAt",
] as const
export type SmallWorkSortField = typeof SMALL_WORK_SORT_FIELDS[number]

export type SmallWorkVillaRef = {
  id: string
  villaNumber: string
  location: string
}

export type SmallWorkPartyRef = {
  id: string
  name: string
}

export type SmallWork = {
  id: string
  villa: SmallWorkVillaRef
  contractor: SmallWorkPartyRef
  startDate: string
  endDate: string
  deadlineAt: string
  overdue: boolean
  dueSoon: boolean
  description: string
  status: SmallWorkStatusValue
  createdBy: SmallWorkPartyRef | null
  version: number
  createdAt: string
  updatedAt: string
}

export type SmallWorksListParams = {
  page: number
  limit: number
  sort?: string
  villaId?: string
  contractorId?: string
  status?: SmallWorkStatusValue
  startFrom?: string
  startTo?: string
  endFrom?: string
  endTo?: string
  overdue?: boolean
  dueSoon?: boolean
  search?: string
}

export type SmallWorksListResponse = {
  data: SmallWork[]
  meta: PaginatedMeta
}

export type CreateSmallWorkInput = {
  villaId: string
  contractorId: string
  startDate: string
  endDate: string
  description: string
  status?: SmallWorkStatusValue
}

export type UpdateSmallWorkInput = {
  contractorId?: string
  startDate?: string
  endDate?: string
  description?: string
  status?: SmallWorkStatusValue
}
