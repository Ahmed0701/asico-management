import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useMemo } from "react"
import { useSearchParams } from "react-router"
import { parseListParams, setListParam } from "@/shared/query/listParams"
import {
  addManualPayment,
  getVillaPaymentHistory,
  listMonthlyProgress,
  payVilla,
  undoPayment,
} from "./monthly-progress.api"
import type {
  ManualPaymentInput,
  MonthlyProgressParams,
} from "./monthly-progress.types"

export const monthlyProgressKeys = {
  all: ["monthly-progress"] as const,
  list: (params: MonthlyProgressParams) =>
    [...monthlyProgressKeys.all, "list", params] as const,
  villa: (villaId: string) =>
    [...monthlyProgressKeys.all, "villa", villaId] as const,
}

const SORT_PATTERN = /^(villaNumber|current|unpaid|due)(:(asc|desc))?$/

/** Page, size, search, sort and filters from the URL; only the villas owed something unless every villa is asked for. */
export function useMonthlyProgressParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo<MonthlyProgressParams>(() => {
    const base = parseListParams(searchParams, { limit: 50 })
    const sort = searchParams.get("sort") ?? ""
    return {
      page: base.page,
      limit: base.limit,
      search: base.search || undefined,
      sort: SORT_PATTERN.test(sort) ? sort : undefined,
      owed: searchParams.get("all") !== "true",
      contractorId: searchParams.get("contractorId") || undefined,
    }
  }, [searchParams])
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(setListParam(searchParams, key, value))
  const setPage = (page: number) =>
    setSearchParams(setListParam(searchParams, "page", page))
  const setLimit = (limit: number) =>
    setSearchParams(setListParam(searchParams, "limit", limit))
  return { params, setParam, setPage, setLimit }
}

/** `enabled` false waits (the dashboard asks only for someone who may read villas). */
export function useMonthlyProgressQuery(
  params: MonthlyProgressParams,
  enabled = true,
) {
  return useQuery({
    queryKey: monthlyProgressKeys.list(params),
    queryFn: ({ signal }) => listMonthlyProgress(params, signal),
    enabled,
    placeholderData: keepPreviousData,
    retry: 1,
  })
}

/** A villa's payment history; `enabled` false waits (the card loads when it is opened). */
export function useVillaPaymentHistoryQuery(villaId: string, enabled = true) {
  return useQuery({
    queryKey: monthlyProgressKeys.villa(villaId),
    queryFn: ({ signal }) => getVillaPaymentHistory(villaId, signal),
    enabled,
    retry: 1,
  })
}

export function usePayVillaMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (villaId: string) => payVilla(villaId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: monthlyProgressKeys.all }),
  })
}

export function useAddManualPaymentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { villaId: string; input: ManualPaymentInput }) =>
      addManualPayment(args.villaId, args.input),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: monthlyProgressKeys.all }),
  })
}

export function useUndoPaymentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => undoPayment(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: monthlyProgressKeys.all }),
  })
}
