import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import {
  buildWriteHeaders,
  executeWrite,
  type WriteRequest,
} from "@/shared/api/write-safety"
import type {
  OverheadEmployee,
  OverheadInput,
  OverheadListParams,
  OverheadListResponse,
  OverheadUpdate,
} from "./overhead.types"

const BASE = "/overhead-employees"

export async function listOverheadEmployees(
  params: OverheadListParams,
  signal?: AbortSignal,
): Promise<OverheadListResponse> {
  const query: Record<string, string | number> = {
    page: params.page,
    limit: params.limit,
  }
  if (params.search) query.search = params.search
  if (params.sort) query.sort = params.sort
  const res = await api.get<OverheadListResponse>(BASE, {
    params: query,
    signal,
  })
  return { data: res.data.data, meta: res.data.meta, totals: res.data.totals }
}

export async function createOverheadEmployee(
  input: OverheadInput,
  write: WriteRequest,
): Promise<OverheadEmployee> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<OverheadEmployee>>(BASE, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function updateOverheadEmployee(
  id: string,
  input: OverheadUpdate,
  write: Pick<WriteRequest, "ifMatch">,
): Promise<OverheadEmployee> {
  return executeWrite({ ...write }, () =>
    unwrap(
      api.patch<ApiSuccess<OverheadEmployee>>(`${BASE}/${id}`, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function deleteOverheadEmployee(
  id: string,
  write: Pick<WriteRequest, "ifMatch">,
): Promise<void> {
  await executeWrite({ ...write }, () =>
    api.delete(`${BASE}/${id}`, { headers: buildWriteHeaders(write) }),
  )
}
