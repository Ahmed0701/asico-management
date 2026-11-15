import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import {
  buildWriteHeaders,
  executeWrite,
  type WriteRequest,
} from "@/shared/api/write-safety"
import type {
  VariationOrder,
  VariationOrderInput,
  VariationOrdersResponse,
  VariationOrderUpdate,
} from "./variation-orders.types"

export async function listVariationOrders(
  villaId: string,
  signal?: AbortSignal,
): Promise<VariationOrdersResponse> {
  const res = await api.get<VariationOrdersResponse>(
    `/villas/${villaId}/variation-orders`,
    { signal },
  )
  return { data: res.data.data, totals: res.data.totals }
}

export async function createVariationOrder(
  villaId: string,
  input: VariationOrderInput,
  write: WriteRequest,
): Promise<VariationOrder> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<VariationOrder>>(
        `/villas/${villaId}/variation-orders`,
        input,
        { headers: buildWriteHeaders(write) },
      ),
    ),
  )
}

export async function updateVariationOrder(
  id: string,
  input: VariationOrderUpdate,
  write: WriteRequest,
): Promise<VariationOrder> {
  return executeWrite(write, () =>
    unwrap(
      api.patch<ApiSuccess<VariationOrder>>(`/variation-orders/${id}`, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function deleteVariationOrder(
  id: string,
  write: Pick<WriteRequest, "ifMatch">,
): Promise<void> {
  await executeWrite({ ...write }, () =>
    api.delete(`/variation-orders/${id}`, {
      headers: buildWriteHeaders(write),
    }),
  )
}

export async function uploadVariationOrderFiles(
  id: string,
  files: File[],
): Promise<VariationOrder> {
  const form = new FormData()
  for (const file of files) form.append("file", file)
  return unwrap(
    api.post<ApiSuccess<VariationOrder>>(
      `/variation-orders/${id}/files`,
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    ),
  )
}

export async function deleteVariationOrderFile(
  id: string,
  fileId: string,
): Promise<VariationOrder> {
  return unwrap(
    api.delete<ApiSuccess<VariationOrder>>(
      `/variation-orders/${id}/files/${fileId}`,
    ),
  )
}

/**
 * Shows one PDF in a new tab. The tab is opened at once, inside the click, so a popup blocker allows it; the file is
 * fetched with the user's session and shown in it, and the tab is closed again if the file cannot be read.
 */
export async function viewVariationOrderFile(
  id: string,
  fileId: string,
): Promise<void> {
  const tab = window.open("about:blank", "_blank")
  try {
    const res = await api.get<Blob>(`/variation-orders/${id}/files/${fileId}`, {
      responseType: "blob",
    })
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
