import type { PaginatedMeta } from "@/shared/api/types"

export const PAYMENT_STATUSES = ["PENDING", "PAID"] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const PAYMENT_METHODS = ["CASH", "CHEQUE", "BANK_TRANSFER"] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export type PaymentFile = {
  id: string
  name: string
  mime: string
  size: number
  uploadedAt: string
}

export type PaymentContractor = {
  id: string
  name: string
}

export type PaymentVilla = {
  id: string
  villaNumber: string
  location: string
}

/** A payment to a contractor. Amounts are KWD fils (1 KWD = 1000); dates are YYYY-MM-DD. */
export type Payment = {
  id: string
  contractor: PaymentContractor
  villa: PaymentVilla | null
  amountMinor: number
  status: PaymentStatus
  dueDate: string | null
  paidDate: string | null
  method: PaymentMethod | null
  reference: string | null
  notes: string | null
  /** Pending and past its due date (reminded every day). */
  overdue: boolean
  files: PaymentFile[]
  version: number
  createdAt: string
  updatedAt: string
}

export type PaymentTotals = {
  pendingMinor: number
  overdueMinor: number
  paidMinor: number
}

export type PaymentsListParams = {
  page: number
  limit: number
  sort?: string
  search?: string
  status?: PaymentStatus
  contractorId?: string
  villaId?: string
  overdue?: boolean
}

export type PaymentsListResponse = {
  data: Payment[]
  meta: PaginatedMeta
  totals: PaymentTotals
}

export type PaymentInput = {
  contractorId: string
  villaId: string | null
  amountMinor: number
  status: PaymentStatus
  dueDate: string | null
  paidDate: string | null
  method: PaymentMethod | null
  reference: string | null
  notes: string | null
}

export type PaymentUpdate = Partial<PaymentInput>
