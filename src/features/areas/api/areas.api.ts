import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import {
  buildWriteHeaders,
  executeWrite,
  type WriteRequest,
} from "@/shared/api/write-safety"
import type {
  Area,
  AreaOption,
  AreasListParams,
  AreasListResponse,
  CreateAreaInput,
  UpdateAreaInput,
} from "./areas.types"

export const AREA_SORT_FIELDS = [
  "name",
  "city",
  "villaCount",
  "createdAt",
] as const

const DEFAULT_SORT = "name"

function shouldOmitSort(sort: string | undefined): boolean {
  if (!sort) return true
  return sort === DEFAULT_SORT || sort === "name:asc"
}

export function isValidAreaListSort(sort: string): boolean {
  const base = sort.split(":")[0]
  if (!AREA_SORT_FIELDS.includes(base as typeof AREA_SORT_FIELDS[number])) {
    return false
  }
  if (!sort.includes(":")) return true
  const dir = sort.split(":")[1]
  return dir === "asc" || dir === "desc"
}

export function buildAreasListQueryParams(
  params: AreasListParams,
  options?: { forExport?: boolean },
): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  if (!options?.forExport) {
    out.page = params.page
    out.limit = params.limit
  }
  if (params.sort && !shouldOmitSort(params.sort)) out.sort = params.sort
  if (params.search) out.search = params.search
  return out
}

export async function listAreas(
  params: AreasListParams,
  signal?: AbortSignal,
): Promise<AreasListResponse> {
  const res = await api.get<AreasListResponse>("/areas", {
    params: buildAreasListQueryParams(params),
    signal,
  })
  return { data: res.data.data, meta: res.data.meta }
}

export async function getArea(id: string): Promise<Area> {
  return unwrap(api.get<ApiSuccess<Area>>(`/areas/${id}`))
}

export async function listAreaOptions(): Promise<AreaOption[]> {
  return unwrap(api.get<ApiSuccess<AreaOption[]>>("/areas/options"))
}

export async function createArea(
  input: CreateAreaInput,
  write: WriteRequest,
): Promise<Area> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<Area>>("/areas", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function updateArea(
  id: string,
  input: UpdateAreaInput,
  write: WriteRequest,
): Promise<Area> {
  return executeWrite(write, () =>
    unwrap(
      api.patch<ApiSuccess<Area>>(`/areas/${id}`, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function deleteArea(
  id: string,
  write: Pick<WriteRequest, "ifMatch">,
): Promise<void> {
  await executeWrite({ ...write }, () =>
    api.delete(`/areas/${id}`, {
      headers: buildWriteHeaders(write),
    }),
  )
}
