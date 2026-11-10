import type { PaginatedMeta } from "@/shared/api/types"
import type { PartyStatus } from "@/shared/directory/party.types"

export type Contractor = {
  id: string
  version: number
  name: string
  phone: string
  email?: string | null
  status: PartyStatus
  villaCount: number
  createdAt: string
  updatedAt: string
}

export type ContractorOption = {
  id: string
  name: string
}

export type ContractorsListParams = {
  page: number
  limit: number
  sort?: string
  search?: string
  status?: PartyStatus
}

export type CreateContractorInput = {
  name: string
  phone: string
  email?: string | null
}

export type UpdateContractorInput = {
  name?: string
  phone?: string
  email?: string | null
  status?: PartyStatus
}

export type ContractorsListResponse = {
  data: Contractor[]
  meta: PaginatedMeta
}

export type ContractorSummaryVilla = {
  id: string
  villaNumber: string
  area: string
  block: string
  plot: string
  startDate: string | null
  targetDate: string | null
}

export type ContractorSummaryOpenWorks = {
  total: number
  delayed: number
  overdue: number
  byStatus: {
    NOT_STARTED: number
    IN_PROGRESS: number
    DELAYED: number
    DONE: number
  }
}

export type ContractorSummarySmallWorks = {
  total: number
  pending: number
  done: number
  overdue: number
  dueSoon: number
}

export type ContractorSummaryDailyReports = {
  count: number
  lastReportDate: string | null
}

export type ContractorSummaryLabour = {
  entries: number
  totalLabour: number
  lastLabourDate: string | null
}

export type ContractorSummaryData = {
  contractor: {
    id: string
    name: string
    phone: string
  }
  villaCount: number
  openWorks: ContractorSummaryOpenWorks | null
  smallWorks: ContractorSummarySmallWorks | null
  dailyReports: ContractorSummaryDailyReports | null
  labour: ContractorSummaryLabour | null
  villas: ContractorSummaryVilla[]
}

export type ContractorSummaryParams = {
  page: number
  limit: number
  sort?: string
}

export type ContractorSummaryResponse = {
  data: ContractorSummaryData
  meta: PaginatedMeta
}
