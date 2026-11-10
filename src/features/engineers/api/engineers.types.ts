import type { PaginatedMeta } from "@/shared/api/types"
import type { PartyStatus } from "@/shared/directory/party.types"

export type CivilEngineer = {
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

export type CivilEngineerOption = {
  id: string
  name: string
}

export type EngineersListParams = {
  page: number
  limit: number
  sort?: string
  search?: string
  status?: PartyStatus
}

export type CreateEngineerInput = {
  name: string
  phone: string
  email?: string | null
}

export type UpdateEngineerInput = {
  name?: string
  phone?: string
  email?: string | null
  status?: PartyStatus
}

export type EngineersListResponse = {
  data: CivilEngineer[]
  meta: PaginatedMeta
}
