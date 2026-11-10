import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useMemo } from "react"
import { useSearchParams } from "react-router"
import { parseListParams, setListParam } from "@/shared/query/listParams"
import { toApiError } from "@/shared/api/errors"
import * as api from "./audit.api"
import type { AuditListParams } from "./audit.types"
import { useApiLocale } from "@/shared/lib/apiLocale"
import { onAuditForbidden } from "./audit.errors"

const DEFAULT_LIMIT = 20
const FILTERS_STALE_MS = 30 * 60 * 1000

export const auditKeys = {
  all: ["audit"] as const,
  list: (params: AuditListParams, lang: string) =>
    [...auditKeys.all, "list", lang, params] as const,
  detail: (id: string, lang: string) =>
    [...auditKeys.all, "detail", lang, id] as const,
  filters: (lang: string) => [...auditKeys.all, "filters", lang] as const,
}

export function auditListParamsFromSearch(
  searchParams: URLSearchParams,
): AuditListParams {
  const base = parseListParams(searchParams, { limit: DEFAULT_LIMIT })
  const sortRaw = searchParams.get("sort")
  let sort: AuditListParams["sort"]
  if (sortRaw === "createdAt:asc") sort = "createdAt:asc"
  else if (sortRaw === "createdAt:desc") sort = "createdAt:desc"
  const actorId = searchParams.get("actorId") ?? undefined
  const action = searchParams.get("action") ?? undefined
  const entity = searchParams.get("entity") ?? undefined
  const entityId = searchParams.get("entityId") ?? undefined
  const from = searchParams.get("from") ?? undefined
  const to = searchParams.get("to") ?? undefined
  const search = searchParams.get("search") ?? undefined
  return {
    page: base.page,
    limit: base.limit,
    sort,
    actorId,
    action,
    entity,
    entityId,
    from,
    to,
    search,
  }
}

export function useAuditListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(
    () => auditListParamsFromSearch(searchParams),
    [searchParams],
  )
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(setListParam(searchParams, key, value))
  const setPage = (page: number) =>
    setSearchParams(setListParam(searchParams, "page", page))
  const setLimit = (limit: number) =>
    setSearchParams(setListParam(searchParams, "limit", limit))
  const toggleTimeSort = () => {
    const next = params.sort === "createdAt:asc" ? undefined : "createdAt:asc"
    setParam("sort", next)
  }
  const clearAll = () => setSearchParams(new URLSearchParams())
  return {
    params,
    setParam,
    setPage,
    setLimit,
    toggleTimeSort,
    clearAll,
    searchParams,
    setSearchParams,
  }
}

export function useAuditListQuery() {
  const qc = useQueryClient()
  const lang = useApiLocale()
  const { params } = useAuditListParams()
  return useQuery({
    queryKey: auditKeys.list(params, lang),
    queryFn: ({ signal }) => api.listAuditLogs(params, signal),
    placeholderData: keepPreviousData,
    retry: (count, err) => {
      onAuditForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useAuditDetailQuery(id: string | undefined) {
  const qc = useQueryClient()
  const lang = useApiLocale()
  return useQuery({
    queryKey: auditKeys.detail(id ?? "", lang),
    queryFn: () => api.getAuditLog(id!),
    enabled: !!id,
    retry: (count, err) => {
      onAuditForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useAuditFiltersQuery() {
  const qc = useQueryClient()
  const lang = useApiLocale()
  return useQuery({
    queryKey: auditKeys.filters(lang),
    queryFn: () => api.getAuditFilters(),
    staleTime: FILTERS_STALE_MS,
    gcTime: FILTERS_STALE_MS,
    retry: (count, err) => {
      onAuditForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}
