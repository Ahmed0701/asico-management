import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import type {
  AuditFiltersData,
  AuditListParams,
  AuditListResponse,
  AuditLogDetail,
} from "./audit.types"

export function buildAuditListQueryParams(
  params: AuditListParams,
  options?: { forExport?: boolean },
): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  if (!options?.forExport) {
    out.page = params.page
    out.limit = params.limit
  }
  if (params.sort === "createdAt:asc") out.sort = "createdAt:asc"
  else if (params.sort === "createdAt:desc") out.sort = "createdAt:desc"
  if (params.actorId) out.actorId = params.actorId
  if (params.action) out.action = params.action
  if (params.entity) out.entity = params.entity
  if (params.entityId) out.entityId = params.entityId
  if (params.from) out.from = params.from
  if (params.to) out.to = params.to
  if (params.search) out.search = params.search
  return out
}

function queryParams(params: AuditListParams) {
  return buildAuditListQueryParams(params)
}

export async function listAuditLogs(
  params: AuditListParams,
  signal?: AbortSignal,
): Promise<AuditListResponse> {
  const res = await api.get<AuditListResponse>("/audit-logs", {
    params: queryParams(params),
    signal,
  })
  return { data: res.data.data, meta: res.data.meta }
}

export async function getAuditLog(id: string): Promise<AuditLogDetail> {
  return unwrap(api.get<ApiSuccess<AuditLogDetail>>(`/audit-logs/${id}`))
}

export async function getAuditFilters(): Promise<AuditFiltersData> {
  return unwrap(api.get<ApiSuccess<AuditFiltersData>>("/audit-logs/filters"))
}
