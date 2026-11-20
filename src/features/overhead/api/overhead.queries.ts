import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import type { WriteRequest } from "@/shared/api/write-safety"
import * as api from "./overhead.api"
import type {
  OverheadInput,
  OverheadListParams,
  OverheadUpdate,
} from "./overhead.types"

export const overheadKeys = {
  all: ["overhead"] as const,
  list: (params: OverheadListParams) =>
    [...overheadKeys.all, "list", params] as const,
}

// The villas' salaries are shares of the overhead salaries: they move with them.
function invalidate(qc: QueryClient): void {
  void qc.invalidateQueries({ queryKey: overheadKeys.all })
  void qc.invalidateQueries({ queryKey: ["villas", "finance"] })
}

export function useOverheadListQuery(params: OverheadListParams) {
  return useQuery({
    queryKey: overheadKeys.list(params),
    queryFn: ({ signal }) => api.listOverheadEmployees(params, signal),
    placeholderData: keepPreviousData,
    retry: 1,
  })
}

type CreateArgs = {
  input: OverheadInput
  write: WriteRequest
}

export function useCreateOverheadMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ input, write }: CreateArgs) =>
      api.createOverheadEmployee(input, write),
    onSuccess: () => invalidate(qc),
  })
}

type UpdateArgs = {
  id: string
  input: OverheadUpdate
  version: number
}

export function useUpdateOverheadMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input, version }: UpdateArgs) =>
      api.updateOverheadEmployee(id, input, { ifMatch: version }),
    onSuccess: () => invalidate(qc),
  })
}

type DeleteArgs = {
  id: string
  version: number
}

export function useDeleteOverheadMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, version }: DeleteArgs) =>
      api.deleteOverheadEmployee(id, { ifMatch: version }),
    onSuccess: () => invalidate(qc),
  })
}
