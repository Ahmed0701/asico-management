import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useMemo } from "react"
import { useSearchParams } from "react-router"
import { parseListParams, setListParam } from "@/shared/query/listParams"
import { toApiError } from "@/shared/api/errors"
import { invalidateSiteReportsAfterWrite } from "../lib/siteReportsQueryCache"
import type {
  CreateSiteReportInput,
  SiteReportSortField,
  SiteReportsListParams,
  UpdateSiteReportInput,
} from "./site-reports.types"
import { SITE_REPORT_TYPES } from "./site-reports.types"
import * as api from "./site-reports.api"
import { isValidSiteReportsListSort } from "./site-reports.api"
import { onSiteReportsForbidden } from "./site-reports.errors"

const DEFAULT_LIMIT = 20

export const siteReportsKeys = {
  all: ["site-reports"] as const,
  list: (params: SiteReportsListParams) =>
    [...siteReportsKeys.all, "list", params] as const,
  detail: (id: string) => [...siteReportsKeys.all, "detail", id] as const,
}

function pickUuid(
  searchParams: URLSearchParams,
  key: string,
): string | undefined {
  const v = searchParams.get(key)?.trim()
  return v || undefined
}

function pickText(
  searchParams: URLSearchParams,
  key: string,
): string | undefined {
  const v = searchParams.get(key)?.trim()
  return v || undefined
}

function pickDate(
  searchParams: URLSearchParams,
  key: string,
): string | undefined {
  const v = searchParams.get(key)?.trim()
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined
  return v
}

function pickEnum<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  allowed: readonly T[],
): T | undefined {
  const v = searchParams.get(key)?.trim()
  if (!v) return undefined
  return allowed.includes(v as T) ? v as T : undefined
}

function pickRating(searchParams: URLSearchParams): number | undefined {
  const v = searchParams.get("rating")?.trim()
  if (!v || !/^[1-5]$/.test(v)) return undefined
  return Number(v)
}

export function siteReportsListParamsFromSearch(
  searchParams: URLSearchParams,
): SiteReportsListParams {
  const base = parseListParams(searchParams, { limit: DEFAULT_LIMIT })
  const sortRaw = searchParams.get("sort")
  let sort: string | undefined
  if (sortRaw && isValidSiteReportsListSort(sortRaw)) sort = sortRaw
  return {
    page: base.page,
    limit: base.limit,
    sort,
    search: pickText(searchParams, "search"),
    villaId: pickUuid(searchParams, "villaId"),
    type: pickEnum(searchParams, "type", SITE_REPORT_TYPES),
    rating: pickRating(searchParams),
    visitFrom: pickDate(searchParams, "visitFrom"),
    visitTo: pickDate(searchParams, "visitTo"),
  }
}

export function hasActiveSiteReportsListFilters(
  params: SiteReportsListParams,
): boolean {
  return Boolean(
    params.villaId ||
      params.type ||
      params.rating !== undefined ||
      params.visitFrom ||
      params.visitTo,
  )
}

export function useSiteReportsListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(
    () => siteReportsListParamsFromSearch(searchParams),
    [searchParams],
  )
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(setListParam(searchParams, key, value))
  const setPage = (page: number) =>
    setSearchParams(setListParam(searchParams, "page", page))
  const setLimit = (limit: number) =>
    setSearchParams(setListParam(searchParams, "limit", limit))
  const clearFilters = () => {
    const next = new URLSearchParams()
    const keep = ["page", "limit", "sort", "search", "tab"]
    for (const key of keep) {
      const v = searchParams.get(key)
      if (v) next.set(key, v)
    }
    searchParams.forEach((value, key) => {
      if (key.startsWith("labour")) next.set(key, value)
    })
    setSearchParams(next)
  }
  const toggleSort = (field: SiteReportSortField) => {
    const current = params.sort ?? ""
    const asc = `${field}:asc`
    const desc = `${field}:desc`
    if (current === desc) setParam("sort", undefined)
    else if (current === asc) setParam("sort", desc)
    else setParam("sort", asc)
  }
  return { params, setParam, setPage, setLimit, clearFilters, toggleSort }
}

export function useSiteReportsListQuery(
  paramsOverride?: SiteReportsListParams,
) {
  const qc = useQueryClient()
  const { params: urlParams } = useSiteReportsListParams()
  const params = paramsOverride ?? urlParams
  return useQuery({
    queryKey: siteReportsKeys.list(params),
    queryFn: ({ signal }) => api.listSiteReports(params, signal),
    placeholderData: keepPreviousData,
    retry: (count, err) => {
      onSiteReportsForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useSiteReportQuery(id: string | undefined) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: siteReportsKeys.detail(id ?? ""),
    queryFn: () => api.getSiteReport(id!),
    enabled: !!id,
    retry: (count, err) => {
      onSiteReportsForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useCreateSiteReportMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      write,
    }: {
      input: CreateSiteReportInput
      write: import("@/shared/api/write-safety").WriteRequest
    }) => api.createSiteReport(input, write),
    onError: (err) => onSiteReportsForbidden(qc, toApiError(err)),
    onSuccess: (data) => {
      invalidateSiteReportsAfterWrite(qc, data.villa.id)
    },
  })
}

export function useUpdateSiteReportMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
      write,
    }: {
      id: string
      input: UpdateSiteReportInput
      write: import("@/shared/api/write-safety").WriteRequest
    }) => api.updateSiteReport(id, input, write),
    onError: (err) => onSiteReportsForbidden(qc, toApiError(err)),
    onSuccess: (data) => {
      invalidateSiteReportsAfterWrite(qc, data.villa.id)
      qc.setQueryData(siteReportsKeys.detail(data.id), data)
    },
  })
}

export function useDeleteSiteReportMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      write,
    }: {
      id: string
      write: import("@/shared/api/write-safety").WriteRequest
      villaId: string
    }) => api.deleteSiteReport(id, write),
    onError: (err) => onSiteReportsForbidden(qc, toApiError(err)),
    onSuccess: (_void, { id, villaId }) => {
      qc.removeQueries({ queryKey: siteReportsKeys.detail(id) })
      invalidateSiteReportsAfterWrite(qc, villaId)
    },
  })
}
