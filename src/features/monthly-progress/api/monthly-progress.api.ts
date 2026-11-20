import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import type {
  MonthlyProgressParams,
  MonthlyProgressResponse,
  ManualPaymentInput,
  ProgressPayment,
  VillaPaymentHistory,
} from "./monthly-progress.types"

export function buildMonthlyProgressQueryParams(
  params: MonthlyProgressParams,
): Record<string, string | number> {
  const out: Record<string, string | number> = {
    page: params.page,
    limit: params.limit,
  }
  if (params.search) out.search = params.search
  if (params.sort) out.sort = params.sort
  if (params.owed !== undefined) out.owed = params.owed ? "true" : "false"
  if (params.contractorId) out.contractorId = params.contractorId
  return out
}

export async function listMonthlyProgress(
  params: MonthlyProgressParams,
  signal?: AbortSignal,
): Promise<MonthlyProgressResponse> {
  const res = await api.get<MonthlyProgressResponse>("/monthly-progress", {
    params: buildMonthlyProgressQueryParams(params),
    signal,
  })
  return { data: res.data.data, meta: res.data.meta, summary: res.data.summary }
}

/** A villa's payments, the latest first, and what is owed now. */
export async function getVillaPaymentHistory(
  villaId: string,
  signal?: AbortSignal,
): Promise<VillaPaymentHistory> {
  const res = await api.get<VillaPaymentHistory>(
    `/villas/${villaId}/progress-payments`,
    { signal },
  )
  return { data: res.data.data, summary: res.data.summary }
}

/** Pays the villa's contractor what it is owed now. */
export async function payVilla(villaId: string): Promise<ProgressPayment> {
  return unwrap(
    api.post<ApiSuccess<ProgressPayment>>(
      `/villas/${villaId}/progress-payments`,
    ),
  )
}

/** Enters a payment made before the system. */
export async function addManualPayment(
  villaId: string,
  input: ManualPaymentInput,
): Promise<ProgressPayment> {
  return unwrap(
    api.post<ApiSuccess<ProgressPayment>>(
      `/villas/${villaId}/progress-payments/manual`,
      input,
    ),
  )
}

/** Takes back a payment: the villa's latest, or one entered by hand. */
export async function undoPayment(id: string): Promise<void> {
  await api.delete(`/progress-payments/${id}`)
}
