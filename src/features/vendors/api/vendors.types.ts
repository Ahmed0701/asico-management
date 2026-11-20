import type { FactoryType } from "@/features/materials/api"
import type { PaginatedMeta } from "@/shared/api/types"

export type AssignedFactory = {
  id: string
  name: string
}

export type VendorVilla = {
  id: string
  villaNumber: string
  location: string
}

/** A villa and the factories assigned to supply it; null while none. `version` is the villa's, for If-Match. */
export type VillaVendors = {
  villa: VendorVilla
  switchgear: AssignedFactory | null
  cable: AssignedFactory | null
  version: number
  /** When the villa was added to the Vendors list; null while it is not on it. */
  listedAt: string | null
}

/** A villa not on the Vendors list yet, that can be added. */
export type AvailableVendorVilla = {
  id: string
  villaNumber: string
}

export type VillaVendorsSummary = {
  villaCount: number
  withSwitchgear: number
  withCable: number
  withNone: number
}

export type VillaVendorsParams = {
  page: number
  limit: number
  search?: string
  factoryId?: string
  /** The villas with no factory of that type assigned yet. */
  missing?: FactoryType
  sort?: string
}

export type VillaVendorsResponse = {
  data: VillaVendors[]
  meta: PaginatedMeta
  summary: VillaVendorsSummary
}

/** What an assignment changes; null takes the factory off the villa. */
export type VillaVendorsInput = {
  switchgearFactoryId?: string | null
  cableFactoryId?: string | null
}
