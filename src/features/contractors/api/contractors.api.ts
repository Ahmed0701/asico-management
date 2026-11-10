import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import {
  buildWriteHeaders,
  executeWrite,
  type WriteRequest,
} from "@/shared/api/write-safety"
import type {
  Contractor,
  ContractorOption,
  ContractorSummaryParams,
  ContractorSummaryResponse,
  ContractorsListParams,
  ContractorsListResponse,
  CreateContractorInput,
  UpdateContractorInput,
} from "./contractors.types"

export const OPTIONS_CAP = 1000

function shouldOmitListSort(sort: string | undefined): boolean {
  if (!sort) return true
  return sort === "name" || sort === "name:asc"
}

function shouldOmitSummarySort(sort: string | undefined): boolean {
  if (!sort) return true
  return sort === "villaNumber" || sort === "villaNumber:asc"
}

export function buildContractorsListQueryParams(
  params: ContractorsListParams,
  options?: { forExport?: boolean },
): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  if (!options?.forExport) {
    out.page = params.page
    out.limit = params.limit
  }
  if (params.sort && !shouldOmitListSort(params.sort)) out.sort = params.sort
  if (params.search) out.search = params.search
  if (params.status) out.status = params.status
  return out
}

export function buildContractorSummaryQueryParams(
  params: ContractorSummaryParams,
  options?: { forExport?: boolean },
): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  if (!options?.forExport) {
    out.page = params.page
    out.limit = params.limit
  }
  if (params.sort && !shouldOmitSummarySort(params.sort)) {
    out.sort = params.sort
  }
  return out
}

function listQueryParams(params: ContractorsListParams) {
  return buildContractorsListQueryParams(params)
}

function summaryQueryParams(params: ContractorSummaryParams) {
  return buildContractorSummaryQueryParams(params)
}

export async function listContractors(
  params: ContractorsListParams,
  signal?: AbortSignal,
): Promise<ContractorsListResponse> {
  const res = await api.get<ContractorsListResponse>("/contractors", {
    params: listQueryParams(params),
    signal,
  })
  return { data: res.data.data, meta: res.data.meta }
}

export async function getContractor(id: string): Promise<Contractor> {
  return unwrap(api.get<ApiSuccess<Contractor>>(`/contractors/${id}`))
}

export async function listContractorOptions(): Promise<ContractorOption[]> {
  return unwrap(api.get<ApiSuccess<ContractorOption[]>>("/contractors/options"))
}

export async function getContractorSummary(
  id: string,
  params: ContractorSummaryParams,
  signal?: AbortSignal,
): Promise<ContractorSummaryResponse> {
  const res = await api.get<ContractorSummaryResponse>(
    `/contractors/${id}/summary`,
    { params: summaryQueryParams(params), signal },
  )
  return { data: res.data.data, meta: res.data.meta }
}

export async function createContractor(
  input: CreateContractorInput,
  write: WriteRequest,
): Promise<Contractor> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<Contractor>>("/contractors", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function updateContractor(
  id: string,
  input: UpdateContractorInput,
  write: WriteRequest,
): Promise<Contractor> {
  return executeWrite(write, () =>
    unwrap(
      api.patch<ApiSuccess<Contractor>>(`/contractors/${id}`, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function deleteContractor(
  id: string,
  write: Pick<WriteRequest, "ifMatch">,
): Promise<void> {
  await executeWrite({ ...write }, () =>
    api.delete(`/contractors/${id}`, {
      headers: buildWriteHeaders(write),
    }),
  )
}
