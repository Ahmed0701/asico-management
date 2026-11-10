import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import {
  buildWriteHeaders,
  executeWrite,
  type WriteRequest,
} from "@/shared/api/write-safety"
import type {
  CreateElecPhaseInput,
  ElecPhase,
  ElecPhaseOption,
  ElecPhasesListParams,
  ElecPhasesListResponse,
  ReorderElecPhasesInput,
  UpdateElecPhaseInput,
} from "./elec-phases.types"

export const ELEC_PHASES_LIST_CAP = 1000

export function buildElecPhasesListQueryParams(
  params: ElecPhasesListParams,
): Record<string, string | number> {
  const out: Record<string, string | number> = {
    page: params.page,
    limit: params.limit,
  }
  if (params.status) out.status = params.status
  return out
}

export async function listElecPhases(
  params: ElecPhasesListParams,
  signal?: AbortSignal,
): Promise<ElecPhasesListResponse> {
  const res = await api.get<ElecPhasesListResponse>("/elec-phases", {
    params: buildElecPhasesListQueryParams(params),
    signal,
  })
  return { data: res.data.data, meta: res.data.meta }
}

export async function getElecPhase(id: string): Promise<ElecPhase> {
  return unwrap(api.get<ApiSuccess<ElecPhase>>(`/elec-phases/${id}`))
}

export async function listElecPhaseOptions(): Promise<ElecPhaseOption[]> {
  return unwrap(api.get<ApiSuccess<ElecPhaseOption[]>>("/elec-phases/options"))
}

export async function createElecPhase(
  input: CreateElecPhaseInput,
  write: WriteRequest,
): Promise<ElecPhase> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<ElecPhase>>("/elec-phases", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function updateElecPhase(
  id: string,
  input: UpdateElecPhaseInput,
  write: WriteRequest,
): Promise<ElecPhase> {
  return executeWrite(write, () =>
    unwrap(
      api.patch<ApiSuccess<ElecPhase>>(`/elec-phases/${id}`, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function reorderElecPhases(
  input: ReorderElecPhasesInput,
  write: WriteRequest,
): Promise<ElecPhase[]> {
  return executeWrite(write, () =>
    unwrap(
      api.put<ApiSuccess<ElecPhase[]>>("/elec-phases/order", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function deleteElecPhase(
  id: string,
  write: Pick<WriteRequest, "ifMatch">,
): Promise<void> {
  await executeWrite({ ...write }, () =>
    api.delete(`/elec-phases/${id}`, {
      headers: buildWriteHeaders(write),
    }),
  )
}
