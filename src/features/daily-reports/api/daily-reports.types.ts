import type { PaginatedMeta } from "@/shared/api/types"

export const WEATHERS = ["HOT", "SUNNY", "WINDY", "RAINY", "DUSTY"] as const
export type WeatherValue = typeof WEATHERS[number]

export const DAILY_REPORT_SORT_FIELDS = [
  "reportDate",
  "contractorName",
  "preparedByName",
  "weather",
  "createdAt",
] as const
export type DailyReportSortField = typeof DAILY_REPORT_SORT_FIELDS[number]

export type DailyReportPartyRef = {
  id: string
  name: string
}

export type DailyReport = {
  id: string
  reportDate: string
  weather: WeatherValue
  workersCount: number
  notes: string | null
  contractor: DailyReportPartyRef
  preparedBy: DailyReportPartyRef
  createdBy: DailyReportPartyRef | null
  version: number
  createdAt: string
  updatedAt: string
}

export type DailyReportsListParams = {
  page: number
  limit: number
  sort?: string
  contractorId?: string
  preparedByEngineerId?: string
  weather?: WeatherValue
  reportFrom?: string
  reportTo?: string
  search?: string
}

export type DailyReportsListResponse = {
  data: DailyReport[]
  meta: PaginatedMeta
}

export type CreateDailyReportInput = {
  contractorId: string
  preparedByEngineerId: string
  reportDate: string
  weather: WeatherValue
  workersCount: number
  notes?: string | null
}

export type UpdateDailyReportInput = {
  contractorId?: string
  preparedByEngineerId?: string
  reportDate?: string
  weather?: WeatherValue
  workersCount?: number
  notes?: string | null
}
