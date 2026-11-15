import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import type { WriteRequest } from "@/shared/api/write-safety"
import * as api from "./variation-orders.api"
import type {
  VariationOrderInput,
  VariationOrderUpdate,
} from "./variation-orders.types"

export const variationOrdersKeys = {
  all: ["variation-orders"] as const,
  villa: (villaId: string) => [...variationOrdersKeys.all, villaId] as const,
}

function invalidate(qc: QueryClient): void {
  void qc.invalidateQueries({ queryKey: variationOrdersKeys.all })
}

/** The variation orders of a villa, fetched only when `enabled` (the card is open). */
export function useVariationOrdersQuery(villaId: string, enabled: boolean) {
  return useQuery({
    queryKey: variationOrdersKeys.villa(villaId),
    queryFn: ({ signal }) => api.listVariationOrders(villaId, signal),
    enabled,
    retry: 1,
  })
}

type CreateArgs = {
  villaId: string
  input: VariationOrderInput
  write: WriteRequest
}

export function useCreateVariationOrderMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ villaId, input, write }: CreateArgs) =>
      api.createVariationOrder(villaId, input, write),
    onSuccess: () => invalidate(qc),
  })
}

type UpdateArgs = {
  id: string
  input: VariationOrderUpdate
  write: WriteRequest
}

export function useUpdateVariationOrderMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input, write }: UpdateArgs) =>
      api.updateVariationOrder(id, input, write),
    onSuccess: () => invalidate(qc),
  })
}

type DeleteArgs = {
  id: string
  version: number
}

export function useDeleteVariationOrderMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, version }: DeleteArgs) =>
      api.deleteVariationOrder(id, { ifMatch: version }),
    onSuccess: () => invalidate(qc),
  })
}

type UploadArgs = {
  id: string
  files: File[]
}

export function useUploadVariationOrderFilesMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, files }: UploadArgs) =>
      api.uploadVariationOrderFiles(id, files),
    onSuccess: () => invalidate(qc),
  })
}

type FileArgs = {
  id: string
  fileId: string
}

export function useDeleteVariationOrderFileMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, fileId }: FileArgs) =>
      api.deleteVariationOrderFile(id, fileId),
    onSuccess: () => invalidate(qc),
  })
}
