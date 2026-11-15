import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import { useMemo } from "react"
import { useSearchParams } from "react-router"
import { dashboardKeys } from "@/features/dashboard/api/dashboard.queries"
import type { WriteRequest } from "@/shared/api/write-safety"
import { parseListParams, setListParam } from "@/shared/query/listParams"
import * as api from "./payments.api"
import {
  PAYMENT_STATUSES,
  type PaymentInput,
  type PaymentsListParams,
  type PaymentStatus,
  type PaymentUpdate,
} from "./payments.types"

export const paymentsKeys = {
  all: ["payments"] as const,
  list: (params: PaymentsListParams) =>
    [...paymentsKeys.all, "list", params] as const,
}

// The list, its totals and the dashboard change with any write.
function invalidatePayments(qc: QueryClient): void {
  void qc.invalidateQueries({ queryKey: paymentsKeys.all })
  void qc.invalidateQueries({ queryKey: dashboardKeys.summary() })
}

const SORT_PATTERN =
  /^(createdAt|dueDate|paidDate|amount|villaNumber)(:(asc|desc))?$/
const UUID = /^[0-9a-f-]{36}$/i

/** Page, size, search, sort and filters from the URL. */
export function usePaymentsListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo<PaymentsListParams>(() => {
    const base = parseListParams(searchParams, { limit: 20 })
    const sort = searchParams.get("sort") ?? ""
    const status = searchParams.get("status") as PaymentStatus | null
    const contractorId = searchParams.get("contractorId") ?? ""
    const villaId = searchParams.get("villaId") ?? ""
    return {
      page: base.page,
      limit: base.limit,
      search: base.search || undefined,
      sort: SORT_PATTERN.test(sort) ? sort : undefined,
      status: status && PAYMENT_STATUSES.includes(status) ? status : undefined,
      contractorId: UUID.test(contractorId) ? contractorId : undefined,
      villaId: UUID.test(villaId) ? villaId : undefined,
      overdue: searchParams.get("overdue") === "true" || undefined,
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

export function usePaymentsListQuery(params: PaymentsListParams) {
  return useQuery({
    queryKey: paymentsKeys.list(params),
    queryFn: ({ signal }) => api.listPayments(params, signal),
    placeholderData: keepPreviousData,
    retry: 1,
  })
}

export function useCreatePaymentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      write,
    }: {
      input: PaymentInput
      write: WriteRequest
    }) => api.createPayment(input, write),
    onSuccess: () => invalidatePayments(qc),
  })
}

type UpdateArgs = {
  id: string
  input: PaymentUpdate
  write: WriteRequest
}

export function useUpdatePaymentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input, write }: UpdateArgs) =>
      api.updatePayment(id, input, write),
    onSuccess: () => invalidatePayments(qc),
  })
}

type DeleteArgs = {
  id: string
  version: number
}

export function useDeletePaymentMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, version }: DeleteArgs) =>
      api.deletePayment(id, { ifMatch: version }),
    onSuccess: () => invalidatePayments(qc),
  })
}

type UploadArgs = {
  id: string
  files: File[]
}

export function useUploadPaymentFilesMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, files }: UploadArgs) =>
      api.uploadPaymentFiles(id, files),
    onSuccess: () => invalidatePayments(qc),
  })
}

type FileArgs = {
  id: string
  fileId: string
}

export function useDeletePaymentFileMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, fileId }: FileArgs) => api.deletePaymentFile(id, fileId),
    onSuccess: () => invalidatePayments(qc),
  })
}
