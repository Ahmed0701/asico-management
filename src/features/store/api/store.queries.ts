import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import type { WriteRequest } from "@/shared/api/write-safety"
import { SIDEBAR_COUNT_KEY } from "@/shared/layout/sidebarCountKey"
import * as api from "./store.api"
import type {
  StoreFactoryInput,
  StoreItemNameInput,
  StoreItemNameUpdate,
  StoreItemInput,
  StoreItemsParams,
  StoreItemUpdate,
  StoreMovementInput,
  StoreMovementsParams,
} from "./store.types"

export const storeKeys = {
  all: ["store"] as const,
  items: (params: StoreItemsParams) =>
    [...storeKeys.all, "items", params] as const,
  options: () => [...storeKeys.all, "options"] as const,
  factories: () => [...storeKeys.all, "factories"] as const,
  movements: (params: StoreMovementsParams) =>
    [...storeKeys.all, "movements", params] as const,
}

// Any write can change the stock, the low count, the movements and the sidebar's count of low items.
function invalidateStore(qc: QueryClient): void {
  void qc.invalidateQueries({ queryKey: storeKeys.all })
  void qc.invalidateQueries({ queryKey: SIDEBAR_COUNT_KEY })
}

export function useStoreItemsQuery(params: StoreItemsParams, enabled = true) {
  return useQuery({
    queryKey: storeKeys.items(params),
    queryFn: ({ signal }) => api.listStoreItems(params, signal),
    placeholderData: keepPreviousData,
    enabled,
    retry: 1,
  })
}

export function useStoreItemOptionsQuery(enabled = true) {
  return useQuery({
    queryKey: storeKeys.options(),
    queryFn: ({ signal }) => api.listStoreItemOptions(signal),
    enabled,
  })
}

export function useStoreMovementsQuery(
  params: StoreMovementsParams,
  enabled = true,
) {
  return useQuery({
    queryKey: storeKeys.movements(params),
    queryFn: ({ signal }) => api.listStoreMovements(params, signal),
    placeholderData: keepPreviousData,
    enabled,
    retry: 1,
  })
}

export function useCreateStoreItemMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      write,
    }: {
      input: StoreItemInput
      write: WriteRequest
    }) => api.createStoreItem(input, write),
    onSuccess: () => invalidateStore(qc),
  })
}

export function useUpdateStoreItemMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
      write,
    }: {
      id: string
      input: StoreItemUpdate
      write: WriteRequest
    }) => api.updateStoreItem(id, input, write),
    onSuccess: () => invalidateStore(qc),
  })
}

type DeleteArgs = {
  id: string
  version: number
}

export function useDeleteStoreItemMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, version }: DeleteArgs) =>
      api.deleteStoreItem(id, { ifMatch: version }),
    onSuccess: () => invalidateStore(qc),
  })
}

export function useCreateStoreMovementMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      write,
    }: {
      input: StoreMovementInput
      write: WriteRequest
    }) => api.createStoreMovement(input, write),
    onSuccess: () => invalidateStore(qc),
  })
}

export function useUndoStoreMovementMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.undoStoreMovement(id),
    onSuccess: () => invalidateStore(qc),
  })
}

/** The stores; they rarely change, so they are kept for the session. */
export function useStoreWarehousesQuery() {
  return useQuery({
    queryKey: [...storeKeys.all, "warehouses"] as const,
    queryFn: ({ signal }) => api.listStoreWarehouses(signal),
    staleTime: Infinity,
  })
}

export function useStoreFactoriesQuery(enabled = true) {
  return useQuery({
    queryKey: storeKeys.factories(),
    queryFn: ({ signal }) => api.listStoreFactories(signal),
    enabled,
  })
}

export function useCreateStoreFactoryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      write,
    }: {
      input: StoreFactoryInput
      write: WriteRequest
    }) => api.createStoreFactory(input, write),
    onSuccess: () => invalidateStore(qc),
  })
}

type FactoryRenameArgs = {
  id: string
  name: string
}

export function useRenameStoreFactoryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: FactoryRenameArgs) =>
      api.renameStoreFactory(id, name),
    onSuccess: () => invalidateStore(qc),
  })
}

export function useDeleteStoreFactoryMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteStoreFactory(id),
    onSuccess: () => invalidateStore(qc),
  })
}

export function useStoreItemNamesQuery() {
  return useQuery({
    queryKey: [...storeKeys.all, "item-names"] as const,
    queryFn: ({ signal }) => api.listStoreItemNames(signal),
  })
}

export function useCreateStoreItemNameMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      write,
    }: {
      input: StoreItemNameInput
      write: WriteRequest
    }) => api.createStoreItemName(input, write),
    onSuccess: () => invalidateStore(qc),
  })
}

type ItemNameUpdateArgs = {
  id: string
  input: StoreItemNameUpdate
}

export function useUpdateStoreItemNameMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: ItemNameUpdateArgs) =>
      api.updateStoreItemName(id, input),
    onSuccess: () => invalidateStore(qc),
  })
}

export function useDeleteStoreItemNameMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteStoreItemName(id),
    onSuccess: () => invalidateStore(qc),
  })
}
