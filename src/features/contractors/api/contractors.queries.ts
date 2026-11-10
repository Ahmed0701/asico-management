import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useMemo } from "react"
import { useSearchParams } from "react-router"
import { dashboardKeys } from "@/features/dashboard/api/dashboard.queries"
import { parseListParams, setListParam } from "@/shared/query/listParams"
import { toApiError } from "@/shared/api/errors"
import type {
  ContractorSummaryParams,
  ContractorsListParams,
  CreateContractorInput,
  UpdateContractorInput,
} from "./contractors.types"
import * as api from "./contractors.api"
import { onContractorsForbidden } from "./contractors.errors"

const DEFAULT_LIMIT = 20
const OPTIONS_STALE_MS = 5 * 60 * 1000

const LIST_SORT_PATTERN = /^(name|createdAt)(:(asc|desc))?$/
const SUMMARY_SORT_PATTERN =
  /^(villaNumber|startDate|targetDate)(:(asc|desc))?$/

export const contractorsKeys = {
  all: ["contractors"] as const,
  list: (params: ContractorsListParams) =>
    [...contractorsKeys.all, "list", params] as const,
  detail: (id: string) => [...contractorsKeys.all, "detail", id] as const,
  options: () => [...contractorsKeys.all, "options"] as const,
  summary: (id: string, params: ContractorSummaryParams) =>
    [...contractorsKeys.all, "summary", id, params] as const,
  /** @deprecated use options */
}

export function contractorsListParamsFromSearch(
  searchParams: URLSearchParams,
): ContractorsListParams {
  const base = parseListParams(searchParams, { limit: DEFAULT_LIMIT })
  const sortRaw = searchParams.get("sort")
  let sort: string | undefined
  if (sortRaw && LIST_SORT_PATTERN.test(sortRaw)) sort = sortRaw
  const search = searchParams.get("search") ?? undefined
  return {
    page: base.page,
    limit: base.limit,
    sort,
    search,
  }
}

export function useContractorsListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(
    () => contractorsListParamsFromSearch(searchParams),
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

export function contractorSummaryParamsFromSearch(
  searchParams: URLSearchParams,
): ContractorSummaryParams {
  const base = parseListParams(searchParams, { limit: DEFAULT_LIMIT })
  const sortRaw = searchParams.get("sort")
  let sort: string | undefined
  if (sortRaw && SUMMARY_SORT_PATTERN.test(sortRaw)) sort = sortRaw
  return {
    page: base.page,
    limit: base.limit,
    sort,
  }
}

export function useContractorSummaryParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(
    () => contractorSummaryParamsFromSearch(searchParams),
    [searchParams],
  )
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(setListParam(searchParams, key, value))
  const setPage = (page: number) =>
    setSearchParams(setListParam(searchParams, "page", page))
  const setLimit = (limit: number) =>
    setSearchParams(setListParam(searchParams, "limit", limit))
  const toggleSort = (field: "villaNumber" | "startDate" | "targetDate") => {
    const current = params.sort ?? ""
    if (field === "villaNumber") {
      if (current === "villaNumber:desc") setParam("sort", undefined)
      else setParam("sort", "villaNumber:desc")
      return
    }
    if (field === "startDate") {
      if (current === "startDate:desc") setParam("sort", "startDate:asc")
      else if (current === "startDate:asc") setParam("sort", undefined)
      else setParam("sort", "startDate:desc")
      return
    }
    if (current === "targetDate:desc") {
      setParam("sort", "targetDate:asc")
    } else if (current === "targetDate:asc") {
      setParam("sort", undefined)
    } else setParam("sort", "targetDate:desc")
  }
  return {
    params,
    setParam,
    setPage,
    setLimit,
    toggleSort,
    searchParams,
  }
}

export function useContractorsListQuery() {
  const qc = useQueryClient()
  const { params } = useContractorsListParams()
  return useQuery({
    queryKey: contractorsKeys.list(params),
    queryFn: ({ signal }) => api.listContractors(params, signal),
    placeholderData: keepPreviousData,
    retry: (count, err) => {
      onContractorsForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useContractorQuery(id: string | undefined) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: contractorsKeys.detail(id ?? ""),
    queryFn: () => api.getContractor(id!),
    enabled: !!id,
    retry: (count, err) => {
      onContractorsForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useContractorOptions() {
  const qc = useQueryClient()
  return useQuery({
    queryKey: contractorsKeys.options(),
    queryFn: () => api.listContractorOptions(),
    staleTime: OPTIONS_STALE_MS,
    retry: (count, err) => {
      const parsed = toApiError(err)
      if (parsed.status === 403) return false
      onContractorsForbidden(qc, parsed)
      return count < 1
    },
  })
}

export function useContractorSummaryQuery(id: string | undefined) {
  const qc = useQueryClient()
  const { params } = useContractorSummaryParams()
  return useQuery({
    queryKey: contractorsKeys.summary(id ?? "", params),
    queryFn: ({ signal }) => api.getContractorSummary(id!, params, signal),
    enabled: !!id,
    staleTime: 0,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    retry: (count, err) => {
      onContractorsForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

function invalidateContractors(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: contractorsKeys.all })
}

export function invalidateContractorsListsAndDashboard(
  qc: ReturnType<typeof useQueryClient>,
) {
  invalidateContractors(qc)
  void qc.invalidateQueries({ queryKey: dashboardKeys.summary() })
}

export function useCreateContractorMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      write,
    }: {
      input: CreateContractorInput
      write: import("@/shared/api/write-safety").WriteRequest
    }) => api.createContractor(input, write),
    onError: (err) => onContractorsForbidden(qc, toApiError(err)),
    onSuccess: () => invalidateContractors(qc),
  })
}

export function useUpdateContractorMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
      write,
    }: {
      id: string
      input: UpdateContractorInput
      write: import("@/shared/api/write-safety").WriteRequest
    }) => api.updateContractor(id, input, write),
    onError: (err) => onContractorsForbidden(qc, toApiError(err)),
    onSuccess: (item, { id }) => {
      invalidateContractors(qc)
      qc.setQueryData(contractorsKeys.detail(id), item)
    },
  })
}

export function useDeleteContractorMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      write,
    }: {
      id: string
      write: Pick<import("@/shared/api/write-safety").WriteRequest, "ifMatch">
    }) => api.deleteContractor(id, write),
    onError: (err) => onContractorsForbidden(qc, toApiError(err)),
    onSuccess: () => invalidateContractors(qc),
  })
}
