import type { PaginatedMeta } from "@/shared/api/types"

/** What an additional expense is; `overhead.expenses.types.<TYPE>` is each one's label. */
export const EXPENSE_TYPES = [
  "INVOICE",
  "PURCHASE",
  "TRANSPORT",
  "OTHER",
] as const
export type ExpenseType = typeof EXPENSE_TYPES[number]

/** At most this many invoice files on one expense. */
export const MAX_EXPENSE_FILES = 10

export type ExpenseFile = {
  id: string
  name: string
  mime: string
  size: number
  uploadedAt: string
}

export type ExpenseVilla = {
  id: string
  villaNumber: string
}

/** An additional expense for one villa. `amountMinor` is KWD fils; `expenseDate` is YYYY-MM-DD. */
export type OverheadExpense = {
  id: string
  villa: ExpenseVilla
  type: ExpenseType
  description: string
  amountMinor: number
  expenseDate: string
  invoiceNumber: string | null
  files: ExpenseFile[]
  version: number
  createdAt: string
  updatedAt: string
}

/** Over every expense the filters match, not only this page. */
export type OverheadExpenseTotals = {
  count: number
  amountMinor: number
}

export type OverheadExpenseListParams = {
  page: number
  limit: number
  search?: string
  villaId?: string
  type?: ExpenseType
  sort?: string
}

export type OverheadExpenseListResponse = {
  data: OverheadExpense[]
  meta: PaginatedMeta
  totals: OverheadExpenseTotals
}

export type OverheadExpenseInput = {
  villaId: string
  type: ExpenseType
  description: string
  amountMinor: number
  expenseDate: string
  invoiceNumber: string | null
}

export type OverheadExpenseUpdate = Partial<OverheadExpenseInput>

export const EXPENSE_SORT_PATTERN =
  /^(expenseDate|amount|villaNumber|createdAt)(:(asc|desc))?$/
