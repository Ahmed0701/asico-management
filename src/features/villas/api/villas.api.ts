import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import {
  buildWriteHeaders,
  executeWrite,
  type WriteRequest,
} from "@/shared/api/write-safety"
import type {
  AreaOption,
  CreateVillaInput,
  MewState,
  PhaseProgressUpdateDto,
  UpdateVillaInput,
  VillaDetail,
  VillaFiltersDto,
  VillaListItem,
  VillaOption,
  VillasListParams,
  VillasListResponse,
} from "./villas.types"

export const OPTIONS_CAP = 1000

const LIST_SORT_PATTERN =
  /^(location|targetDate|villaNumber|progress|createdAt)(:(asc|desc))?$/

export function isValidVillaListSort(sort: string): boolean {
  return LIST_SORT_PATTERN.test(sort)
}

function shouldOmitListSort(sort: string | undefined): boolean {
  if (!sort) return true
  return sort === "location" || sort === "location:asc"
}

export function buildVillasQueryParams(
  params: VillasListParams,
  options?: { forExport?: boolean },
): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  if (!options?.forExport) {
    out.page = params.page
    out.limit = params.limit
  }
  if (params.sort && !shouldOmitListSort(params.sort)) out.sort = params.sort
  if (params.search) out.search = params.search
  if (params.area) out.area = params.area
  if (params.areaId) out.areaId = params.areaId
  if (params.block) out.block = params.block
  if (params.plot) out.plot = params.plot
  if (params.civilEngineerId) out.civilEngineerId = params.civilEngineerId
  if (params.electricalEngineerId) {
    out.electricalEngineerId = params.electricalEngineerId
  }
  if (params.contractorId) out.contractorId = params.contractorId
  if (params.villaType) out.villaType = params.villaType
  if (params.startFrom) out.startFrom = params.startFrom
  if (params.startTo) out.startTo = params.startTo
  if (params.targetFrom) out.targetFrom = params.targetFrom
  if (params.targetTo) out.targetTo = params.targetTo
  if (params.mewFollowUp !== undefined) {
    out.mewFollowUp = params.mewFollowUp ? "true" : "false"
  }
  if (params.mewInspection !== undefined) {
    out.mewInspection = params.mewInspection ? "true" : "false"
  }
  if (params.mewInspectionPassed !== undefined) {
    out.mewInspectionPassed = params.mewInspectionPassed ? "true" : "false"
  }
  return out
}

export async function listVillas(
  params: VillasListParams,
  signal?: AbortSignal,
): Promise<VillasListResponse> {
  const res = await api.get<VillasListResponse>("/villas", {
    params: buildVillasQueryParams(params),
    signal,
  })
  return res.data
}

export async function getVilla(id: string): Promise<VillaDetail> {
  return unwrap(api.get<ApiSuccess<VillaDetail>>(`/villas/${id}`))
}

export async function listVillaOptions(): Promise<VillaOption[]> {
  return unwrap(api.get<ApiSuccess<VillaOption[]>>("/villas/options"))
}

export async function listVillaFilters(): Promise<VillaFiltersDto> {
  return unwrap(api.get<ApiSuccess<VillaFiltersDto>>("/villas/filters"))
}

export async function listAreaOptions(): Promise<AreaOption[]> {
  return unwrap(api.get<ApiSuccess<AreaOption[]>>("/areas/options"))
}

export async function createVilla(
  input: CreateVillaInput,
  write: WriteRequest,
): Promise<VillaDetail> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<VillaDetail>>("/villas", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function updateVilla(
  id: string,
  input: UpdateVillaInput,
  write: WriteRequest,
): Promise<VillaDetail> {
  return executeWrite(write, () =>
    unwrap(
      api.patch<ApiSuccess<VillaDetail>>(`/villas/${id}`, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function deleteVilla(
  id: string,
  write: Pick<WriteRequest, "ifMatch">,
): Promise<void> {
  await executeWrite({ ...write }, () =>
    api.delete(`/villas/${id}`, {
      headers: buildWriteHeaders(write),
    }),
  )
}

export async function updateVillaPhaseProgress(
  villaId: string,
  elecPhaseId: string,
  progress: number,
  write: Pick<WriteRequest, "ifMatch">,
): Promise<PhaseProgressUpdateDto> {
  return executeWrite({ ...write }, () =>
    unwrap(
      api.patch<ApiSuccess<PhaseProgressUpdateDto>>(
        `/villas/${villaId}/phases/${elecPhaseId}`,
        { progress },
        { headers: buildWriteHeaders(write) },
      ),
    ),
  )
}

export type { VillaListItem, VillaDetail }

export async function markVillaMewFollowUp(
  id: string,
  write: WriteRequest,
): Promise<VillaListItem> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<VillaListItem>>(`/villas/${id}/mew-follow-up`, {}, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function unmarkVillaMewFollowUp(
  id: string,
  write: WriteRequest,
): Promise<VillaListItem> {
  return executeWrite(write, () =>
    unwrap(
      api.delete<ApiSuccess<VillaListItem>>(`/villas/${id}/mew-follow-up`, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function markVillaMewInspection(
  id: string,
  write: WriteRequest,
): Promise<VillaListItem> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<VillaListItem>>(`/villas/${id}/mew-inspection`, {}, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function unmarkVillaMewInspection(
  id: string,
  write: WriteRequest,
): Promise<VillaListItem> {
  return executeWrite(write, () =>
    unwrap(
      api.delete<ApiSuccess<VillaListItem>>(`/villas/${id}/mew-inspection`, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

// Written over several lines: the project's formatter (oxfmt 0.2) drops the ";" of a one-line type and breaks it.
export type MewStatesInput = {
  mewAcState?: MewState
  mewElecState?: MewState
  mewInspectionDate?: string | null
}

export async function setVillaMewStates(
  id: string,
  input: MewStatesInput,
  write: WriteRequest,
): Promise<VillaListItem> {
  return executeWrite(write, () =>
    unwrap(
      api.patch<ApiSuccess<VillaListItem>>(`/villas/${id}/mew-states`, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function markVillaMewInspectionPassed(
  id: string,
  write: WriteRequest,
): Promise<VillaListItem> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<VillaListItem>>(
        `/villas/${id}/mew-inspection-passed`,
        {},
        { headers: buildWriteHeaders(write) },
      ),
    ),
  )
}

export async function unmarkVillaMewInspectionPassed(
  id: string,
  write: WriteRequest,
): Promise<VillaListItem> {
  return executeWrite(write, () =>
    unwrap(
      api.delete<ApiSuccess<VillaListItem>>(
        `/villas/${id}/mew-inspection-passed`,
        { headers: buildWriteHeaders(write) },
      ),
    ),
  )
}
