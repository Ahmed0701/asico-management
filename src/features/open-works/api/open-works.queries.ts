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
import { invalidateOpenWorksAfterWrite } from "../lib/openWorksQueryCache"
import type {
  CreateOpenWorkInput,
  OpenWorkSortField,
  OpenWorksListParams,
  UpdateOpenWorkInput,
} from "./open-works.types"
import { PRIORITIES, WORK_STATUSES } from "./open-works.types"
import * as api from "./open-works.api"
import { isValidOpenWorkListSort } from "./open-works.api"
import { onOpenWorksForbidden } from "./open-works.errors"

const DEFAULT_LIMIT = 20

export const openWorksKeys = {
  all: ["open-works"] as const,
  list: (params: OpenWorksListParams) =>
    [...openWorksKeys.all, "list", params] as const,
  detail: (id: string) => [...openWorksKeys.all, "detail", id] as const,
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

function pickOverdue(searchParams: URLSearchParams): boolean | undefined {
  const v = searchParams.get("overdue")?.trim()
  if (v === "true") return true
  if (v === "false") return false
  return undefined
}

export function openWorksListParamsFromSearch(
  searchParams: URLSearchParams,
): OpenWorksListParams {
  const base = parseListParams(searchParams, { limit: DEFAULT_LIMIT })
  const sortRaw = searchParams.get("sort")
  let sort: string | undefined
  if (sortRaw && isValidOpenWorkListSort(sortRaw)) sort = sortRaw
  return {
    page: base.page,
    limit: base.limit,
    sort,
    search: pickText(searchParams, "search"),
    villaId: pickUuid(searchParams, "villaId"),
    elecPhaseId: pickUuid(searchParams, "elecPhaseId"),
    status: pickEnum(searchParams, "status", WORK_STATUSES),
    priority: pickEnum(searchParams, "priority", PRIORITIES),
    contractorId: pickUuid(searchParams, "contractorId"),
    overdue: pickOverdue(searchParams),
    startFrom: pickDate(searchParams, "startFrom"),
    startTo: pickDate(searchParams, "startTo"),
    endFrom: pickDate(searchParams, "endFrom"),
    endTo: pickDate(searchParams, "endTo"),
  }
}

export function hasActiveOpenWorksListFilters(
  params: OpenWorksListParams,
): boolean {
  return Boolean(
    params.villaId ||
      params.elecPhaseId ||
      params.status ||
      params.priority ||
      params.contractorId ||
      params.overdue !== undefined ||
      params.startFrom ||
      params.startTo ||
      params.endFrom ||
      params.endTo,
  )
}

export function useOpenWorksListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(
    () => openWorksListParamsFromSearch(searchParams),
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
  const toggleSort = (field: OpenWorkSortField) => {
    const current = params.sort ?? ""
    const asc = `${field}:asc`
    const desc = `${field}:desc`
    if (current === desc) setParam("sort", undefined)
    else if (current === asc) setParam("sort", desc)
    else setParam("sort", asc)
  }
  return { params, setParam, setPage, setLimit, clearFilters, toggleSort }
}

export function useOpenWorksListQuery(
  paramsOverride?: OpenWorksListParams,
  options?: { enabled?: boolean },
) {
  const qc = useQueryClient()
  const { params: urlParams } = useOpenWorksListParams()
  const params = paramsOverride ?? urlParams
  return useQuery({
    queryKey: openWorksKeys.list(params),
    queryFn: ({ signal }) => api.listOpenWorks(params, signal),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    retry: (count, err) => {
      onOpenWorksForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

/** One villa's open works (up to 100), without reading the page URL; nothing is fetched until a villa is given. */
export function useVillaOpenWorksQuery(villaId: string | undefined) {
  const qc = useQueryClient()
  const params: OpenWorksListParams = { page: 1, limit: 100, villaId }
  return useQuery({
    queryKey: openWorksKeys.list(params),
    queryFn: ({ signal }) => api.listOpenWorks(params, signal),
    enabled: !!villaId,
    retry: (count, err) => {
      onOpenWorksForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useOpenWorkQuery(id: string | undefined) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: openWorksKeys.detail(id ?? ""),
    queryFn: () => api.getOpenWork(id!),
    enabled: !!id,
    retry: (count, err) => {
      onOpenWorksForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useCreateOpenWorkMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      write,
    }: {
      input: CreateOpenWorkInput
      write: import("@/shared/api/write-safety").WriteRequest
    }) => api.createOpenWork(input, write),
    onError: (err) => onOpenWorksForbidden(qc, toApiError(err)),
    onSuccess: (data) => {
      invalidateOpenWorksAfterWrite(qc, data.villa.id)
    },
  })
}

export function useUpdateOpenWorkMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
      write,
    }: {
      id: string
      input: UpdateOpenWorkInput
      write: import("@/shared/api/write-safety").WriteRequest
    }) => api.updateOpenWork(id, input, write),
    onError: (err) => onOpenWorksForbidden(qc, toApiError(err)),
    onSuccess: (data) => {
      invalidateOpenWorksAfterWrite(qc, data.villa.id)
      qc.setQueryData(openWorksKeys.detail(data.id), data)
    },
  })
}

export function useDeleteOpenWorkMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      write,
      villaId,
    }: {
      id: string
      write: import("@/shared/api/write-safety").WriteRequest
      villaId: string
    }) => api.deleteOpenWork(id, write),
    onError: (err) => onOpenWorksForbidden(qc, toApiError(err)),
    onSuccess: (_void, { id, villaId }) => {
      qc.removeQueries({ queryKey: openWorksKeys.detail(id) })
      invalidateOpenWorksAfterWrite(qc, villaId)
    },
  })
}
