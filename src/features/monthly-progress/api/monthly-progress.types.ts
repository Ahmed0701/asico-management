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

export type PersonRef = {
  id: string
  name: string
}

/** A payment to a villa's contractor for its progress. `ratio` is the progress paid up to (0 to 100). */
export type ProgressPayment = {
  id: string
  ratio: number
  amountMinor: number
  workOrderMinor: number
  paidAt: string
  contractor: MonthlyProgressContractor | null
  paidBy: PersonRef | null
  /** Entered by hand (a payment made before the system). */
  manual: boolean
  note: string | null
}

/** A payment made before the system: its day (YYYY-MM-DD), the progress it paid up to, the amount in KWD fils, the
 * contractor (the villa's own when left out, null for none) and a note. */
export type ManualPaymentInput = {
  paidOn: string
  ratio: number
  amountMinor: number
  contractorId?: string | null
  note?: string | null
}

/** One payment in a villa's payment history, with the progress it was paid from (0 for the first). */
export type VillaPaymentHistoryItem = ProgressPayment & { fromRatio: number }

/** A villa's payments together, and where it stands now. Amounts in KWD fils. */
export type VillaPaymentHistorySummary = {
  count: number
  totalPaidMinor: number
  paidProgress: number
  currentProgress: number
  unpaidProgress: number
  workOrderMinor: number | null
  dueMinor: number
}

export type VillaPaymentHistory = {
  data: VillaPaymentHistoryItem[]
  summary: VillaPaymentHistorySummary
}

/**
 * One villa: its progress now and when its open works last changed, its last payment, and what its contractor is owed
 * now (the progress since that payment times the Work Order Value).
 */
export type MonthlyProgressItem = {
  villa: MonthlyProgressVilla
  contractor: MonthlyProgressContractor | null
  currentProgress: number
  lastUpdatedAt: string | null
  lastPayment: ProgressPayment | null
  paidProgress: number
  unpaidProgress: number
  /** KWD fils; null when not entered on the Villa Budget. */
  workOrderMinor: number | null
  /** KWD fils. */
  dueMinor: number
}

/** One contractor: its villas with something owed, and the total. */
export type MonthlyContractorDue = {
  contractor: MonthlyProgressContractor | null
  villaCount: number
  dueMinor: number
}

export type MonthlyProgressSummary = {
  villaCount: number
  owedCount: number
  totalDueMinor: number
  /** Villas with unpaid progress but no Work Order Value. */
  missingWorkOrderCount: number
  contractors: MonthlyContractorDue[]
}

export type MonthlyProgressParams = {
  page: number
  limit: number
  search?: string
  sort?: string
  /** Only the villas with unpaid progress. */
  owed?: boolean
  contractorId?: string
}

export type MonthlyProgressResponse = {
  data: MonthlyProgressItem[]
  meta: PaginatedMeta
  summary: MonthlyProgressSummary
}

export type MonthlyProgressSortField = "villaNumber" | "current" | "unpaid" | "due"
