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
import type {
  CreateEngineerInput,
  EngineersListParams,
  UpdateEngineerInput,
} from "./engineers.types"
import * as api from "./engineers.api"
import { onEngineersForbidden } from "./engineers.errors"

const DEFAULT_LIMIT = 20
const OPTIONS_STALE_MS = 5 * 60 * 1000

const SORT_PATTERN = /^(name|createdAt)(:(asc|desc))?$/

export const engineersKeys = {
  all: ["engineers"] as const,
  list: (params: EngineersListParams) =>
    [...engineersKeys.all, "list", params] as const,
  detail: (id: string) => [...engineersKeys.all, "detail", id] as const,
  options: () => [...engineersKeys.all, "options"] as const,
}

export function engineersListParamsFromSearch(
  searchParams: URLSearchParams,
): EngineersListParams {
  const base = parseListParams(searchParams, { limit: DEFAULT_LIMIT })
  const sortRaw = searchParams.get("sort")
  let sort: string | undefined
  if (sortRaw && SORT_PATTERN.test(sortRaw)) sort = sortRaw
  const search = searchParams.get("search") ?? undefined
  return {
    page: base.page,
    limit: base.limit,
    sort,
    search,
  }
}

export function useEngineersListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(
    () => engineersListParamsFromSearch(searchParams),
    [searchParams],
  )
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(setListParam(searchParams, key, value))
  const setPage = (page: number) =>
    setSearchParams(setListParam(searchParams, "page", page))
  const setLimit = (limit: number) =>
    setSearchParams(setListParam(searchParams, "limit", limit))
  const toggleSort = (field: "name" | "createdAt") => {
    const current = params.sort ?? ""
    if (field === "name") {
      if (current === "name:desc") setParam("sort", undefined)
      else setParam("sort", "name:desc")
      return
    }
    if (current === "createdAt:desc") setParam("sort", "createdAt:asc")
    else if (current === "createdAt:asc") setParam("sort", undefined)
    else setParam("sort", "createdAt:desc")
  }
  const clearSearch = () => {
    setParam("search", undefined)
  }
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

export function useEngineersListQuery() {
  const qc = useQueryClient()
  const { params } = useEngineersListParams()
  return useQuery({
    queryKey: engineersKeys.list(params),
    queryFn: ({ signal }) => api.listEngineers(params, signal),
    placeholderData: keepPreviousData,
    retry: (count, err) => {
      onEngineersForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useEngineerQuery(id: string | undefined) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: engineersKeys.detail(id ?? ""),
    queryFn: () => api.getEngineer(id!),
    enabled: !!id,
    retry: (count, err) => {
      onEngineersForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useCivilEngineerOptions() {
  const qc = useQueryClient()
  return useQuery({
    queryKey: engineersKeys.options(),
    queryFn: () => api.listEngineerOptions(),
    staleTime: OPTIONS_STALE_MS,
    retry: (count, err) => {
      const parsed = toApiError(err)
      if (parsed.status === 403) return false
      onEngineersForbidden(qc, parsed)
      return count < 1
    },
  })
}

function invalidateEngineers(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: engineersKeys.all })
}

export function useCreateEngineerMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      write,
    }: {
      input: CreateEngineerInput
      write: import("@/shared/api/write-safety").WriteRequest
    }) => api.createEngineer(input, write),
    onError: (err) => onEngineersForbidden(qc, toApiError(err)),
    onSuccess: () => invalidateEngineers(qc),
  })
}

export function useUpdateEngineerMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
      write,
    }: {
      id: string
      input: UpdateEngineerInput
      write: import("@/shared/api/write-safety").WriteRequest
    }) => api.updateEngineer(id, input, write),
    onError: (err) => onEngineersForbidden(qc, toApiError(err)),
    onSuccess: (item, { id }) => {
      invalidateEngineers(qc)
      qc.setQueryData(engineersKeys.detail(id), item)
    },
  })
}

export function useDeleteEngineerMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      write,
    }: {
      id: string
      write: Pick<import("@/shared/api/write-safety").WriteRequest, "ifMatch">
    }) => api.deleteEngineer(id, write),
    onError: (err) => onEngineersForbidden(qc, toApiError(err)),
    onSuccess: () => invalidateEngineers(qc),
  })
}
