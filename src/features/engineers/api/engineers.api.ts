import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import {
  buildWriteHeaders,
  executeWrite,
  type WriteRequest,
} from "@/shared/api/write-safety"
import type {
  CivilEngineer,
  CivilEngineerOption,
  CreateEngineerInput,
  EngineersListParams,
  EngineersListResponse,
  UpdateEngineerInput,
} from "./engineers.types"

export const OPTIONS_CAP = 1000

function shouldOmitSort(sort: string | undefined): boolean {
  if (!sort) return true
  return sort === "name" || sort === "name:asc"
}

export function buildEngineersListQueryParams(
  params: EngineersListParams,
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

function queryParams(params: EngineersListParams) {
  return buildEngineersListQueryParams(params)
}

export async function listEngineers(
  params: EngineersListParams,
  signal?: AbortSignal,
): Promise<EngineersListResponse> {
  const res = await api.get<EngineersListResponse>("/civil-engineers", {
    params: queryParams(params),
    signal,
  })
  return { data: res.data.data, meta: res.data.meta }
}

export async function getEngineer(id: string): Promise<CivilEngineer> {
  return unwrap(api.get<ApiSuccess<CivilEngineer>>(`/civil-engineers/${id}`))
}

export async function listEngineerOptions(): Promise<CivilEngineerOption[]> {
  return unwrap(
    api.get<ApiSuccess<CivilEngineerOption[]>>("/civil-engineers/options"),
  )
}

export async function createEngineer(
  input: CreateEngineerInput,
  write: WriteRequest,
): Promise<CivilEngineer> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<CivilEngineer>>("/civil-engineers", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function updateEngineer(
  id: string,
  input: UpdateEngineerInput,
  write: WriteRequest,
): Promise<CivilEngineer> {
  return executeWrite(write, () =>
    unwrap(
      api.patch<ApiSuccess<CivilEngineer>>(`/civil-engineers/${id}`, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function deleteEngineer(
  id: string,
  write: Pick<WriteRequest, "ifMatch">,
): Promise<void> {
  await executeWrite({ ...write }, () =>
    api.delete(`/civil-engineers/${id}`, {
      headers: buildWriteHeaders(write),
    }),
  )
}
