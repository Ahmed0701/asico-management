import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import {
  buildWriteHeaders,
  executeWrite,
  type WriteRequest,
} from "@/shared/api/write-safety"
import type {
  CreateOpenWorkInput,
  OpenWork,
  OpenWorksListParams,
  OpenWorksListResponse,
  UpdateOpenWorkInput,
} from "./open-works.types"
import { OPEN_WORK_SORT_FIELDS } from "./open-works.types"

const DEFAULT_SORT = "location"

function shouldOmitSort(sort: string | undefined): boolean {
  if (!sort) return true
  return sort === DEFAULT_SORT || sort === "location:asc"
}

export function isValidOpenWorkListSort(sort: string): boolean {
  const base = sort.split(":")[0]
  if (
    !OPEN_WORK_SORT_FIELDS.includes(
      base as typeof OPEN_WORK_SORT_FIELDS[number],
    )
  ) {
    return false
  }
  if (!sort.includes(":")) return true
  const dir = sort.split(":")[1]
  return dir === "asc" || dir === "desc"
}

export function buildOpenWorksListQueryParams(
  params: OpenWorksListParams,
  options?: { forExport?: boolean },
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {}
  if (!options?.forExport) {
    out.page = params.page
    out.limit = params.limit
  }
  if (params.sort && !shouldOmitSort(params.sort)) out.sort = params.sort
  if (params.villaId) out.villaId = params.villaId
  if (params.elecPhaseId) out.elecPhaseId = params.elecPhaseId
  if (params.status) out.status = params.status
  if (params.priority) out.priority = params.priority
  if (params.contractorId) out.contractorId = params.contractorId
  if (params.overdue !== undefined) out.overdue = params.overdue
  if (params.done !== undefined) out.done = params.done
  if (params.startFrom) out.startFrom = params.startFrom
  if (params.startTo) out.startTo = params.startTo
  if (params.endFrom) out.endFrom = params.endFrom
  if (params.endTo) out.endTo = params.endTo
  if (params.search) out.search = params.search
  return out
}

export async function listOpenWorks(
  params: OpenWorksListParams,
  signal?: AbortSignal,
): Promise<OpenWorksListResponse> {
  const res = await api.get<OpenWorksListResponse>("/open-works", {
    params: buildOpenWorksListQueryParams(params),
    signal,
  })
  return { data: res.data.data, meta: res.data.meta }
}

export async function getOpenWork(id: string): Promise<OpenWork> {
  return unwrap(api.get<ApiSuccess<OpenWork>>(`/open-works/${id}`))
}

export async function createOpenWork(
  input: CreateOpenWorkInput,
  write: WriteRequest,
): Promise<OpenWork> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<OpenWork>>("/open-works", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function updateOpenWork(
  id: string,
  input: UpdateOpenWorkInput,
  write: WriteRequest,
): Promise<OpenWork> {
  return executeWrite(write, () =>
    unwrap(
      api.patch<ApiSuccess<OpenWork>>(`/open-works/${id}`, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function deleteOpenWork(
  id: string,
  write: WriteRequest,
): Promise<void> {
  return executeWrite(write, () =>
    api.delete(`/open-works/${id}`, {
      headers: buildWriteHeaders(write),
    }),
  )
}
