import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import {
  buildWriteHeaders,
  executeWrite,
  type WriteRequest,
} from "@/shared/api/write-safety"
import type {
  CreateElectricalEngineerInput,
  ElectricalEngineer,
  ElectricalEngineerOption,
  ElectricalEngineersListParams,
  ElectricalEngineersListResponse,
  UpdateElectricalEngineerInput,
} from "./electrical-engineers.types"

export const OPTIONS_CAP = 1000

function shouldOmitSort(sort: string | undefined): boolean {
  if (!sort) return true
  return sort === "name" || sort === "name:asc"
}

export function buildElectricalEngineersListQueryParams(
  params: ElectricalEngineersListParams,
  options?: { forExport?: boolean },
): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  if (!options?.forExport) {
    out.page = params.page
    out.limit = params.limit
  }
  if (params.sort && !shouldOmitSort(params.sort)) out.sort = params.sort
  if (params.search) out.search = params.search
  if (params.status) out.status = params.status
  return out
}

function queryParams(params: ElectricalEngineersListParams) {
  return buildElectricalEngineersListQueryParams(params)
}

export async function listElectricalEngineers(
  params: ElectricalEngineersListParams,
  signal?: AbortSignal,
): Promise<ElectricalEngineersListResponse> {
  const res = await api.get<ElectricalEngineersListResponse>(
    "/electrical-engineers",
    {
      params: queryParams(params),
      signal,
    },
  )
  return { data: res.data.data, meta: res.data.meta }
}

export async function getElectricalEngineer(
  id: string,
): Promise<ElectricalEngineer> {
  return unwrap(
    api.get<ApiSuccess<ElectricalEngineer>>(`/electrical-engineers/${id}`),
  )
}

export async function listElectricalEngineerOptions(): Promise<ElectricalEngineerOption[]> {
  return unwrap(
    api.get<ApiSuccess<ElectricalEngineerOption[]>>(
      "/electrical-engineers/options",
    ),
  )
}

export async function createElectricalEngineer(
  input: CreateElectricalEngineerInput,
  write: WriteRequest,
): Promise<ElectricalEngineer> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<ElectricalEngineer>>("/electrical-engineers", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function updateElectricalEngineer(
  id: string,
  input: UpdateElectricalEngineerInput,
  write: WriteRequest,
): Promise<ElectricalEngineer> {
  return executeWrite(write, () =>
    unwrap(
      api.patch<ApiSuccess<ElectricalEngineer>>(
        `/electrical-engineers/${id}`,
        input,
        {
          headers: buildWriteHeaders(write),
        },
      ),
    ),
  )
}

export async function deleteElectricalEngineer(
  id: string,
  write: Pick<WriteRequest, "ifMatch">,
): Promise<void> {
  await executeWrite({ ...write }, () =>
    api.delete(`/electrical-engineers/${id}`, {
      headers: buildWriteHeaders(write),
    }),
  )
}
