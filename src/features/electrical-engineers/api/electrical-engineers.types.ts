import type { PaginatedMeta } from "@/shared/api/types"
import type { PartyStatus } from "@/shared/directory/party.types"

export type ElectricalEngineer = {
  id: string
  version: number
  name: string
  phone: string
  email?: string | null
  status: PartyStatus
  /** The linked user account: signed in, it sees only this engineer's villas. */
  user?: { id: string; name: string; email: string } | null
  villaCount: number
  createdAt: string
  updatedAt: string
}

export type ElectricalEngineerOption = {
  id: string
  name: string
}

/** A user the engineer form can link: every user but the ADMINs, with the engineer it is linked to now. */
export type ElectricalEngineerUserOption = {
  id: string
  name: string
  email: string
  isActive: boolean
  engineer: { id: string; name: string } | null
}

export type ElectricalEngineersListParams = {
  page: number
  limit: number
  sort?: string
  search?: string
  status?: PartyStatus
}

export type CreateElectricalEngineerInput = {
  name: string
  phone: string
  email?: string | null
  userId?: string | null
}

export type UpdateElectricalEngineerInput = {
  name?: string
  phone?: string
  email?: string | null
  status?: PartyStatus
  userId?: string | null
}

export type ElectricalEngineersListResponse = {
  data: ElectricalEngineer[]
  meta: PaginatedMeta
}

/** The answer to moving every villa of an engineer to another one. */
export type TransferVillasResult = {
  moved: number
  to: { id: string; name: string }
}
