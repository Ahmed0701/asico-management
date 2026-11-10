import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import {
  buildWriteHeaders,
  executeWrite,
  type WriteRequest,
} from "@/shared/api/write-safety"
import type {
  MaintenanceInput,
  MaintenanceListParams,
  MaintenanceListResponse,
  MaintenanceUpdate,
  MaintenanceVilla,
} from "./maintenance.types"

export function buildMaintenanceQueryParams(
  params: MaintenanceListParams,
): Record<string, string | number> {
  const out: Record<string, string | number> = {
    page: params.page,
    limit: params.limit,
    solved: params.solved ? "true" : "false",
  }
  if (params.search) out.search = params.search
  // The solved list shows the most recently solved first.
  if (params.solved) out.sort = "solvedAt:desc"
  return out
}

export async function listMaintenance(
  params: MaintenanceListParams,
  signal?: AbortSignal,
): Promise<MaintenanceListResponse> {
  const res = await api.get<MaintenanceListResponse>("/maintenance", {
    params: buildMaintenanceQueryParams(params),
    signal,
  })
  return { data: res.data.data, meta: res.data.meta }
}

export async function createMaintenance(
  input: MaintenanceInput,
  write: WriteRequest,
): Promise<MaintenanceVilla> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<MaintenanceVilla>>("/maintenance", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function updateMaintenance(
  id: string,
  input: MaintenanceUpdate,
  write: WriteRequest,
): Promise<MaintenanceVilla> {
  return executeWrite(write, () =>
    unwrap(
      api.patch<ApiSuccess<MaintenanceVilla>>(`/maintenance/${id}`, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function deleteMaintenance(
  id: string,
  write: Pick<WriteRequest, "ifMatch">,
): Promise<void> {
  await executeWrite({ ...write }, () =>
    api.delete(`/maintenance/${id}`, {
      headers: buildWriteHeaders(write),
    }),
  )
}
