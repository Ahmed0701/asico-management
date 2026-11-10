import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import {
  buildWriteHeaders,
  executeWrite,
  type WriteRequest,
} from "@/shared/api/write-safety"
import type {
  BalanceListParams,
  BalanceListResponse,
  DeliveriesListParams,
  DeliveriesListResponse,
  DeliveryInput,
  Factory,
  FactoryType,
  ItemInput,
  MaterialDelivery,
  MaterialItem,
  MaterialsSummary,
} from "./materials.types"

// ---- factories ----

export async function listFactories(): Promise<Factory[]> {
  return unwrap(api.get<ApiSuccess<Factory[]>>("/factories"))
}

export async function createFactory(
  input: {
    name: string
    type: FactoryType
  },
  write: WriteRequest,
): Promise<Factory> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<Factory>>("/factories", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function renameFactory(
  id: string,
  name: string,
  version: number,
): Promise<Factory> {
  const write = { ifMatch: version }
  return executeWrite(write, () =>
    unwrap(
      api.patch<ApiSuccess<Factory>>(`/factories/${id}`, { name }, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function deleteFactory(
  id: string,
  version: number,
): Promise<void> {
  const write = { ifMatch: version }
  await executeWrite(write, () =>
    api.delete(`/factories/${id}`, { headers: buildWriteHeaders(write) }),
  )
}

// ---- the catalog of materials ----

export async function listItems(): Promise<MaterialItem[]> {
  return unwrap(api.get<ApiSuccess<MaterialItem[]>>("/material-items"))
}

export async function createItem(
  input: ItemInput,
  write: WriteRequest,
): Promise<MaterialItem> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<MaterialItem>>("/material-items", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function updateItem(
  id: string,
  input: Partial<ItemInput>,
  version: number,
): Promise<MaterialItem> {
  const write = { ifMatch: version }
  return executeWrite(write, () =>
    unwrap(
      api.patch<ApiSuccess<MaterialItem>>(`/material-items/${id}`, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function deleteItem(id: string, version: number): Promise<void> {
  const write = { ifMatch: version }
  await executeWrite(write, () =>
    api.delete(`/material-items/${id}`, {
      headers: buildWriteHeaders(write),
    }),
  )
}

// ---- the balance ----

export function buildBalanceQueryParams(
  params: BalanceListParams,
): Record<string, string | number> {
  const out: Record<string, string | number> = {
    page: params.page,
    limit: params.limit,
  }
  if (params.search) out.search = params.search
  if (params.itemId) out.itemId = params.itemId
  if (params.type) out.type = params.type
  if (params.status) out.status = params.status
  return out
}

export async function listBalance(
  params: BalanceListParams,
  signal?: AbortSignal,
): Promise<BalanceListResponse> {
  const res = await api.get<BalanceListResponse>("/material-balance", {
    params: buildBalanceQueryParams(params),
    signal,
  })
  return { data: res.data.data, meta: res.data.meta, totals: res.data.totals }
}

/** Sets a villa's own required quantities; null gives a material back the catalog's quantity. */
export async function setVillaRequirements(
  villaId: string,
  items: {
    itemId: string
    quantity: number | null
  }[],
): Promise<MaterialsSummary> {
  return unwrap(
    api.put<ApiSuccess<MaterialsSummary>>(
      `/villas/${villaId}/material-requirements`,
      { items },
    ),
  )
}

// ---- deliveries ----

export function buildDeliveriesQueryParams(
  params: DeliveriesListParams,
): Record<string, string | number> {
  const out: Record<string, string | number> = {
    page: params.page,
    limit: params.limit,
  }
  if (params.search) out.search = params.search
  if (params.villaId) out.villaId = params.villaId
  if (params.factoryId) out.factoryId = params.factoryId
  if (params.itemId) out.itemId = params.itemId
  if (params.type) out.type = params.type
  if (params.hasNote !== undefined)
    out.hasNote = params.hasNote ? "true" : "false"
  return out
}

export async function listDeliveries(
  params: DeliveriesListParams,
  signal?: AbortSignal,
): Promise<DeliveriesListResponse> {
  const res = await api.get<DeliveriesListResponse>("/material-deliveries", {
    params: buildDeliveriesQueryParams(params),
    signal,
  })
  return { data: res.data.data, meta: res.data.meta }
}

export async function createDelivery(
  input: DeliveryInput,
  write: WriteRequest,
): Promise<MaterialDelivery> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<MaterialDelivery>>("/material-deliveries", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function updateDelivery(
  id: string,
  input: Partial<DeliveryInput>,
  version: number,
): Promise<MaterialDelivery> {
  const write = { ifMatch: version }
  return executeWrite(write, () =>
    unwrap(
      api.patch<ApiSuccess<MaterialDelivery>>(
        `/material-deliveries/${id}`,
        input,
        {
          headers: buildWriteHeaders(write),
        },
      ),
    ),
  )
}

export async function deleteDelivery(
  id: string,
  version: number,
): Promise<void> {
  const write = { ifMatch: version }
  await executeWrite(write, () =>
    api.delete(`/material-deliveries/${id}`, {
      headers: buildWriteHeaders(write),
    }),
  )
}

/**
 * Adds delivery note files (PDF, JPG or PNG) to a delivery, up to 10 in all. The body is multipart: the client's default
 * JSON content type would turn the files into an empty JSON object, so it is set to multipart here (the browser adds the
 * boundary).
 */
export async function uploadDeliveryNotes(
  id: string,
  files: File[],
): Promise<MaterialDelivery> {
  const form = new FormData()
  for (const file of files) form.append("file", file)
  return unwrap(
    api.post<ApiSuccess<MaterialDelivery>>(
      `/material-deliveries/${id}/notes`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    ),
  )
}

export async function deleteDeliveryNote(
  id: string,
  noteId: string,
): Promise<MaterialDelivery> {
  return unwrap(
    api.delete<ApiSuccess<MaterialDelivery>>(
      `/material-deliveries/${id}/notes/${noteId}`,
    ),
  )
}

/**
 * Shows one delivery note file in a new tab. The tab is opened at once, inside the click, so a popup blocker allows it; the
 * file is fetched with the user's session and shown in it, and the tab is closed again if the file cannot be read.
 */
export async function viewDeliveryNote(
  id: string,
  noteId: string,
): Promise<void> {
  const tab = window.open("about:blank", "_blank")
  try {
    const res = await api.get<Blob>(
      `/material-deliveries/${id}/notes/${noteId}`,
      { responseType: "blob" },
    )
    const url = URL.createObjectURL(res.data)
    if (tab) {
      tab.location.href = url
    } else {
      window.location.assign(url)
    }
    // Revoked later, not at once: the new tab may still be reading it.
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (err) {
    tab?.close()
    throw err
  }
}

export async function getMaterialsSummary(
  villaId: string,
): Promise<MaterialsSummary> {
  return unwrap(
    api.get<ApiSuccess<MaterialsSummary>>(
      `/villas/${villaId}/materials-summary`,
    ),
  )
}
