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
import { invalidateSmallWorksAfterWrite } from "../lib/smallWorksQueryCache"
import type {
  CreateSmallWorkInput,
  SmallWorkSortField,
  SmallWorksListParams,
  UpdateSmallWorkInput,
} from "./small-works.types"
import { SMALL_WORK_STATUSES } from "./small-works.types"
import * as api from "./small-works.api"
import { isValidSmallWorksListSort } from "./small-works.api"
import { onSmallWorksForbidden } from "./small-works.errors"

const DEFAULT_LIMIT = 20

export const smallWorksKeys = {
  all: ["small-works"] as const,
  list: (params: SmallWorksListParams) =>
    [...smallWorksKeys.all, "list", params] as const,
  detail: (id: string) => [...smallWorksKeys.all, "detail", id] as const,
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

function pickBoolFlag(
  searchParams: URLSearchParams,
  key: string,
): boolean | undefined {
  const v = searchParams.get(key)?.trim()
  if (v === "true") return true
  if (v === "false") return false
  return undefined
}

export function smallWorksListParamsFromSearch(
  searchParams: URLSearchParams,
): SmallWorksListParams {
  const base = parseListParams(searchParams, { limit: DEFAULT_LIMIT })
  const sortRaw = searchParams.get("sort")
  let sort: string | undefined
  if (sortRaw && isValidSmallWorksListSort(sortRaw)) sort = sortRaw
  return {
    page: base.page,
    limit: base.limit,
    sort,
    search: pickText(searchParams, "search"),
    villaId: pickUuid(searchParams, "villaId"),
    contractorId: pickUuid(searchParams, "contractorId"),
    status: pickEnum(searchParams, "status", SMALL_WORK_STATUSES),
    startFrom: pickDate(searchParams, "startFrom"),
    startTo: pickDate(searchParams, "startTo"),
    endFrom: pickDate(searchParams, "endFrom"),
    endTo: pickDate(searchParams, "endTo"),
    overdue: pickBoolFlag(searchParams, "overdue"),
    dueSoon: pickBoolFlag(searchParams, "dueSoon"),
  }
}

export function hasActiveSmallWorksListFilters(
  params: SmallWorksListParams,
): boolean {
  return Boolean(
    params.villaId ||
      params.contractorId ||
      params.status ||
      params.startFrom ||
      params.startTo ||
      params.endFrom ||
      params.endTo ||
      params.overdue !== undefined ||
      params.dueSoon !== undefined,
  )
}

export function useSmallWorksListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(
    () => smallWorksListParamsFromSearch(searchParams),
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
  const toggleSort = (field: SmallWorkSortField) => {
    const current = params.sort ?? ""
    const asc = `${field}:asc`
    const desc = `${field}:desc`
    if (current === desc) setParam("sort", undefined)
    else if (current === asc) setParam("sort", desc)
    else setParam("sort", asc)
  }
  return { params, setParam, setPage, setLimit, clearFilters, toggleSort }
}

export function useSmallWorksListQuery(paramsOverride?: SmallWorksListParams) {
  const qc = useQueryClient()
  const { params: urlParams } = useSmallWorksListParams()
  const params = paramsOverride ?? urlParams
  return useQuery({
    queryKey: smallWorksKeys.list(params),
    queryFn: ({ signal }) => api.listSmallWorks(params, signal),
    placeholderData: keepPreviousData,
    retry: (count, err) => {
      onSmallWorksForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useSmallWorkQuery(id: string | undefined) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: smallWorksKeys.detail(id ?? ""),
    queryFn: () => api.getSmallWork(id!),
    enabled: !!id,
    retry: (count, err) => {
      onSmallWorksForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useCreateSmallWorkMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      write,
    }: {
      input: CreateSmallWorkInput
      write: import("@/shared/api/write-safety").WriteRequest
    }) => api.createSmallWork(input, write),
    onError: (err) => onSmallWorksForbidden(qc, toApiError(err)),
    onSuccess: (data) => {
      invalidateSmallWorksAfterWrite(qc, data.villa.id)
    },
  })
}

export function useUpdateSmallWorkMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
      write,
    }: {
      id: string
      input: UpdateSmallWorkInput
      write: import("@/shared/api/write-safety").WriteRequest
    }) => api.updateSmallWork(id, input, write),
    onError: (err) => onSmallWorksForbidden(qc, toApiError(err)),
    onSuccess: (data) => {
      invalidateSmallWorksAfterWrite(qc, data.villa.id)
      qc.setQueryData(smallWorksKeys.detail(data.id), data)
    },
  })
}

export function useDeleteSmallWorkMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      write,
    }: {
      id: string
      write: import("@/shared/api/write-safety").WriteRequest
      villaId: string
    }) => api.deleteSmallWork(id, write),
    onError: (err) => onSmallWorksForbidden(qc, toApiError(err)),
    onSuccess: (_void, { id, villaId }) => {
      qc.removeQueries({ queryKey: smallWorksKeys.detail(id) })
      invalidateSmallWorksAfterWrite(qc, villaId)
    },
  })
}
