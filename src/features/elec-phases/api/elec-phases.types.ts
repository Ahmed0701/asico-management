export type ElecPhaseStatus = "ACTIVE" | "INACTIVE"

export type ElecPhase = {
  id: string
  name: string
  sortOrder: number
  status: ElecPhaseStatus
  /** 0–100: how much the phase counts in a villa's overall progress. */
  progressRatio: number
  version: number
  createdAt: string
  updatedAt: string
}

export type ElecPhaseOption = {
  id: string
  name: string
}

export type ElecPhasesListParams = {
  page: number
  limit: number
  status?: ElecPhaseStatus
}

export type ElecPhasesListResponse = {
  data: ElecPhase[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type CreateElecPhaseInput = {
  name: string
  status?: ElecPhaseStatus
  progressRatio?: number
}

export type UpdateElecPhaseInput = {
  name?: string
  status?: ElecPhaseStatus
  progressRatio?: number
}

export type ReorderElecPhasesInput = {
  ids: string[]
}
