import type { PaginatedMeta } from "@/shared/api/types"
import type { PartyStatus } from "@/shared/directory/party.types"

export type ElectricalEngineer = {
  id: string
  version: number
  name: string
  phone: string
  email?: string | null
  status: PartyStatus
  villaCount: number
  createdAt: string
  updatedAt: string
}

export type ElectricalEngineerOption = {
  id: string
  name: string
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
}

export type UpdateElectricalEngineerInput = {
  name?: string
  phone?: string
  email?: string | null
  status?: PartyStatus
}

export type ElectricalEngineersListResponse = {
  data: ElectricalEngineer[]
  meta: PaginatedMeta
}
