import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import type { WriteRequest } from "@/shared/api/write-safety"
import * as api from "./expenses.api"
import type {
  OverheadExpenseInput,
  OverheadExpenseListParams,
  OverheadExpenseUpdate,
} from "./expenses.types"

export const expenseKeys = {
  all: ["overhead", "expenses"] as const,
  list: (params: OverheadExpenseListParams) =>
    [...expenseKeys.all, "list", params] as const,
}

// A villa's expenses are one of its budget costs: the budget figures move with them.
function invalidate(qc: QueryClient): void {
  void qc.invalidateQueries({ queryKey: expenseKeys.all })
  void qc.invalidateQueries({ queryKey: ["villas", "finance"] })
}

export function useOverheadExpensesQuery(params: OverheadExpenseListParams) {
  return useQuery({
    queryKey: expenseKeys.list(params),
    queryFn: ({ signal }) => api.listOverheadExpenses(params, signal),
    placeholderData: keepPreviousData,
    retry: 1,
  })
}

type CreateArgs = {
  input: OverheadExpenseInput
  write: WriteRequest
}

export function useCreateExpenseMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ input, write }: CreateArgs) =>
      api.createOverheadExpense(input, write),
    onSuccess: () => invalidate(qc),
  })
}

type UpdateArgs = {
  id: string
  input: OverheadExpenseUpdate
  version: number
}

export function useUpdateExpenseMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input, version }: UpdateArgs) =>
      api.updateOverheadExpense(id, input, { ifMatch: version }),
    onSuccess: () => invalidate(qc),
  })
}

type DeleteArgs = {
  id: string
  version: number
}

export function useDeleteExpenseMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, version }: DeleteArgs) =>
      api.deleteOverheadExpense(id, { ifMatch: version }),
    onSuccess: () => invalidate(qc),
  })
}

type UploadArgs = {
  id: string
  files: File[]
}

export function useUploadExpenseFilesMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, files }: UploadArgs) =>
      api.uploadOverheadExpenseFiles(id, files),
    onSuccess: () => invalidate(qc),
  })
}

type FileArgs = {
  id: string
  fileId: string
}

export function useDeleteExpenseFileMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, fileId }: FileArgs) =>
      api.deleteOverheadExpenseFile(id, fileId),
    onSuccess: () => invalidate(qc),
  })
}
