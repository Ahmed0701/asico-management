import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import {
  buildWriteHeaders,
  executeWrite,
  type WriteRequest,
} from "@/shared/api/write-safety"
import type {
  OverheadExpense,
  OverheadExpenseInput,
  OverheadExpenseListParams,
  OverheadExpenseListResponse,
  OverheadExpenseUpdate,
} from "./expenses.types"

const BASE = "/overhead-expenses"

export async function listOverheadExpenses(
  params: OverheadExpenseListParams,
  signal?: AbortSignal,
): Promise<OverheadExpenseListResponse> {
  const query: Record<string, string | number> = {
    page: params.page,
    limit: params.limit,
  }
  if (params.search) query.search = params.search
  if (params.villaId) query.villaId = params.villaId
  if (params.type) query.type = params.type
  if (params.sort) query.sort = params.sort
  const res = await api.get<OverheadExpenseListResponse>(BASE, {
    params: query,
    signal,
  })
  return { data: res.data.data, meta: res.data.meta, totals: res.data.totals }
}

export async function createOverheadExpense(
  input: OverheadExpenseInput,
  write: WriteRequest,
): Promise<OverheadExpense> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<OverheadExpense>>(BASE, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function updateOverheadExpense(
  id: string,
  input: OverheadExpenseUpdate,
  write: Pick<WriteRequest, "ifMatch">,
): Promise<OverheadExpense> {
  return executeWrite({ ...write }, () =>
    unwrap(
      api.patch<ApiSuccess<OverheadExpense>>(`${BASE}/${id}`, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function deleteOverheadExpense(
  id: string,
  write: Pick<WriteRequest, "ifMatch">,
): Promise<void> {
  await executeWrite({ ...write }, () =>
    api.delete(`${BASE}/${id}`, { headers: buildWriteHeaders(write) }),
  )
}

export async function uploadOverheadExpenseFiles(
  id: string,
  files: File[],
): Promise<OverheadExpense> {
  const form = new FormData()
  for (const file of files) form.append("file", file)
  return unwrap(
    api.post<ApiSuccess<OverheadExpense>>(`${BASE}/${id}/files`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  )
}

export async function deleteOverheadExpenseFile(
  id: string,
  fileId: string,
): Promise<OverheadExpense> {
  return unwrap(
    api.delete<ApiSuccess<OverheadExpense>>(`${BASE}/${id}/files/${fileId}`),
  )
}

/**
 * Shows one invoice file in a new tab. The tab is opened at once, inside the click, so a popup blocker allows it; the
 * file is fetched with the user's session and shown in it, and the tab is closed again if the file cannot be read.
 */
export async function viewOverheadExpenseFile(
  id: string,
  fileId: string,
): Promise<void> {
  const tab = window.open("about:blank", "_blank")
  try {
    const res = await api.get<Blob>(`${BASE}/${id}/files/${fileId}`, {
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
