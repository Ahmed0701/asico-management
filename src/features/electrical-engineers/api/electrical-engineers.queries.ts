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
  CreateElectricalEngineerInput,
  ElectricalEngineersListParams,
  UpdateElectricalEngineerInput,
} from "./electrical-engineers.types"
import * as api from "./electrical-engineers.api"
import { onElectricalEngineersForbidden } from "./electrical-engineers.errors"

const DEFAULT_LIMIT = 20
const OPTIONS_STALE_MS = 5 * 60 * 1000

const SORT_PATTERN = /^(name|createdAt)(:(asc|desc))?$/

export const electricalEngineersKeys = {
  all: ["electrical-engineers"] as const,
  list: (params: ElectricalEngineersListParams) =>
    [...electricalEngineersKeys.all, "list", params] as const,
  detail: (id: string) =>
    [...electricalEngineersKeys.all, "detail", id] as const,
  options: () => [...electricalEngineersKeys.all, "options"] as const,
}

export function electricalEngineersListParamsFromSearch(
  searchParams: URLSearchParams,
): ElectricalEngineersListParams {
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

export function useElectricalEngineersListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(
    () => electricalEngineersListParamsFromSearch(searchParams),
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

export function useElectricalEngineersListQuery() {
  const qc = useQueryClient()
  const { params } = useElectricalEngineersListParams()
  return useQuery({
    queryKey: electricalEngineersKeys.list(params),
    queryFn: ({ signal }) => api.listElectricalEngineers(params, signal),
    placeholderData: keepPreviousData,
    retry: (count, err) => {
      onElectricalEngineersForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useElectricalEngineerOptions() {
  const qc = useQueryClient()
  return useQuery({
    queryKey: [...electricalEngineersKeys.all, "options"] as const,
    queryFn: () => api.listElectricalEngineerOptions(),
    staleTime: OPTIONS_STALE_MS,
    retry: (count, err) => {
      const parsed = toApiError(err)
      onElectricalEngineersForbidden(qc, parsed)
      if (parsed.status === 403) return false
      return count < 1
    },
  })
}

export function useElectricalEngineerQuery(id: string | undefined) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: electricalEngineersKeys.detail(id ?? ""),
    queryFn: () => api.getElectricalEngineer(id!),
    enabled: !!id,
    retry: (count, err) => {
      onElectricalEngineersForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

function invalidateElectricalEngineers(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: electricalEngineersKeys.all })
}

export function useCreateElectricalEngineerMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      write,
    }: {
      input: CreateElectricalEngineerInput
      write: import("@/shared/api/write-safety").WriteRequest
    }) => api.createElectricalEngineer(input, write),
    onError: (err) => onElectricalEngineersForbidden(qc, toApiError(err)),
    onSuccess: () => invalidateElectricalEngineers(qc),
  })
}

export function useUpdateElectricalEngineerMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
      write,
    }: {
      id: string
      input: UpdateElectricalEngineerInput
      write: import("@/shared/api/write-safety").WriteRequest
    }) => api.updateElectricalEngineer(id, input, write),
    onError: (err) => onElectricalEngineersForbidden(qc, toApiError(err)),
    onSuccess: (item, { id }) => {
      invalidateElectricalEngineers(qc)
      qc.setQueryData(electricalEngineersKeys.detail(id), item)
    },
  })
}

export function useDeleteElectricalEngineerMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      write,
    }: {
      id: string
      write: Pick<import("@/shared/api/write-safety").WriteRequest, "ifMatch">
    }) => api.deleteElectricalEngineer(id, write),
    onError: (err) => onElectricalEngineersForbidden(qc, toApiError(err)),
    onSuccess: () => invalidateElectricalEngineers(qc),
  })
}
