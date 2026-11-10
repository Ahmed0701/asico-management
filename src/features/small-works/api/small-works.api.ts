import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import {
  buildWriteHeaders,
  executeWrite,
  type WriteRequest,
} from "@/shared/api/write-safety"
import type {
  CreateSmallWorkInput,
  SmallWork,
  SmallWorksListParams,
  SmallWorksListResponse,
  UpdateSmallWorkInput,
} from "./small-works.types"
import { SMALL_WORK_SORT_FIELDS } from "./small-works.types"

const DEFAULT_SORT = "endDate:desc"

function shouldOmitSort(sort: string | undefined): boolean {
  if (!sort) return true
  return sort === DEFAULT_SORT || sort === "endDate:desc"
}

export function isValidSmallWorksListSort(sort: string): boolean {
  const base = sort.split(":")[0]
  if (
    !SMALL_WORK_SORT_FIELDS.includes(
      base as typeof SMALL_WORK_SORT_FIELDS[number],
    )
  ) {
    return false
  }
  if (!sort.includes(":")) return true
  const dir = sort.split(":")[1]
  return dir === "asc" || dir === "desc"
}

export function buildSmallWorksListQueryParams(
  params: SmallWorksListParams,
  options?: { forExport?: boolean },
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {}
  if (!options?.forExport) {
    out.page = params.page
    out.limit = params.limit
  }
  if (params.sort && !shouldOmitSort(params.sort)) out.sort = params.sort
  if (params.villaId) out.villaId = params.villaId
  if (params.contractorId) out.contractorId = params.contractorId
  if (params.status) out.status = params.status
  if (params.startFrom) out.startFrom = params.startFrom
  if (params.startTo) out.startTo = params.startTo
  if (params.endFrom) out.endFrom = params.endFrom
  if (params.endTo) out.endTo = params.endTo
  if (params.overdue === true) out.overdue = true
  if (params.overdue === false) out.overdue = false
  if (params.dueSoon === true) out.dueSoon = true
  if (params.dueSoon === false) out.dueSoon = false
  if (params.search) out.search = params.search
  return out
}

export async function listSmallWorks(
  params: SmallWorksListParams,
  signal?: AbortSignal,
): Promise<SmallWorksListResponse> {
  const res = await api.get<SmallWorksListResponse>("/small-works", {
    params: buildSmallWorksListQueryParams(params),
    signal,
  })
  return { data: res.data.data, meta: res.data.meta }
}

export async function getSmallWork(id: string): Promise<SmallWork> {
  return unwrap(api.get<ApiSuccess<SmallWork>>(`/small-works/${id}`))
}

export async function createSmallWork(
  input: CreateSmallWorkInput,
  write: WriteRequest,
): Promise<SmallWork> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<SmallWork>>("/small-works", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function updateSmallWork(
  id: string,
  input: UpdateSmallWorkInput,
  write: WriteRequest,
): Promise<SmallWork> {
  return executeWrite(write, () =>
    unwrap(
      api.patch<ApiSuccess<SmallWork>>(`/small-works/${id}`, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function deleteSmallWork(
  id: string,
  write: WriteRequest,
): Promise<void> {
  return executeWrite(write, () =>
    api.delete(`/small-works/${id}`, {
      headers: buildWriteHeaders(write),
    }),
  )
}
