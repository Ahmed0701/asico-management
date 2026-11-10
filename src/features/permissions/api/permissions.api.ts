import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"

export type PermissionGroup = {
  resource: string
  permissions: string[]
}

export type UserPermissions = {
  userId: string
  permissions: string[]
}

export async function listPermissionGroups(): Promise<PermissionGroup[]> {
  return unwrap(api.get<ApiSuccess<PermissionGroup[]>>("/permissions"))
}

export async function getUserPermissions(
  userId: string,
): Promise<UserPermissions> {
  return unwrap(
    api.get<ApiSuccess<UserPermissions>>(`/users/${userId}/permissions`),
  )
}

export async function replaceUserPermissions(
  userId: string,
  permissions: string[],
): Promise<UserPermissions> {
  return unwrap(
    api.put<ApiSuccess<UserPermissions>>(`/users/${userId}/permissions`, {
      permissions,
    }),
  )
}
