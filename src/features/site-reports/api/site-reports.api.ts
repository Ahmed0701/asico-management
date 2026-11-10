import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import {
  buildWriteHeaders,
  executeWrite,
  type WriteRequest,
} from "@/shared/api/write-safety"
import type {
  CreateSiteReportInput,
  SiteReport,
  SiteReportsListParams,
  SiteReportsListResponse,
  UpdateSiteReportInput,
} from "./site-reports.types"
import { SITE_REPORT_SORT_FIELDS } from "./site-reports.types"

const DEFAULT_SORT = "visitDate:desc"

function shouldOmitSort(sort: string | undefined): boolean {
  if (!sort) return true
  return sort === DEFAULT_SORT || sort === "visitDate:desc"
}

export function isValidSiteReportsListSort(sort: string): boolean {
  const base = sort.split(":")[0]
  if (
    !SITE_REPORT_SORT_FIELDS.includes(
      base as typeof SITE_REPORT_SORT_FIELDS[number],
    )
  ) {
    return false
  }
  if (!sort.includes(":")) return true
  const dir = sort.split(":")[1]
  return dir === "asc" || dir === "desc"
}

export function buildSiteReportsListQueryParams(
  params: SiteReportsListParams,
  options?: { forExport?: boolean },
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {}
  if (!options?.forExport) {
    out.page = params.page
    out.limit = params.limit
  }
  if (params.sort && !shouldOmitSort(params.sort)) out.sort = params.sort
  if (params.villaId) out.villaId = params.villaId
  if (params.type) out.type = params.type
  if (params.rating !== undefined) out.rating = params.rating
  if (params.visitFrom) out.visitFrom = params.visitFrom
  if (params.visitTo) out.visitTo = params.visitTo
  if (params.search) out.search = params.search
  return out
}

export async function listSiteReports(
  params: SiteReportsListParams,
  signal?: AbortSignal,
): Promise<SiteReportsListResponse> {
  const res = await api.get<SiteReportsListResponse>("/site-reports", {
    params: buildSiteReportsListQueryParams(params),
    signal,
  })
  return { data: res.data.data, meta: res.data.meta }
}

export async function getSiteReport(id: string): Promise<SiteReport> {
  return unwrap(api.get<ApiSuccess<SiteReport>>(`/site-reports/${id}`))
}

export async function createSiteReport(
  input: CreateSiteReportInput,
  write: WriteRequest,
): Promise<SiteReport> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<SiteReport>>("/site-reports", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function updateSiteReport(
  id: string,
  input: UpdateSiteReportInput,
  write: WriteRequest,
): Promise<SiteReport> {
  return executeWrite(write, () =>
    unwrap(
      api.patch<ApiSuccess<SiteReport>>(`/site-reports/${id}`, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function deleteSiteReport(
  id: string,
  write: WriteRequest,
): Promise<void> {
  return executeWrite(write, () =>
    api.delete(`/site-reports/${id}`, {
      headers: buildWriteHeaders(write),
    }),
  )
}
