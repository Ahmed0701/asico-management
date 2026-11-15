import type { PaginatedMeta } from "@/shared/api/types"

export type MonthlyProgressVilla = {
  id: string
  villaNumber: string
  location: string
}

export type MonthlyProgressContractor = {
  id: string
  name: string
}

/** One villa: its progress at the end of last month (null: not added yet), at the end of this month (now), and the change. */
export type MonthlyProgressItem = {
  villa: MonthlyProgressVilla
  contractor: MonthlyProgressContractor | null
  previousProgress: number | null
  currentProgress: number
  change: number
}

export type MonthlyProgressSummary = {
  month: string
  previousMonth: string
  isCurrentMonth: boolean
  villaCount: number
  averagePrevious: number
  averageCurrent: number
  averageChange: number
  improvedCount: number
  unchangedCount: number
}

export type MonthlyProgressParams = {
  page: number
  limit: number
  month?: string
  search?: string
  sort?: string
}

export type MonthlyProgressResponse = {
  data: MonthlyProgressItem[]
  meta: PaginatedMeta
  summary: MonthlyProgressSummary
}

export type MonthlyProgressSortField = "villaNumber" | "previous" | "current" | "change"
