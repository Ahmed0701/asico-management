import type { PaginatedMeta } from "@/shared/api/types"

export const STORE_CATEGORIES = ["WIRE", "BOX", "OTHER"] as const
export type StoreCategory = typeof STORE_CATEGORIES[number]

/** The units an item is counted in. Stored as these words (the exports are in English); shown translated. */
export const STORE_UNITS = ["Set", "Roll", "Pcs"] as const
export type StoreUnit = typeof STORE_UNITS[number]

export const STORE_MOVEMENT_KINDS = [
  "RECEIVE",
  "ISSUE",
  "ADJUST",
  "TRANSFER",
] as const

/** A store: a place the company keeps stock (Mutlaa, Khitan). */
export type StoreWarehouse = {
  id: string
  name: string
}

/** An item's stock in one store. `low`: active, with a minimum, and this stock at or below it. */
export type StoreStock = {
  warehouse: StoreWarehouse
  quantity: number
  low: boolean
}
export type StoreMovementKind = typeof STORE_MOVEMENT_KINDS[number]

/** The categories that have factories: wires and boxes. */
export const STORE_FACTORY_CATEGORIES = ["WIRE", "BOX"] as const
export type StoreFactoryCategory = typeof STORE_FACTORY_CATEGORIES[number]

export type StoreFactoryRef = {
  id: string
  name: string
}

/** A name in the list items are named from, with its category. */
export type StoreItemName = {
  id: string
  name: string
  category: StoreCategory
  /** A wire's factory; null for anything else. An item added from this entry gets it. */
  factory: StoreFactoryRef | null
  /** The unit an item added from this entry is counted in. */
  unit: string
  createdAt: string
}

export type StoreItemNameInput = {
  name: string
  category: StoreCategory
  factoryId: string | null
  unit: string
}

export type StoreItemNameUpdate = Partial<StoreItemNameInput>

/** A factory the store's wires or boxes come from. It can be deleted only when no item comes from it. */
export type StoreFactory = {
  id: string
  name: string
  category: StoreFactoryCategory
  itemCount: number
  createdAt: string
}

export type StoreFactoryInput = {
  name: string
  category: StoreFactoryCategory
}

/** An item of the store and its stock now (in `unit`). `low`: active, with a minimum, and the stock at or below it. */
export type StoreItem = {
  id: string
  name: string
  category: StoreCategory
  unit: string
  /** Where a wire or a box comes from; null for anything else (or an item added before factories existed). */
  factory: StoreFactoryRef | null
  /** In the store the list asked for (warehouseId), or in all the stores together. */
  quantity: number
  minQuantity: number | null
  /** Low in the store the list asked for, or in any store. */
  low: boolean
  /** Its stock in every store, in the stores' order. */
  stocks: StoreStock[]
  active: boolean
  notes: string | null
  /** When the stock last changed; null when it never moved. */
  lastMovementAt: string | null
  version: number
  createdAt: string
  updatedAt: string
}

/** Over every active item, whatever the filters. */
export type StoreSummary = {
  itemCount: number
  lowCount: number
  outCount: number
}

export type StoreItemOption = {
  id: string
  name: string
  unit: string
  category: StoreCategory
  /** A wire's factory; null for anything else. */
  factory: StoreFactoryRef | null
  /** Its stock in each store it has any in. */
  stocks: {
    warehouseId: string
    quantity: number
  }[]
}

/**
 * One change of an item's stock. `change` is signed (in above zero, out below); `quantity` is its size.
 * `latest`: the item's last movement, the only one that can be taken back.
 */
export type StoreMovement = {
  id: string
  item: {
    id: string
    name: string
    unit: string
    category: StoreCategory
    /** A wire's factory; null for anything else. */
    factory: StoreFactoryRef | null
  }
  /** The store whose stock it changed. */
  warehouse: StoreWarehouse
  /** For a transfer, the other store. */
  transfer: {
    id: string
    warehouse: StoreWarehouse
  } | null
  kind: StoreMovementKind
  change: number
  quantity: number
  balanceAfter: number
  villa: {
    id: string
    villaNumber: string
  } | null
  party: string | null
  reference: string | null
  note: string | null
  /** YYYY-MM-DD */
  movedOn: string
  createdBy: {
    id: string
    name: string
  } | null
  createdAt: string
  latest: boolean
}

export type StoreItemsParams = {
  page: number
  limit: number
  search?: string
  sort?: string
  category?: StoreCategory
  factoryId?: string
  /** The store quantity, low, the sort by quantity, the low filter and the summary are about. */
  warehouseId?: string
  low?: boolean
  active?: boolean
}

export type StoreItemsResponse = {
  data: StoreItem[]
  meta: PaginatedMeta
  summary: StoreSummary
}

export type StoreMovementsParams = {
  page: number
  limit: number
  search?: string
  warehouseId?: string
  itemId?: string
  villaId?: string
  kind?: StoreMovementKind
}

export type StoreMovementsResponse = {
  data: StoreMovement[]
  meta: PaginatedMeta
}

export type StoreItemInput = {
  name: string
  category: StoreCategory
  unit: string
  minQuantity: number | null
  /** Needed for a wire or a box (one of that category's factories); null for anything else. */
  factoryId: string | null
  notes: string | null
  openingQuantity?: number
  /** The store the opening stock is in. */
  openingWarehouseId?: string
}

export type StoreItemUpdate = Partial<Omit<StoreItemInput, "openingQuantity">> & {
  active?: boolean
}

export type StoreMovementInput = {
  itemId: string
  /** The store it happens in (for a transfer, the store it leaves). */
  warehouseId: string
  /** Only for a transfer: the other store. */
  toWarehouseId?: string | null
  kind: StoreMovementKind
  quantity: number
  villaId?: string | null
  party?: string | null
  reference?: string | null
  note?: string | null
  movedOn?: string
}
