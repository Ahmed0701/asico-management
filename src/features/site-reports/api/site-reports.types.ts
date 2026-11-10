import type { PaginatedMeta } from "@/shared/api/types"

export const SITE_REPORT_TYPES = [
  "INSPECTION",
  "SAFETY",
  "PROGRESS",
  "QUALITY",
] as const
export type SiteReportTypeValue = typeof SITE_REPORT_TYPES[number]

export const SITE_REPORT_SORT_FIELDS = [
  "visitDate",
  "villaNumber",
  "rating",
  "type",
  "createdAt",
] as const
export type SiteReportSortField = typeof SITE_REPORT_SORT_FIELDS[number]

export const MIN_RATING = 1
export const MAX_RATING = 5

export type SiteReportVillaRef = {
  id: string
  villaNumber: string
  location: string
}

export type SiteReportPartyRef = {
  id: string
  name: string
}

export type SiteReport = {
  id: string
  villa: SiteReportVillaRef
  visitDate: string
  title: string
  inspector: string
  type: SiteReportTypeValue
  rating: number
  findings: string
  recommendations: string | null
  createdBy: SiteReportPartyRef | null
  version: number
  createdAt: string
  updatedAt: string
}

export type SiteReportsListParams = {
  page: number
  limit: number
  sort?: string
  villaId?: string
  type?: SiteReportTypeValue
  rating?: number
  visitFrom?: string
  visitTo?: string
  search?: string
}

export type SiteReportsListResponse = {
  data: SiteReport[]
  meta: PaginatedMeta
}

export type CreateSiteReportInput = {
  villaId: string
  title: string
  visitDate: string
  inspector: string
  type: SiteReportTypeValue
  rating: number
  findings: string
  recommendations?: string | null
}

export type UpdateSiteReportInput = {
  title?: string
  visitDate?: string
  inspector?: string
  type?: SiteReportTypeValue
  rating?: number
  findings?: string
  recommendations?: string | null
}
