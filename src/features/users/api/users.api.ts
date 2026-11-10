import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import type { Paginated, PaginatedMeta } from "@/shared/api/types"
import {
  buildWriteHeaders,
  executeWrite,
  type WriteRequest,
} from "@/shared/api/write-safety"
import type {
  CreateUserInput,
  UpdateUserInput,
  UserDetail,
  UserListItem,
  UsersListParams,
} from "./users.types"

function queryParams(params: UsersListParams): Record<string, string | number> {
  const out: Record<string, string | number> = {
    page: params.page,
    limit: params.limit,
  }
  if (params.sort) out.sort = params.sort
  if (params.role) out.role = params.role
  if (params.isActive !== undefined) out.isActive = String(params.isActive)
  if (params.search) out.search = params.search
  return out
}

export async function listUsers(
  params: UsersListParams,
): Promise<Paginated<UserListItem>> {
  const res = await api.get<{
    data: UserListItem[]
    meta: PaginatedMeta
  }>("/users", { params: queryParams(params) })
  return { data: res.data.data, meta: res.data.meta }
}

export async function getUser(id: string): Promise<UserDetail> {
  return unwrap(api.get<ApiSuccess<UserDetail>>(`/users/${id}`))
}

export async function createUser(
  input: CreateUserInput,
  write: WriteRequest,
): Promise<UserDetail> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<UserDetail>>("/users", input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
  write: WriteRequest,
): Promise<UserListItem> {
  return executeWrite(write, () =>
    unwrap(
      api.patch<ApiSuccess<UserListItem>>(`/users/${id}`, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function activateUser(
  id: string,
  write: Pick<WriteRequest, "ifMatch">,
): Promise<UserListItem> {
  return executeWrite({ ...write }, () =>
    unwrap(
      api.patch<ApiSuccess<UserListItem>>(`/users/${id}/activate`, undefined, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function deactivateUser(
  id: string,
  write: Pick<WriteRequest, "ifMatch">,
): Promise<UserListItem> {
  return executeWrite({ ...write }, () =>
    unwrap(
      api.patch<ApiSuccess<UserListItem>>(
        `/users/${id}/deactivate`,
        undefined,
        { headers: buildWriteHeaders(write) },
      ),
    ),
  )
}

/** Deletes a user for good (not an ADMIN, not yourself, not one who created villas or uploaded villa documents). */
export async function deleteUser(id: string, version: number): Promise<void> {
  const write = { ifMatch: version }
  await executeWrite(write, () =>
    api.delete(`/users/${id}`, { headers: buildWriteHeaders(write) }),
  )
}

export async function resetUserPassword(
  id: string,
  write: WriteRequest,
): Promise<{ message: string }> {
  return executeWrite(write, () =>
    unwrap(
      api.post<ApiSuccess<{ message: string }>>(
        `/users/${id}/reset-password`,
        undefined,
        { headers: buildWriteHeaders(write) },
      ),
    ),
  )
}
