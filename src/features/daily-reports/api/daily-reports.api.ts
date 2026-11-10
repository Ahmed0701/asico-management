import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import {
  buildWriteHeaders,
  executeWrite,
  type WriteRequest,
} from "@/shared/api/write-safety"
import type {
  CreateDailyReportInput,
  DailyReport,
  DailyReportsListParams,
  DailyReportsListResponse,
  UpdateDailyReportInput,
} from "./daily-reports.types"
import { DAILY_REPORT_SORT_FIELDS } from "./daily-reports.types"

const DEFAULT_SORT = "reportDate:desc"

function shouldOmitSort(sort: string | undefined): boolean {
  if (!sort) return true
  return sort === DEFAULT_SORT || sort === "reportDate:desc"
}

export function isValidDailyReportListSort(sort: string): boolean {
  const base = sort.split(":")[0]
  if (
    !DAILY_REPORT_SORT_FIELDS.includes(
      base as typeof DAILY_REPORT_SORT_FIELDS[number],
    )
  ) {
    return false
  }
  if (!sort.includes(":")) return true
  const dir = sort.split(":")[1]
  return dir === "asc" || dir === "desc"
}

export function buildDailyReportsListQueryParams(
  params: DailyReportsListParams,
  options?: { forExport?: boolean },
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {}
  if (!options?.forExport) {
    out.page = params.page
    out.limit = params.limit
  }
  if (params.sort && !shouldOmitSort(params.sort)) out.sort = params.sort
  if (params.contractorId) out.contractorId = params.contractorId
  if (params.preparedByEngineerId) {
    out.preparedByEngineerId = params.preparedByEngineerId
  }
  if (params.weather) out.weather = params.weather
  if (params.reportFrom) out.reportFrom = params.reportFrom
  if (params.reportTo) out.reportTo = params.reportTo
  if (params.search) out.search = params.search
  return out
}

export async function listDailyReports(
  params: DailyReportsListParams,
  signal?: AbortSignal,
): Promise<DailyReportsListResponse> {
  const res = await api.get<DailyReportsListResponse>("/daily-reports", {
    params: buildDailyReportsListQueryParams(params),
    signal,
  })
  return { data: res.data.data, meta: res.data.meta }
}

export async function getDailyReport(id: string): Promise<DailyReport> {
  return unwrap(api.get<ApiSuccess<DailyReport>>(`/daily-reports/${id}`))
}

export async function createDailyReport(
  input: CreateDailyReportInput,
  write: WriteRequest,
): Promise<DailyReport> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<DailyReport>>("/daily-reports", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function updateDailyReport(
  id: string,
  input: UpdateDailyReportInput,
  write: WriteRequest,
): Promise<DailyReport> {
  return executeWrite(write, () =>
    unwrap(
      api.patch<ApiSuccess<DailyReport>>(`/daily-reports/${id}`, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function deleteDailyReport(
  id: string,
  write: WriteRequest,
): Promise<void> {
  return executeWrite(write, () =>
    api.delete(`/daily-reports/${id}`, {
      headers: buildWriteHeaders(write),
    }),
  )
}
