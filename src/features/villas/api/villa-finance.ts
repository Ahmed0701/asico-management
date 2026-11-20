import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess, PaginatedMeta } from "@/shared/api/types"
import { buildWriteHeaders, executeWrite } from "@/shared/api/write-safety"

export type FinanceUser = {
  id: string
  name: string
}

/**
 * A villa's money, all in minor units (KWD fils): its budget, its variation orders added up, the total budget (both),
 * the four costs, and what remains of the total.
 */
export type VillaFinance = {
  villaId: string
  budgetMinor: number | null
  currency: string | null
  variationOrdersMinor: number
  /** Budget plus variation orders; null without either, or when the budget is not in KWD. */
  totalBudgetMinor: number | null
  workOrderMinor: number | null
  /** The villa's share of the Department Overhead monthly salaries, hundredths of a percent (2500 = 25%). */
  salaryShareBp: number | null
  /** The Department Overhead monthly salaries added up (every employee). */
  overheadSalariesMinor: number
  /** Worked out by the server: the share of the overhead salaries; null without a share. */
  salariesMinor: number | null
  materialsMinor: number | null
  pettyCashMinor: number | null
  /** The villa's additional expenses (Department Overhead) added up; 0 when none. */
  expensesMinor: number
  totalCostsMinor: number
  /** Total budget minus costs (negative when over); null without a total budget. */
  remainingMinor: number | null
  /** 0 before the first save. */
  version: number
  updatedAt: string | null
  updatedBy: FinanceUser | null
}

export type FinanceVilla = {
  id: string
  villaNumber: string
  location: string
}

export type VillaFinanceListItem = VillaFinance & {
  villa: FinanceVilla
}

export type VillaFinanceSummary = {
  villaCount: number
  budgetMinor: number
  variationOrdersMinor: number
  totalBudgetMinor: number
  totalCostsMinor: number
  remainingMinor: number
  overBudgetCount: number
  overheadSalariesMinor: number
  /** Every villa's salary share added up, hundredths of a percent (10000 = all of it). */
  allocatedShareBp: number
}

export type VillaFinanceListParams = {
  page: number
  limit: number
  search?: string
  sort?: string
}

export type VillaFinanceListResponse = {
  data: VillaFinanceListItem[]
  meta: PaginatedMeta
  summary: VillaFinanceSummary
}

/** The four costs, in the order they are shown. */
export const FINANCE_FIELDS = [
  "workOrderMinor",
  "salariesMinor",
  "materialsMinor",
  "pettyCashMinor",
  "expensesMinor",
] as const
export type FinanceField = typeof FINANCE_FIELDS[number]
/** What a save may change: the villa's budget (in KWD), three costs, and the salary share; null clears one. */
export type VillaFinanceInput = Partial<Record<"budgetMinor" | "workOrderMinor" | "materialsMinor" | "pettyCashMinor", number | null>> & {
  salaryShareBp?: number | null
}

/** All of the Department Overhead salaries, in hundredths of a percent. */
export const FULL_SHARE_BP = 10_000

/** 2500 → "25", 3333 → "33.33". */
export function formatSharePercent(bp: number): string {
  return String(Number((bp / 100).toFixed(2)))
}

/** "25" or "33.33" (up to 2 decimals, 0 to 100) → hundredths of a percent; null when it is not one. */
export function parseSharePercent(text: string): number | null {
  if (!/^\d{1,3}([.,]\d{1,2})?$/.test(text)) return null
  const bp = Math.round(Number(text.replace(",", ".")) * 100)
  return bp <= FULL_SHARE_BP ? bp : null
}

/** The share of the overhead salaries, rounded to the fils (as the server works it out). */
export function salariesOfShare(
  overheadMinor: number,
  shareBp: number | null,
): number | null {
  return shareBp === null
    ? null
    : Math.round((overheadMinor * shareBp) / FULL_SHARE_BP)
}

export const villaFinanceKeys = {
  all: ["villas", "finance"] as const,
  villa: (villaId: string) => [...villaFinanceKeys.all, villaId] as const,
  list: (params: VillaFinanceListParams) =>
    [...villaFinanceKeys.all, "list", params] as const,
}

export async function getVillaFinance(
  villaId: string,
  signal?: AbortSignal,
): Promise<VillaFinance> {
  return unwrap(
    api.get<ApiSuccess<VillaFinance>>(`/villas/${villaId}/finance`, {
      signal,
    }),
  )
}

export async function listVillaFinance(
  params: VillaFinanceListParams,
  signal?: AbortSignal,
): Promise<VillaFinanceListResponse> {
  const query: Record<string, string | number> = {
    page: params.page,
    limit: params.limit,
  }
  if (params.search) query.search = params.search
  if (params.sort) query.sort = params.sort
  const res = await api.get<VillaFinanceListResponse>("/villa-finance", {
    params: query,
    signal,
  })
  return { data: res.data.data, meta: res.data.meta, summary: res.data.summary }
}

// The first save has no version to match; later ones send the one they read.
export async function saveVillaFinance(
  villaId: string,
  input: VillaFinanceInput,
  version: number,
): Promise<VillaFinance> {
  const write = version > 0 ? { ifMatch: version } : {}
  return executeWrite(write, () =>
    unwrap(
      api.put<ApiSuccess<VillaFinance>>(`/villas/${villaId}/finance`, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

/** Loaded the first time the card is opened. */
export function useVillaFinanceQuery(villaId: string, enabled: boolean) {
  return useQuery({
    queryKey: villaFinanceKeys.villa(villaId),
    queryFn: ({ signal }) => getVillaFinance(villaId, signal),
    enabled,
    retry: 1,
  })
}

export function useVillaFinanceListQuery(params: VillaFinanceListParams) {
  return useQuery({
    queryKey: villaFinanceKeys.list(params),
    queryFn: ({ signal }) => listVillaFinance(params, signal),
    placeholderData: keepPreviousData,
    retry: 1,
  })
}

type SaveArgs = {
  villaId: string
  input: VillaFinanceInput
  version: number
}

/** Saving changes the villa too (its budget): its page and the lists that show it read it again. */
export function useSaveVillaFinanceMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ villaId, input, version }: SaveArgs) =>
      saveVillaFinance(villaId, input, version),
    onSuccess: (data, { villaId }) => {
      qc.setQueryData(villaFinanceKeys.villa(villaId), data)
      void qc.invalidateQueries({ queryKey: villaFinanceKeys.all })
      void qc.invalidateQueries({ queryKey: ["villas"] })
    },
  })
}
