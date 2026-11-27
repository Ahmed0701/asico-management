import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import {
  buildWriteHeaders,
  executeWrite,
  type WriteRequest,
} from "@/shared/api/write-safety"
import type {
  StoreFactory,
  StoreFactoryInput,
  StoreItem,
  StoreItemInput,
  StoreItemName,
  StoreItemNameInput,
  StoreItemNameUpdate,
  StoreItemOption,
  StoreItemsParams,
  StoreItemsResponse,
  StoreItemUpdate,
  StoreMovement,
  StoreMovementInput,
  StoreMovementsParams,
  StoreMovementsResponse,
  StoreWarehouse,
} from "./store.types"

export function buildStoreItemsQueryParams(
  params: StoreItemsParams,
  options?: { forExport?: boolean },
): Record<string, string | number> {
  // An export takes the filters and the sort, never the paging.
  const out: Record<string, string | number> = options?.forExport
    ? {}
    : { page: params.page, limit: params.limit }
  if (params.search) out.search = params.search
  if (params.sort) out.sort = params.sort
  if (params.category) out.category = params.category
  if (params.factoryId) out.factoryId = params.factoryId
  if (params.warehouseId) out.warehouseId = params.warehouseId
  if (params.low) out.low = "true"
  if (params.active !== undefined) out.active = params.active ? "true" : "false"
  return out
}

export function buildStoreMovementsQueryParams(
  params: StoreMovementsParams,
  options?: { forExport?: boolean },
): Record<string, string | number> {
  // An export takes the filters and the sort, never the paging.
  const out: Record<string, string | number> = options?.forExport
    ? {}
    : { page: params.page, limit: params.limit }
  if (params.search) out.search = params.search
  if (params.warehouseId) out.warehouseId = params.warehouseId
  if (params.itemId) out.itemId = params.itemId
  if (params.villaId) out.villaId = params.villaId
  if (params.kind) out.kind = params.kind
  return out
}

export async function listStoreItems(
  params: StoreItemsParams,
  signal?: AbortSignal,
): Promise<StoreItemsResponse> {
  const res = await api.get<StoreItemsResponse>("/store/items", {
    params: buildStoreItemsQueryParams(params),
    signal,
  })
  return { data: res.data.data, meta: res.data.meta, summary: res.data.summary }
}

export function listStoreItemOptions(
  signal?: AbortSignal,
): Promise<StoreItemOption[]> {
  return unwrap(
    api.get<ApiSuccess<StoreItemOption[]>>("/store/items/options", { signal }),
  )
}

export async function listStoreMovements(
  params: StoreMovementsParams,
  signal?: AbortSignal,
): Promise<StoreMovementsResponse> {
  const res = await api.get<StoreMovementsResponse>("/store/movements", {
    params: buildStoreMovementsQueryParams(params),
    signal,
  })
  return { data: res.data.data, meta: res.data.meta }
}

export function createStoreItem(
  input: StoreItemInput,
  write: WriteRequest,
): Promise<StoreItem> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<StoreItem>>("/store/items", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export function updateStoreItem(
  id: string,
  input: StoreItemUpdate,
  write: WriteRequest,
): Promise<StoreItem> {
  return executeWrite(write, () =>
    unwrap(
      api.patch<ApiSuccess<StoreItem>>(`/store/items/${id}`, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function deleteStoreItem(
  id: string,
  write: Pick<WriteRequest, "ifMatch">,
): Promise<void> {
  await executeWrite({ ...write }, () =>
    api.delete(`/store/items/${id}`, { headers: buildWriteHeaders(write) }),
  )
}

export function listStoreWarehouses(
  signal?: AbortSignal,
): Promise<StoreWarehouse[]> {
  return unwrap(
    api.get<ApiSuccess<StoreWarehouse[]>>("/store/warehouses", { signal }),
  )
}

export function listStoreItemNames(
  signal?: AbortSignal,
): Promise<StoreItemName[]> {
  return unwrap(
    api.get<ApiSuccess<StoreItemName[]>>("/store/item-names", { signal }),
  )
}

export function createStoreItemName(
  input: StoreItemNameInput,
  write: WriteRequest,
): Promise<StoreItemName> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<StoreItemName>>("/store/item-names", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export function updateStoreItemName(
  id: string,
  input: StoreItemNameUpdate,
): Promise<StoreItemName> {
  return unwrap(
    api.patch<ApiSuccess<StoreItemName>>(`/store/item-names/${id}`, input),
  )
}

export async function deleteStoreItemName(id: string): Promise<void> {
  await api.delete(`/store/item-names/${id}`)
}

export function listStoreFactories(
  signal?: AbortSignal,
): Promise<StoreFactory[]> {
  return unwrap(
    api.get<ApiSuccess<StoreFactory[]>>("/store/factories", { signal }),
  )
}

export function createStoreFactory(
  input: StoreFactoryInput,
  write: WriteRequest,
): Promise<StoreFactory> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<StoreFactory>>("/store/factories", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export function renameStoreFactory(
  id: string,
  name: string,
): Promise<StoreFactory> {
  return unwrap(
    api.patch<ApiSuccess<StoreFactory>>(`/store/factories/${id}`, { name }),
  )
}

export async function deleteStoreFactory(id: string): Promise<void> {
  await api.delete(`/store/factories/${id}`)
}

export function createStoreMovement(
  input: StoreMovementInput,
  write: WriteRequest,
): Promise<StoreMovement> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<StoreMovement>>("/store/movements", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function undoStoreMovement(id: string): Promise<void> {
  await api.delete(`/store/movements/${id}`)
}
