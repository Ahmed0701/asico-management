import type { PaginatedMeta } from "@/shared/api/types"

export const FACTORY_TYPES = ["SWITCHGEAR", "CABLE"] as const
export type FactoryType = typeof FACTORY_TYPES[number]

export const BALANCE_STATUSES = ["PENDING", "COMPLETE", "OVER"] as const
export type BalanceStatus = typeof BALANCE_STATUSES[number]

export type Factory = {
  id: string
  name: string
  type: FactoryType
  /** A factory with deliveries cannot be deleted. */
  deliveryCount: number
  version: number
  createdAt: string
  updatedAt: string
}

/** A material of the catalog (MSB Box, DB Interior, a cable size...). */
export type MaterialItem = {
  id: string
  name: string
  type: FactoryType
  unit: string
  sortOrder: number
  /** How much every villa needs, unless a villa has its own quantity (0: not needed). */
  requiredPerVilla: number
  /** How many delivery lines use it: an item in use cannot be deleted. */
  lineCount: number
  version: number
  createdAt: string
  updatedAt: string
}

export type DeliveryNote = {
  id: string
  name: string
  mimeType: string
  sizeBytes: number
  uploadedAt: string
}

export type DeliveryLine = {
  item: {
    id: string
    name: string
    unit: string
  }
  quantity: number
}

export type MaterialDelivery = {
  id: string
  villa: {
    id: string
    villaNumber: string
  }
  factory: {
    id: string
    name: string
    type: FactoryType
  }
  /** The materials of the delivery, in catalog order. */
  lines: DeliveryLine[]
  noteNumber: string | null
  /** YYYY-MM-DD */
  deliveryDate: string
  /** The material request (MR) date, YYYY-MM-DD; null when not known. */
  mrDate: string | null
  /** The purchase order (PO) date, YYYY-MM-DD; null when not known. */
  poDate: string | null
  /** The delivery note files, oldest first; empty until one is uploaded. */
  deliveryNotes: DeliveryNote[]
  version: number
  createdAt: string
  updatedAt: string
}

export type DeliveriesListParams = {
  page: number
  limit: number
  search?: string
  villaId?: string
  factoryId?: string
  /** Only the deliveries that brought this catalog material. */
  itemId?: string
  type?: FactoryType
  /** true: with a delivery note; false: still missing it. */
  hasNote?: boolean
  /** "villaNumber:asc" or "villaNumber:desc"; the latest delivery first when absent. */
  sort?: string
}

export type DeliveriesListResponse = {
  data: MaterialDelivery[]
  meta: PaginatedMeta
}

export type LineInput = {
  itemId: string
  quantity: number
}

export type DeliveryInput = {
  villaId: string
  factoryId: string
  lines: LineInput[]
  noteNumber: string | null
  deliveryDate: string
  mrDate: string | null
  poDate: string | null
}

export type ItemInput = {
  name: string
  type: FactoryType
  unit: string
  requiredPerVilla: number
}

/** One material of a villa: what it needs, what came, and what is still to come. */
export type MaterialTotal = {
  type: FactoryType
  itemId: string
  name: string
  unit: string
  required: number
  /** The villa has its own quantity instead of the catalog's. */
  custom: boolean
  delivered: number
  /** Required minus delivered; below 0 when more came than needed. */
  balance: number
  status: BalanceStatus
  deliveries: number
  withNote: number
}

export type MaterialsSummary = {
  villaId: string
  deliveries: number
  withNote: number
  withoutNote: number
  byType: {
    type: FactoryType
    deliveries: number
  }[]
  materials: MaterialTotal[]
}

export type BalanceRow = {
  villa: {
    id: string
    villaNumber: string
  }
  item: {
    id: string
    name: string
    unit: string
    type: FactoryType
  }
  required: number
  custom: boolean
  delivered: number
  balance: number
  status: BalanceStatus
}

export type BalanceTotal = {
  item: {
    id: string
    name: string
    unit: string
    type: FactoryType
  }
  /** Still to come, added up over every matching villa. */
  balance: number
  /** How many villas still wait for it. */
  villas: number
}

export type BalanceListParams = {
  page: number
  limit: number
  search?: string
  itemId?: string
  type?: FactoryType
  status?: BalanceStatus
}

export type BalanceListResponse = {
  data: BalanceRow[]
  meta: PaginatedMeta
  totals: BalanceTotal[]
}

/** How much of a villa's materials of one type came. */
export const MATERIAL_ORDER_STATUSES = [
  "DELIVERED",
  "PARTIAL",
  "NOT_DELIVERED",
  "NOT_REQUIRED",
] as const
export type MaterialOrderStatus = (typeof MATERIAL_ORDER_STATUSES)[number]

/** One villa's switchgear or cables: its MR, PO and due dates (YYYY-MM-DD) and what came. */
export type MaterialOrder = {
  villa: { id: string; villaNumber: string }
  type: FactoryType
  factory: { id: string; name: string } | null
  mrDate: string | null
  poDate: string | null
  dueDate: string | null
  /** The earliest MR and PO dates on its delivery notes: shown when none is entered. */
  deliveryMrDate: string | null
  deliveryPoDate: string | null
  lastDeliveryDate: string | null
  requiredItems: number
  completeItems: number
  status: MaterialOrderStatus
  overdue: boolean
}

export type MaterialOrdersSummary = {
  total: number
  delivered: number
  partial: number
  notDelivered: number
  overdue: number
}

export type MaterialOrdersParams = {
  page: number
  limit: number
  search?: string
  type?: FactoryType
  status?: MaterialOrderStatus
  overdue?: boolean
  sort?: string
}

export type MaterialOrdersResponse = {
  data: MaterialOrder[]
  meta: PaginatedMeta
  summary: MaterialOrdersSummary
}

/** The three dates, each YYYY-MM-DD or null. */
export type MaterialOrderDates = {
  mrDate: string | null
  poDate: string | null
  dueDate: string | null
}
