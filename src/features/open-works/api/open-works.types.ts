import type { PaginatedMeta } from "@/shared/api/types"

export const WORK_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "DELAYED",
  "DONE",
] as const
export type WorkStatusValue = typeof WORK_STATUSES[number]

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const
export type PriorityValue = typeof PRIORITIES[number]

export const OPEN_WORK_SORT_FIELDS = [
  "location",
  "elecPhaseName",
  "status",
  "priority",
  "progress",
  "startDate",
  "endDate",
] as const
export type OpenWorkSortField = typeof OPEN_WORK_SORT_FIELDS[number]

export type OpenWorkVillaRef = {
  id: string
  villaNumber: string
  location: string
}

export type OpenWorkPartyRef = {
  id: string
  name: string
}

export type OpenWork = {
  id: string
  villa: OpenWorkVillaRef
  elecPhase: OpenWorkPartyRef
  status: WorkStatusValue
  priority: PriorityValue
  progress: number
  contractor: OpenWorkPartyRef | null
  startDate: string | null
  endDate: string | null
  overdue: boolean
  /** Whole days past the end date (APP_TIMEZONE); 0 when not overdue. */
  overdueDays: number
  createdBy: OpenWorkPartyRef | null
  version: number
  createdAt: string
  updatedAt: string
}

export type OpenWorksListParams = {
  page: number
  limit: number
  sort?: string
  villaId?: string
  elecPhaseId?: string
  status?: WorkStatusValue
  priority?: PriorityValue
  contractorId?: string
  overdue?: boolean
  /** true: only done works (the Done Works page); false: only the ones still open. */
  done?: boolean
  startFrom?: string
  startTo?: string
  endFrom?: string
  endTo?: string
  search?: string
}

export type OpenWorksListResponse = {
  data: OpenWork[]
  meta: PaginatedMeta
}

export type CreateOpenWorkInput = {
  villaId: string
  elecPhaseId: string
  status?: WorkStatusValue
  priority?: PriorityValue
  progress?: number
  contractorId?: string | null
  startDate?: string | null
  endDate?: string | null
}

export type UpdateOpenWorkInput = {
  elecPhaseId?: string
  status?: WorkStatusValue
  priority?: PriorityValue
  progress?: number
  contractorId?: string | null
  startDate?: string | null
  endDate?: string | null
}
