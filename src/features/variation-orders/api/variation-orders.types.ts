export const VARIATION_ORDER_STATUSES = ["PENDING", "PAID"] as const
export type VariationOrderStatus = (typeof VARIATION_ORDER_STATUSES)[number]

export type VariationOrderFile = {
  id: string
  name: string
  mime: string
  size: number
  uploadedAt: string
}

/** A variation order of a villa. `amountMinor` is KWD fils; `dateAdded` is YYYY-MM-DD. */
export type VariationOrder = {
  id: string
  villaId: string
  voNumber: string
  amountMinor: number
  dateAdded: string
  status: VariationOrderStatus
  notes: string | null
  files: VariationOrderFile[]
  version: number
  createdAt: string
  updatedAt: string
}

export type VariationOrderTotals = {
  pendingMinor: number
  paidMinor: number
}

export type VariationOrdersResponse = {
  data: VariationOrder[]
  totals: VariationOrderTotals
}

export type VariationOrderInput = {
  voNumber: string
  amountMinor: number
  dateAdded: string
  status: VariationOrderStatus
  notes: string | null
}

export type VariationOrderUpdate = Partial<VariationOrderInput>
