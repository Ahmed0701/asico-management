import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import {
  buildWriteHeaders,
  executeWrite,
  type WriteRequest,
} from "@/shared/api/write-safety"
import type {
  OwnerNote,
  OwnerNoteInput,
  OwnerNotesListParams,
  OwnerNotesListResponse,
  OwnerNoteUpdate,
} from "./owner-notes.types"

export function buildOwnerNotesQueryParams(
  params: OwnerNotesListParams,
): Record<string, string | number> {
  const out: Record<string, string | number> = {
    page: params.page,
    limit: params.limit,
    done: params.done ? "true" : "false",
  }
  if (params.search) out.search = params.search
  // The done list shows the most recently finished first.
  if (params.done) out.sort = "doneAt:desc"
  return out
}

export async function listOwnerNotes(
  params: OwnerNotesListParams,
  signal?: AbortSignal,
): Promise<OwnerNotesListResponse> {
  const res = await api.get<OwnerNotesListResponse>("/owner-notes", {
    params: buildOwnerNotesQueryParams(params),
    signal,
  })
  return { data: res.data.data, meta: res.data.meta }
}

export async function createOwnerNote(
  input: OwnerNoteInput,
  write: WriteRequest,
): Promise<OwnerNote> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<OwnerNote>>("/owner-notes", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function updateOwnerNote(
  id: string,
  input: OwnerNoteUpdate,
  write: WriteRequest,
): Promise<OwnerNote> {
  return executeWrite(write, () =>
    unwrap(
      api.patch<ApiSuccess<OwnerNote>>(`/owner-notes/${id}`, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function deleteOwnerNote(
  id: string,
  write: Pick<WriteRequest, "ifMatch">,
): Promise<void> {
  await executeWrite({ ...write }, () =>
    api.delete(`/owner-notes/${id}`, {
      headers: buildWriteHeaders(write),
    }),
  )
}
