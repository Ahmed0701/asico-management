import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import {
  buildWriteHeaders,
  executeWrite,
  type WriteRequest,
} from "@/shared/api/write-safety"
import type {
  CreateDailyLabourInput,
  DailyLabour,
  DailyLabourListParams,
  DailyLabourListResponse,
  UpdateDailyLabourInput,
} from "./daily-labour.types"
import { DAILY_LABOUR_SORT_FIELDS } from "./daily-labour.types"

const DEFAULT_SORT = "labourDate:desc"

function shouldOmitSort(sort: string | undefined): boolean {
  if (!sort) return true
  return sort === DEFAULT_SORT || sort === "labourDate:desc"
}

export function isValidDailyLabourListSort(sort: string): boolean {
  const base = sort.split(":")[0]
  if (
    !DAILY_LABOUR_SORT_FIELDS.includes(
      base as typeof DAILY_LABOUR_SORT_FIELDS[number],
    )
  ) {
    return false
  }
  if (!sort.includes(":")) return true
  const dir = sort.split(":")[1]
  return dir === "asc" || dir === "desc"
}

export function buildDailyLabourListQueryParams(
  params: DailyLabourListParams,
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
  if (params.labourFrom) out.labourFrom = params.labourFrom
  if (params.labourTo) out.labourTo = params.labourTo
  if (params.search) out.search = params.search
  return out
}

export async function listDailyLabour(
  params: DailyLabourListParams,
  signal?: AbortSignal,
): Promise<DailyLabourListResponse> {
  const res = await api.get<DailyLabourListResponse>("/daily-labour", {
    params: buildDailyLabourListQueryParams(params),
    signal,
  })
  return { data: res.data.data, meta: res.data.meta }
}

export async function getDailyLabour(id: string): Promise<DailyLabour> {
  return unwrap(api.get<ApiSuccess<DailyLabour>>(`/daily-labour/${id}`))
}

export async function createDailyLabour(
  input: CreateDailyLabourInput,
  write: WriteRequest,
): Promise<DailyLabour> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<DailyLabour>>("/daily-labour", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function updateDailyLabour(
  id: string,
  input: UpdateDailyLabourInput,
  write: WriteRequest,
): Promise<DailyLabour> {
  return executeWrite(write, () =>
    unwrap(
      api.patch<ApiSuccess<DailyLabour>>(`/daily-labour/${id}`, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function deleteDailyLabour(
  id: string,
  write: WriteRequest,
): Promise<void> {
  return executeWrite(write, () =>
    api.delete(`/daily-labour/${id}`, {
      headers: buildWriteHeaders(write),
    }),
  )
}
