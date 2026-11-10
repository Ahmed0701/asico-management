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
import { invalidateAreasAfterWrite } from "../lib/areasQueryCache"
import type {
  AreasListParams,
  CreateAreaInput,
  UpdateAreaInput,
} from "./areas.types"
import * as api from "./areas.api"
import { isValidAreaListSort } from "./areas.api"
import { onAreasForbidden } from "./areas.errors"

const DEFAULT_LIMIT = 20

export const areasKeys = {
  all: ["areas"] as const,
  list: (params: AreasListParams) =>
    [...areasKeys.all, "list", params] as const,
  detail: (id: string) => [...areasKeys.all, "detail", id] as const,
  options: () => [...areasKeys.all, "options"] as const,
}

export function areasListParamsFromSearch(
  searchParams: URLSearchParams,
): AreasListParams {
  const base = parseListParams(searchParams, { limit: DEFAULT_LIMIT })
  const sortRaw = searchParams.get("sort")
  let sort: string | undefined
  if (sortRaw && isValidAreaListSort(sortRaw)) sort = sortRaw
  const search = searchParams.get("search") ?? undefined
  return {
    page: base.page,
    limit: base.limit,
    sort,
    search,
  }
}

export function useAreasListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(
    () => areasListParamsFromSearch(searchParams),
    [searchParams],
  )
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(setListParam(searchParams, key, value))
  const setPage = (page: number) =>
    setSearchParams(setListParam(searchParams, "page", page))
  const setLimit = (limit: number) =>
    setSearchParams(setListParam(searchParams, "limit", limit))
  const toggleSort = (field: "name" | "city" | "villaCount" | "createdAt") => {
    const current = params.sort ?? ""
    const cycle = (asc: string, desc: string) => {
      if (current === desc) setParam("sort", undefined)
      else if (current === asc) setParam("sort", desc)
      else setParam("sort", asc)
    }
    if (field === "name") {
      if (current === "name:desc") setParam("sort", undefined)
      else setParam("sort", "name:desc")
      return
    }
    if (field === "city") cycle("city:asc", "city:desc")
    else if (field === "villaCount") cycle("villaCount:asc", "villaCount:desc")
    else cycle("createdAt:asc", "createdAt:desc")
  }
  const clearSearch = () => setParam("search", undefined)
  return {
    params,
    setParam,
    setPage,
    setLimit,
    toggleSort,
    clearSearch,
    searchParams,
  }
}

export function useAreasListQuery() {
  const qc = useQueryClient()
  const { params } = useAreasListParams()
  return useQuery({
    queryKey: areasKeys.list(params),
    queryFn: ({ signal }) => api.listAreas(params, signal),
    placeholderData: keepPreviousData,
    retry: (count, err) => {
      onAreasForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useAreaQuery(id: string | undefined) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: areasKeys.detail(id ?? ""),
    queryFn: () => api.getArea(id!),
    enabled: !!id,
    staleTime: 0,
    retry: (count, err) => {
      onAreasForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useCreateAreaMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      write,
    }: {
      input: CreateAreaInput
      write: Parameters<typeof api.createArea>[1]
    }) => api.createArea(input, write),
    onError: (err) => onAreasForbidden(qc, toApiError(err)),
    onSuccess: () => invalidateAreasAfterWrite(qc),
  })
}

export function useUpdateAreaMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
      write,
    }: {
      id: string
      input: UpdateAreaInput
      write: Parameters<typeof api.updateArea>[2]
    }) => api.updateArea(id, input, write),
    onError: (err) => onAreasForbidden(qc, toApiError(err)),
    onSuccess: () => invalidateAreasAfterWrite(qc),
  })
}

export function useDeleteAreaMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      write,
    }: {
      id: string
      write: Parameters<typeof api.deleteArea>[1]
    }) => api.deleteArea(id, write),
    onError: (err) => onAreasForbidden(qc, toApiError(err)),
    onSuccess: () => invalidateAreasAfterWrite(qc),
  })
}
