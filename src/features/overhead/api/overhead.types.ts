import type { PaginatedMeta } from "@/shared/api/types"

/** The roles an employee can have, picked from a list; `overhead.roles.<ROLE>` is each one's label. */
export const OVERHEAD_ROLES = [
  "ENGINEER",
  "FOREMAN",
  "WORKER",
  "DRIVER",
  "OTHER",
] as const
export type OverheadRole = typeof OVERHEAD_ROLES[number]

/** An employee of the department's overhead. `salaryMinor` is the monthly salary in KWD fils (1 KWD = 1000). */
export type OverheadEmployee = {
  id: string
  name: string
  role: OverheadRole
  salaryMinor: number
  version: number
  createdAt: string
  updatedAt: string
}

/** Over every employee the search matches, not only this page. */
export type OverheadTotals = {
  count: number
  monthlySalaryMinor: number
}

export type OverheadListParams = {
  page: number
  limit: number
  search?: string
  sort?: string
}

export type OverheadListResponse = {
  data: OverheadEmployee[]
  meta: PaginatedMeta
  totals: OverheadTotals
}

export type OverheadInput = {
  name: string
  role: OverheadRole
  salaryMinor: number
}

export type OverheadUpdate = Partial<OverheadInput>

export const OVERHEAD_SORT_PATTERN =
  /^(name|role|salary|createdAt)(:(asc|desc))?$/
