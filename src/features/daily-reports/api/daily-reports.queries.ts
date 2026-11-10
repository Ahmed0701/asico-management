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
import { invalidateDailyReportsAfterWrite } from "../lib/dailyReportsQueryCache"
import type {
  CreateDailyReportInput,
  DailyReportSortField,
  DailyReportsListParams,
  UpdateDailyReportInput,
} from "./daily-reports.types"
import { WEATHERS } from "./daily-reports.types"
import * as api from "./daily-reports.api"
import { isValidDailyReportListSort } from "./daily-reports.api"
import { onDailyReportsForbidden } from "./daily-reports.errors"

const DEFAULT_LIMIT = 20

export const dailyReportsKeys = {
  all: ["daily-reports"] as const,
  list: (params: DailyReportsListParams) =>
    [...dailyReportsKeys.all, "list", params] as const,
  detail: (id: string) => [...dailyReportsKeys.all, "detail", id] as const,
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

export function dailyReportsListParamsFromSearch(
  searchParams: URLSearchParams,
): DailyReportsListParams {
  const base = parseListParams(searchParams, { limit: DEFAULT_LIMIT })
  const sortRaw = searchParams.get("sort")
  let sort: string | undefined
  if (sortRaw && isValidDailyReportListSort(sortRaw)) sort = sortRaw
  return {
    page: base.page,
    limit: base.limit,
    sort,
    search: pickText(searchParams, "search"),
    contractorId: pickUuid(searchParams, "contractorId"),
    preparedByEngineerId: pickUuid(searchParams, "preparedByEngineerId"),
    weather: pickEnum(searchParams, "weather", WEATHERS),
    reportFrom: pickDate(searchParams, "reportFrom"),
    reportTo: pickDate(searchParams, "reportTo"),
  }
}

export function hasActiveDailyReportsListFilters(
  params: DailyReportsListParams,
): boolean {
  return Boolean(
    params.contractorId ||
      params.preparedByEngineerId ||
      params.weather ||
      params.reportFrom ||
      params.reportTo,
  )
}

export function useDailyReportsListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(
    () => dailyReportsListParamsFromSearch(searchParams),
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
    const keep = ["page", "limit", "sort", "search"]
    for (const key of keep) {
      const v = searchParams.get(key)
      if (v) next.set(key, v)
    }
    setSearchParams(next)
  }
  const toggleSort = (field: DailyReportSortField) => {
    const current = params.sort ?? ""
    const asc = `${field}:asc`
    const desc = `${field}:desc`
    if (current === desc) setParam("sort", undefined)
    else if (current === asc) setParam("sort", desc)
    else setParam("sort", asc)
  }
  return { params, setParam, setPage, setLimit, clearFilters, toggleSort }
}

export function useDailyReportsListQuery(
  paramsOverride?: DailyReportsListParams,
) {
  const qc = useQueryClient()
  const { params: urlParams } = useDailyReportsListParams()
  const params = paramsOverride ?? urlParams
  return useQuery({
    queryKey: dailyReportsKeys.list(params),
    queryFn: ({ signal }) => api.listDailyReports(params, signal),
    placeholderData: keepPreviousData,
    retry: (count, err) => {
      onDailyReportsForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useDailyReportQuery(id: string | undefined) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: dailyReportsKeys.detail(id ?? ""),
    queryFn: () => api.getDailyReport(id!),
    enabled: !!id,
    retry: (count, err) => {
      onDailyReportsForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useCreateDailyReportMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      write,
    }: {
      input: CreateDailyReportInput
      write: import("@/shared/api/write-safety").WriteRequest
    }) => api.createDailyReport(input, write),
    onError: (err) => onDailyReportsForbidden(qc, toApiError(err)),
    onSuccess: () => {
      invalidateDailyReportsAfterWrite(qc)
    },
  })
}

export function useUpdateDailyReportMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
      write,
    }: {
      id: string
      input: UpdateDailyReportInput
      write: import("@/shared/api/write-safety").WriteRequest
    }) => api.updateDailyReport(id, input, write),
    onError: (err) => onDailyReportsForbidden(qc, toApiError(err)),
    onSuccess: (data) => {
      invalidateDailyReportsAfterWrite(qc)
      qc.setQueryData(dailyReportsKeys.detail(data.id), data)
    },
  })
}

export function useDeleteDailyReportMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      write,
    }: {
      id: string
      write: import("@/shared/api/write-safety").WriteRequest
    }) => api.deleteDailyReport(id, write),
    onError: (err) => onDailyReportsForbidden(qc, toApiError(err)),
    onSuccess: (_void, { id }) => {
      qc.removeQueries({ queryKey: dailyReportsKeys.detail(id) })
      invalidateDailyReportsAfterWrite(qc)
    },
  })
}
