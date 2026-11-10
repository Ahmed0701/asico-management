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
  CreateVillaInput,
  UpdateVillaInput,
  VillasListParams,
  VillaType,
} from "./villas.types"
import { VILLA_TYPES } from "./villas.types"
import {
  invalidateAfterVillaPhaseProgress,
  invalidateVillaListsAndDashboard,
  patchVillaDetailFromListItem,
  patchVillaDetailFromPhaseUpdate,
  removeVillaDetailCache,
  setVillaDetailCache,
} from "../lib/villaQueryCache"
import * as api from "./villas.api"
import { isValidVillaListSort } from "./villas.api"
import { onVillasForbidden } from "./villas.errors"

const DEFAULT_LIMIT = 20
const OPTIONS_STALE_MS = 5 * 60 * 1000

export const villasKeys = {
  all: ["villas"] as const,
  list: (params: VillasListParams) =>
    [...villasKeys.all, "list", params] as const,
  detail: (id: string) => [...villasKeys.all, "detail", id] as const,
  options: () => [...villasKeys.all, "options"] as const,
  filters: () => [...villasKeys.all, "filters"] as const,
  areaOptions: () => [...villasKeys.all, "areaOptions"] as const,
}

function pickUuid(
  searchParams: URLSearchParams,
  key: string,
): string | undefined {
  const v = searchParams.get(key)?.trim()
  if (!v) return undefined
  return v
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

function pickBooleanFilter(
  searchParams: URLSearchParams,
  key: string,
): boolean | undefined {
  const v = searchParams.get(key)?.trim()
  if (v === "true") return true
  if (v === "false") return false
  return undefined
}

function pickVillaType(searchParams: URLSearchParams): VillaType | undefined {
  const v = searchParams.get("villaType")?.trim()
  return VILLA_TYPES.find((type) => type === v)
}

export function villasListParamsFromSearch(
  searchParams: URLSearchParams,
): VillasListParams {
  const base = parseListParams(searchParams, { limit: DEFAULT_LIMIT })
  const sortRaw = searchParams.get("sort")
  let sort: string | undefined
  if (sortRaw && isValidVillaListSort(sortRaw)) sort = sortRaw
  return {
    page: base.page,
    limit: base.limit,
    sort,
    search: pickText(searchParams, "search"),
    area: pickText(searchParams, "area"),
    areaId: pickUuid(searchParams, "areaId"),
    block: pickText(searchParams, "block"),
    plot: pickText(searchParams, "plot"),
    civilEngineerId: pickUuid(searchParams, "civilEngineerId"),
    electricalEngineerId: pickUuid(searchParams, "electricalEngineerId"),
    contractorId: pickUuid(searchParams, "contractorId"),
    villaType: pickVillaType(searchParams),
    startFrom: pickDate(searchParams, "startFrom"),
    startTo: pickDate(searchParams, "startTo"),
    targetFrom: pickDate(searchParams, "targetFrom"),
    targetTo: pickDate(searchParams, "targetTo"),
    mewFollowUp: pickBooleanFilter(searchParams, "mewFollowUp"),
    mewInspection: pickBooleanFilter(searchParams, "mewInspection"),
    mewInspectionPassed: pickBooleanFilter(searchParams, "mewInspectionPassed"),
  }
}

export function hasActiveVillaListFilters(params: VillasListParams): boolean {
  return Boolean(
    params.area ||
      params.areaId ||
      params.block ||
      params.plot ||
      params.civilEngineerId ||
      params.electricalEngineerId ||
      params.contractorId ||
      params.villaType ||
      params.startFrom ||
      params.startTo ||
      params.targetFrom ||
      params.targetTo ||
      params.mewFollowUp !== undefined ||
      params.mewInspection !== undefined ||
      params.mewInspectionPassed !== undefined,
  )
}

export function useVillasListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(
    () => villasListParamsFromSearch(searchParams),
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
    if (params.search) next.set("search", params.search)
    if (params.page !== 1) next.set("page", String(params.page))
    if (params.limit !== DEFAULT_LIMIT) next.set("limit", String(params.limit))
    if (params.sort) next.set("sort", params.sort)
    setSearchParams(next)
  }
  return { params, setParam, setPage, setLimit, clearFilters, searchParams }
}

export function useVillasListQuery() {
  const qc = useQueryClient()
  const { params } = useVillasListParams()
  return useQuery({
    queryKey: villasKeys.list(params),
    queryFn: ({ signal }) => api.listVillas(params, signal),
    placeholderData: keepPreviousData,
    retry: (count, err) => {
      onVillasForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useVillaQuery(id: string | undefined) {
  const qc = useQueryClient()
  return useQuery({
    queryKey: villasKeys.detail(id ?? ""),
    queryFn: () => api.getVilla(id!),
    enabled: !!id,
    retry: (count, err) => {
      onVillasForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useVillaFiltersQuery() {
  const qc = useQueryClient()
  return useQuery({
    queryKey: villasKeys.filters(),
    queryFn: () => api.listVillaFilters(),
    staleTime: OPTIONS_STALE_MS,
    retry: (count, err) => {
      onVillasForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useAreaOptionsQuery() {
  const qc = useQueryClient()
  return useQuery({
    queryKey: villasKeys.areaOptions(),
    queryFn: () => api.listAreaOptions(),
    staleTime: OPTIONS_STALE_MS,
    retry: (count, err) => {
      onVillasForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useVillaOptionsQuery() {
  const qc = useQueryClient()
  return useQuery({
    queryKey: villasKeys.options(),
    queryFn: () => api.listVillaOptions(),
    staleTime: OPTIONS_STALE_MS,
    retry: (count, err) => {
      onVillasForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useCreateVillaMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      write,
    }: {
      input: CreateVillaInput
      write: Parameters<typeof api.createVilla>[1]
    }) => api.createVilla(input, write),
    onError: (err) => onVillasForbidden(qc, toApiError(err)),
    onSuccess: (data) => {
      setVillaDetailCache(qc, data)
      invalidateVillaListsAndDashboard(qc)
    },
  })
}

export function useUpdateVillaMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
      write,
    }: {
      id: string
      input: UpdateVillaInput
      write: Parameters<typeof api.updateVilla>[2]
    }) => api.updateVilla(id, input, write),
    onError: (err) => onVillasForbidden(qc, toApiError(err)),
    onSuccess: (data) => {
      setVillaDetailCache(qc, data)
      invalidateVillaListsAndDashboard(qc)
    },
  })
}

export function useDeleteVillaMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      write,
    }: {
      id: string
      write: Parameters<typeof api.deleteVilla>[1]
    }) => api.deleteVilla(id, write),
    onError: (err) => onVillasForbidden(qc, toApiError(err)),
    onSuccess: (_void, { id }) => {
      removeVillaDetailCache(qc, id)
      invalidateVillaListsAndDashboard(qc)
    },
  })
}

export function useVillaMewFollowUpMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      marked,
      write,
    }: {
      id: string
      marked: boolean
      write: Parameters<typeof api.markVillaMewFollowUp>[1]
    }) =>
      marked
        ? api.markVillaMewFollowUp(id, write)
        : api.unmarkVillaMewFollowUp(id, write),
    onError: (err) => onVillasForbidden(qc, toApiError(err)),
    onSuccess: (item) => {
      patchVillaDetailFromListItem(qc, item)
      invalidateVillaListsAndDashboard(qc)
    },
  })
}

export function useUpdateVillaPhaseProgressMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      villaId,
      elecPhaseId,
      progress,
      write,
    }: {
      villaId: string
      elecPhaseId: string
      progress: number
      write: Parameters<typeof api.updateVillaPhaseProgress>[3]
    }) => api.updateVillaPhaseProgress(villaId, elecPhaseId, progress, write),
    onError: (err) => onVillasForbidden(qc, toApiError(err)),
    onSuccess: (update, { villaId }) => {
      patchVillaDetailFromPhaseUpdate(qc, villaId, update)
      invalidateAfterVillaPhaseProgress(qc, villaId)
      void api.getVilla(villaId).then((fresh) => {
        setVillaDetailCache(qc, fresh)
      })
    },
  })
}

/** List params with mewFollowUp=true fixed (MEW follow-up page). */
export function useMewFollowUpListParams() {
  const base = useVillasListParams()
  const params = useMemo(
    () => ({ ...base.params, mewFollowUp: true as const }),
    [base.params],
  )
  return { ...base, params }
}

export function useMewFollowUpListQuery() {
  const qc = useQueryClient()
  const { params } = useMewFollowUpListParams()
  return useQuery({
    queryKey: villasKeys.list(params),
    queryFn: ({ signal }) => api.listVillas(params, signal),
    placeholderData: keepPreviousData,
    retry: (count, err) => {
      onVillasForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useVillaMewInspectionMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      marked,
      write,
    }: {
      id: string
      marked: boolean
      write: Parameters<typeof api.markVillaMewInspection>[1]
    }) =>
      marked
        ? api.markVillaMewInspection(id, write)
        : api.unmarkVillaMewInspection(id, write),
    onError: (err) => onVillasForbidden(qc, toApiError(err)),
    onSuccess: (item) => {
      patchVillaDetailFromListItem(qc, item)
      invalidateVillaListsAndDashboard(qc)
    },
  })
}

export function useSetVillaMewStatesMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
      write,
    }: {
      id: string
      input: api.MewStatesInput
      write: Parameters<typeof api.setVillaMewStates>[2]
    }) => api.setVillaMewStates(id, input, write),
    onError: (err) => onVillasForbidden(qc, toApiError(err)),
    onSuccess: (item) => {
      patchVillaDetailFromListItem(qc, item)
      invalidateVillaListsAndDashboard(qc)
    },
  })
}

/** List params with mewInspection=true fixed (MEW inspection page); a villa that passed has left that list. */
export function useMewInspectionListParams() {
  const base = useVillasListParams()
  const params = useMemo(
    () => ({
      ...base.params,
      mewInspection: true as const,
      mewInspectionPassed: false as const,
    }),
    [base.params],
  )
  return { ...base, params }
}

export function useMewInspectionListQuery() {
  const qc = useQueryClient()
  const { params } = useMewInspectionListParams()
  return useQuery({
    queryKey: villasKeys.list(params),
    queryFn: ({ signal }) => api.listVillas(params, signal),
    placeholderData: keepPreviousData,
    retry: (count, err) => {
      onVillasForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}

export function useVillaMewInspectionPassedMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      passed,
      write,
    }: {
      id: string
      passed: boolean
      write: Parameters<typeof api.markVillaMewInspectionPassed>[1]
    }) =>
      passed
        ? api.markVillaMewInspectionPassed(id, write)
        : api.unmarkVillaMewInspectionPassed(id, write),
    onError: (err) => onVillasForbidden(qc, toApiError(err)),
    onSuccess: (item) => {
      patchVillaDetailFromListItem(qc, item)
      invalidateVillaListsAndDashboard(qc)
    },
  })
}

/** List params with mewInspectionPassed=true fixed (MEW inspection passed page). */
export function useMewInspectionPassedListParams() {
  const base = useVillasListParams()
  const params = useMemo(
    () => ({ ...base.params, mewInspectionPassed: true as const }),
    [base.params],
  )
  return { ...base, params }
}

export function useMewInspectionPassedListQuery() {
  const qc = useQueryClient()
  const { params } = useMewInspectionPassedListParams()
  return useQuery({
    queryKey: villasKeys.list(params),
    queryFn: ({ signal }) => api.listVillas(params, signal),
    placeholderData: keepPreviousData,
    retry: (count, err) => {
      onVillasForbidden(qc, toApiError(err))
      return count < 1
    },
  })
}
