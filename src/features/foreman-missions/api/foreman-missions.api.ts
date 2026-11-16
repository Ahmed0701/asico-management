import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import {
  buildWriteHeaders,
  executeWrite,
  type WriteRequest,
} from "@/shared/api/write-safety"
import type {
  ForemanMission,
  ForemanMissionInput,
  ForemanMissionsListParams,
  ForemanMissionsListResponse,
  ForemanMissionUpdate,
} from "./foreman-missions.types"

export function buildForemanMissionsQueryParams(
  params: ForemanMissionsListParams,
): Record<string, string | number> {
  const out: Record<string, string | number> = {
    page: params.page,
    limit: params.limit,
    done: params.done ? "true" : "false",
  }
  if (params.search) out.search = params.search
  // The done list shows the most recently finished first.
  if (params.sort) out.sort = params.sort
  else if (params.done) out.sort = "doneAt:desc"
  return out
}

export async function listForemanMissions(
  params: ForemanMissionsListParams,
  signal?: AbortSignal,
): Promise<ForemanMissionsListResponse> {
  const res = await api.get<ForemanMissionsListResponse>("/foreman-missions", {
    params: buildForemanMissionsQueryParams(params),
    signal,
  })
  return { data: res.data.data, meta: res.data.meta }
}

export async function createForemanMission(
  input: ForemanMissionInput,
  write: WriteRequest,
): Promise<ForemanMission> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<ForemanMission>>("/foreman-missions", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function updateForemanMission(
  id: string,
  input: ForemanMissionUpdate,
  write: WriteRequest,
): Promise<ForemanMission> {
  return executeWrite(write, () =>
    unwrap(
      api.patch<ApiSuccess<ForemanMission>>(`/foreman-missions/${id}`, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function deleteForemanMission(
  id: string,
  write: Pick<WriteRequest, "ifMatch">,
): Promise<void> {
  await executeWrite({ ...write }, () =>
    api.delete(`/foreman-missions/${id}`, {
      headers: buildWriteHeaders(write),
    }),
  )
}
