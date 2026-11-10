import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useMemo } from "react"
import { useSearchParams } from "react-router"
import { setListParam } from "@/shared/query/listParams"
import { toApiError } from "@/shared/api/errors"
import { invalidateDailyLabourAfterWrite } from "../lib/dailyLabourQueryCache"
import type {
  CreateDailyLabourInput,
  DailyLabourListParams,
  DailyLabourSortField,
  UpdateDailyLabourInput,
} from "./daily-labour.types"
import * as api from "./daily-labour.api"
import { isValidDailyLabourListSort } from "./daily-labour.api"
import { onDailyLabourForbidden } from "./daily-labour.errors"

const DEFAULT_LIMIT = 20
const DEFAULT_PAGE = 1

export const dailyLabourKeys = {
  all: ["daily-labour"] as const,
  list: (params: DailyLabourListParams) =>
    [...dailyLabourKeys.all, "list", params] as const,
  detail: (id: string) => [...dailyLabourKeys.all, "detail", id] as const,
}

function pickPrefixed(
  searchParams: URLSearchParams,
  key: string,
): string | undefined {
  const v = searchParams.get(`labour${key}`)?.trim()
  return v || undefined
}

function pickPrefixedDate(
  searchParams: URLSearchParams,
  key: string,
): string | undefined {
  const v = pickPrefixed(searchParams, key)
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined
  return v
}

export function dailyLabourListParamsFromSearch(
  searchParams: URLSearchParams,
): DailyLabourListParams {
  const pageRaw = searchParams.get("labourPage") ?? String(DEFAULT_PAGE)
  const limitRaw = searchParams.get("labourLimit") ?? String(DEFAULT_LIMIT)
  const page = Math.max(1, Number.parseInt(pageRaw, 10) || DEFAULT_PAGE)
  const limit = Math.max(1, Number.parseInt(limitRaw, 10) || DEFAULT_LIMIT)
  const sortRaw = searchParams.get("labourSort")
  let sort: string | undefined
  if (sortRaw && isValidDailyLabourListSort(sortRaw)) sort = sortRaw
  return {
    page,
    limit,
    sort,
    search: pickPrefixed(searchParams, "Search"),
    villaId: pickPrefixed(searchParams, "VillaId"),
    contractorId: pickPrefixed(searchParams, "ContractorId"),
    labourFrom: pickPrefixedDate(searchParams, "From"),
    labourTo: pickPrefixedDate(searchParams, "To"),
  }
}

export function hasActiveDailyLabourListFilters(
  params: DailyLabourListParams,
): boolean {
  return Boolean(
    params.villaId ||
      params.contractorId ||
      params.labourFrom ||
      params.labourTo,
  )
}

export type SiteReportsPageTab = "reports" | "labour"

export function useSiteReportsPageTab() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: SiteReportsPageTab =
    searchParams.get("tab") === "labour" ? "labour" : "reports"
  const setTab = (next: SiteReportsPageTab) =>
    setSearchParams(setListParam(searchParams, "tab", next))
  return { tab, setTab }
}

export function useDailyLabourListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(
    () => dailyLabourListParamsFromSearch(searchParams),
    [searchParams],
  )
  const setLabourParam = (suffix: string, value: string | undefined) =>
    setSearchParams(setListParam(searchParams, `labour${suffix}`, value))
  const setPage = (page: number) => setLabourParam("Page", String(page))
  const setLimit = (limit: number) => setLabourParam("Limit", String(limit))
  const clearFilters = () => {
    const next = new URLSearchParams(searchParams)
    for (const key of [
      "labourVillaId",
      "labourContractorId",
      "labourFrom",
      "labourTo",
    ]) {
      next.delete(key)
    }
    next.set("labourPage", "1")
    setSearchParams(next)
  }
  const toggleSort = (field: DailyLabourSortField) => {
    const current = params.sort ?? ""
    const asc = `${field}:asc`
    const desc = `${field}:desc`
    if (current === desc) setLabourParam("Sort", undefined)
    else if (current === asc) setLabourParam("Sort", desc)
    else setLabourParam("Sort", asc)
  }
  const setSearch = (value: string | undefined) =>
    setLabourParam("Search", value)
  return {
    params,
    setLabourParam,
    setPage,
    setLimit,
    clearFilters,
    toggleSort,
    setSearch,
  }
}

export function useDailyLabourListQuery(
  paramsOverride?: DailyLabourListParams,
) {
  const qc = useQueryClient()
  const { params: urlParams } = useDailyLabourListParams()
  const params = paramsOverride ?? urlParams
  return useQuery({
    queryKey: dailyLabourKeys.list(params),
    queryFn: ({ signal }) => api.listDailyLabour(params, signal),
    placeholderData: keepPreviousData,
    retry: (count, err) => {
      onDailyLabourForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useDailyLabourQuery(id: string | undefined) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: dailyLabourKeys.detail(id ?? ""),
    queryFn: () => api.getDailyLabour(id!),
    enabled: !!id,
    retry: (count, err) => {
      onDailyLabourForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useCreateDailyLabourMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      write,
    }: {
      input: CreateDailyLabourInput
      write: import("@/shared/api/write-safety").WriteRequest
    }) => api.createDailyLabour(input, write),
    onError: (err) => onDailyLabourForbidden(qc, toApiError(err)),
    onSuccess: (data) => {
      invalidateDailyLabourAfterWrite(qc, data.villa.id)
    },
  })
}

export function useUpdateDailyLabourMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
      write,
    }: {
      id: string
      input: UpdateDailyLabourInput
      write: import("@/shared/api/write-safety").WriteRequest
    }) => api.updateDailyLabour(id, input, write),
    onError: (err) => onDailyLabourForbidden(qc, toApiError(err)),
    onSuccess: (data) => {
      invalidateDailyLabourAfterWrite(qc, data.villa.id)
      qc.setQueryData(dailyLabourKeys.detail(data.id), data)
    },
  })
}

export function useDeleteDailyLabourMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      write,
    }: {
      id: string
      write: import("@/shared/api/write-safety").WriteRequest
      villaId: string
    }) => api.deleteDailyLabour(id, write),
    onError: (err) => onDailyLabourForbidden(qc, toApiError(err)),
    onSuccess: (_void, { id, villaId }) => {
      qc.removeQueries({ queryKey: dailyLabourKeys.detail(id) })
      invalidateDailyLabourAfterWrite(qc, villaId)
    },
  })
}
