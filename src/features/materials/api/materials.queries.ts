import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import type { WriteRequest } from "@/shared/api/write-safety"
import * as api from "./materials.api"
import type {
  BalanceListParams,
  DeliveriesListParams,
  DeliveryInput,
  FactoryType,
  ItemInput,
} from "./materials.types"

export const materialsKeys = {
  all: ["materials"] as const,
  factories: () => [...materialsKeys.all, "factories"] as const,
  items: () => [...materialsKeys.all, "items"] as const,
  balance: (params: BalanceListParams) =>
    [...materialsKeys.all, "balance", params] as const,
  deliveries: (params: DeliveriesListParams) =>
    [...materialsKeys.all, "deliveries", params] as const,
  summary: (villaId: string) =>
    [...materialsKeys.all, "summary", villaId] as const,
}

// Every list, the factories (their delivery counts) and the villa summaries change with any write.
function invalidateMaterials(qc: QueryClient): void {
  void qc.invalidateQueries({ queryKey: materialsKeys.all })
}

export function useFactoriesQuery(enabled = true) {
  return useQuery({
    queryKey: materialsKeys.factories(),
    queryFn: () => api.listFactories(),
    enabled,
  })
}

export function useItemsQuery(enabled = true) {
  return useQuery({
    queryKey: materialsKeys.items(),
    queryFn: () => api.listItems(),
    enabled,
  })
}

export function useBalanceQuery(params: BalanceListParams) {
  return useQuery({
    queryKey: materialsKeys.balance(params),
    queryFn: ({ signal }) => api.listBalance(params, signal),
    placeholderData: keepPreviousData,
    retry: 1,
  })
}

type CreateItemArgs = {
  input: ItemInput
  write: WriteRequest
}

export function useCreateItemMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ input, write }: CreateItemArgs) =>
      api.createItem(input, write),
    onSuccess: () => invalidateMaterials(qc),
  })
}

type UpdateItemArgs = {
  id: string
  input: Partial<ItemInput>
  version: number
}

export function useUpdateItemMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input, version }: UpdateItemArgs) =>
      api.updateItem(id, input, version),
    onSuccess: () => invalidateMaterials(qc),
  })
}

type DeleteItemArgs = {
  id: string
  version: number
}

export function useDeleteItemMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, version }: DeleteItemArgs) =>
      api.deleteItem(id, version),
    onSuccess: () => invalidateMaterials(qc),
  })
}

type RequirementsArgs = {
  villaId: string
  items: {
    itemId: string
    quantity: number | null
  }[]
}

export function useSetRequirementsMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ villaId, items }: RequirementsArgs) =>
      api.setVillaRequirements(villaId, items),
    onSuccess: () => invalidateMaterials(qc),
  })
}

export function useDeliveriesQuery(params: DeliveriesListParams) {
  return useQuery({
    queryKey: materialsKeys.deliveries(params),
    queryFn: ({ signal }) => api.listDeliveries(params, signal),
    placeholderData: keepPreviousData,
    retry: 1,
  })
}

export function useMaterialsSummaryQuery(villaId: string) {
  return useQuery({
    queryKey: materialsKeys.summary(villaId),
    queryFn: () => api.getMaterialsSummary(villaId),
    retry: 1,
  })
}

type CreateFactoryArgs = {
  input: {
    name: string
    type: FactoryType
  }
  write: WriteRequest
}

export function useCreateFactoryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ input, write }: CreateFactoryArgs) =>
      api.createFactory(input, write),
    onSuccess: () => invalidateMaterials(qc),
  })
}

type RenameFactoryArgs = {
  id: string
  name: string
  version: number
}

export function useRenameFactoryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name, version }: RenameFactoryArgs) =>
      api.renameFactory(id, name, version),
    onSuccess: () => invalidateMaterials(qc),
  })
}

type VersionedId = {
  id: string
  version: number
}

export function useDeleteFactoryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, version }: VersionedId) =>
      api.deleteFactory(id, version),
    onSuccess: () => invalidateMaterials(qc),
  })
}

type CreateDeliveryArgs = {
  input: DeliveryInput
  write: WriteRequest
}

export function useCreateDeliveryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ input, write }: CreateDeliveryArgs) =>
      api.createDelivery(input, write),
    onSuccess: () => invalidateMaterials(qc),
  })
}

type UpdateDeliveryArgs = {
  id: string
  input: Partial<DeliveryInput>
  version: number
}

export function useUpdateDeliveryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input, version }: UpdateDeliveryArgs) =>
      api.updateDelivery(id, input, version),
    onSuccess: () => invalidateMaterials(qc),
  })
}

export function useDeleteDeliveryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, version }: VersionedId) =>
      api.deleteDelivery(id, version),
    onSuccess: () => invalidateMaterials(qc),
  })
}

type UploadNotesArgs = {
  id: string
  files: File[]
}

export function useUploadDeliveryNoteMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, files }: UploadNotesArgs) =>
      api.uploadDeliveryNotes(id, files),
    onSuccess: () => invalidateMaterials(qc),
  })
}

type DeleteNoteArgs = {
  id: string
  noteId: string
}

export function useDeleteDeliveryNoteMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, noteId }: DeleteNoteArgs) =>
      api.deleteDeliveryNote(id, noteId),
    onSuccess: () => invalidateMaterials(qc),
  })
}
