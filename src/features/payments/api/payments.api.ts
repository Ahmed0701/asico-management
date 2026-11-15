import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import {
  buildWriteHeaders,
  executeWrite,
  type WriteRequest,
} from "@/shared/api/write-safety"
import type {
  Payment,
  PaymentInput,
  PaymentsListParams,
  PaymentsListResponse,
  PaymentUpdate,
} from "./payments.types"

export function buildPaymentsQueryParams(
  params: PaymentsListParams,
): Record<string, string | number> {
  const out: Record<string, string | number> = {
    page: params.page,
    limit: params.limit,
  }
  if (params.sort) out.sort = params.sort
  if (params.search) out.search = params.search
  if (params.status) out.status = params.status
  if (params.contractorId) out.contractorId = params.contractorId
  if (params.villaId) out.villaId = params.villaId
  if (params.overdue) out.overdue = "true"
  return out
}

export async function listPayments(
  params: PaymentsListParams,
  signal?: AbortSignal,
): Promise<PaymentsListResponse> {
  const res = await api.get<PaymentsListResponse>("/payments", {
    params: buildPaymentsQueryParams(params),
    signal,
  })
  return { data: res.data.data, meta: res.data.meta, totals: res.data.totals }
}

export async function createPayment(
  input: PaymentInput,
  write: WriteRequest,
): Promise<Payment> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<Payment>>("/payments", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function updatePayment(
  id: string,
  input: PaymentUpdate,
  write: WriteRequest,
): Promise<Payment> {
  return executeWrite(write, () =>
    unwrap(
      api.patch<ApiSuccess<Payment>>(`/payments/${id}`, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function deletePayment(
  id: string,
  write: Pick<WriteRequest, "ifMatch">,
): Promise<void> {
  await executeWrite({ ...write }, () =>
    api.delete(`/payments/${id}`, { headers: buildWriteHeaders(write) }),
  )
}

export async function uploadPaymentFiles(
  id: string,
  files: File[],
): Promise<Payment> {
  const form = new FormData()
  for (const file of files) form.append("file", file)
  return unwrap(
    api.post<ApiSuccess<Payment>>(`/payments/${id}/files`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  )
}

export async function deletePaymentFile(
  id: string,
  fileId: string,
): Promise<Payment> {
  return unwrap(
    api.delete<ApiSuccess<Payment>>(`/payments/${id}/files/${fileId}`),
  )
}

/**
 * Shows one receipt or invoice in a new tab. The tab is opened at once, inside the click, so a popup blocker allows it;
 * the file is fetched with the user's session and shown in it, and the tab is closed again if the file cannot be read.
 */
export async function viewPaymentFile(
  id: string,
  fileId: string,
): Promise<void> {
  const tab = window.open("about:blank", "_blank")
  try {
    const res = await api.get<Blob>(`/payments/${id}/files/${fileId}`, {
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
