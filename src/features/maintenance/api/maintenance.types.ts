import type { PaginatedMeta } from "@/shared/api/types"

/** A villa that needs maintenance. The villa number and location are typed by hand (not linked to the villas). */
export type MaintenanceVilla = {
  id: string
  villaNumber: string
  location: string
  /** YYYY-MM-DD */
  handoverDate: string
  issue: string
  solved: boolean
  /** When it was checked as solved; null while it is open. */
  solvedAt: string | null
  version: number
  createdAt: string
  updatedAt: string
}

export type MaintenanceListParams = {
  page: number
  limit: number
  search?: string
  /** true: the solved list; false: the open list. */
  solved: boolean
}

export type MaintenanceListResponse = {
  data: MaintenanceVilla[]
  meta: PaginatedMeta
}

export type MaintenanceInput = {
  villaNumber: string
  location: string
  handoverDate: string
  issue: string
}

export type MaintenanceUpdate = Partial<MaintenanceInput> & {
  solved?: boolean
}
