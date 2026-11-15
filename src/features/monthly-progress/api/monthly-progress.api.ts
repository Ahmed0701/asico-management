import { api } from "@/shared/api/client"
import type {
  MonthlyProgressParams,
  MonthlyProgressResponse,
} from "./monthly-progress.types"

export function buildMonthlyProgressQueryParams(
  params: MonthlyProgressParams,
): Record<string, string | number> {
  const out: Record<string, string | number> = {
    page: params.page,
    limit: params.limit,
  }
  if (params.month) out.month = params.month
  if (params.search) out.search = params.search
  if (params.sort) out.sort = params.sort
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
